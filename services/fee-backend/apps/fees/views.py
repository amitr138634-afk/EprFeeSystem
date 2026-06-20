from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum, Count, Q
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from .models import (
    FeeHead, FeeAmount, FeeStructure, DiscountHead, StudentFeeDiscount,
    FeeReceipt, FeeReceiptItem, AdditionalFee, DepositFee,
    BookSet, Book, BookSale, UniformItem, UniformSale, UniformSaleItem,
    AdmissionQuery, FeePaid, StudentFeeDetail, StudentFeeHeadMonthDiscount
)
from .serializers import (
    FeeHeadSerializer, FeeAmountSerializer, FeeStructureSerializer, DiscountHeadSerializer,
    StudentFeeDiscountSerializer, FeeReceiptSerializer, FeeReceiptListSerializer,
    PayFeeSerializer, AdditionalFeeSerializer, DepositFeeSerializer,
    BookSetSerializer, BookSerializer, BookSaleSerializer,
    UniformItemSerializer, UniformSaleSerializer,
    AdmissionQuerySerializer, AdmissionQueryListSerializer, FeePaidSerializer,
    StudentFeeHeadMonthDiscountSerializer
)
from utils.permissions import IsSchoolAdmin, IsSchoolStaff
from utils.session import SessionScopedMixin, current_session_year, resolve_session_field
import uuid


def generate_receipt_no(prefix='R'):
    return f"{prefix}{timezone.now().strftime('%Y%m%d')}{str(uuid.uuid4().int)[:6]}"


class FeeHeadListCreateView(SessionScopedMixin, generics.ListCreateAPIView):
    serializer_class = FeeHeadSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = FeeHead.objects.all().order_by('-created_at')


class FeeHeadDetailView(SessionScopedMixin, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FeeHeadSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = FeeHead.objects.all()


class FeeAmountListCreateView(SessionScopedMixin, generics.ListCreateAPIView):
    serializer_class = FeeAmountSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = FeeAmount.objects.all().order_by('head_name')

    def get_queryset(self):
        qs = super().get_queryset()
        class_id = self.request.query_params.get('class_id')
        type_param = self.request.query_params.get('type')
        if class_id:
            qs = qs.filter(class_id=class_id)
        if type_param:
            qs = qs.filter(type=type_param)
        return qs

    def create(self, request, *args, **kwargs):
        # Bulk create for multiple fee heads
        data_list = request.data if isinstance(request.data, list) else [request.data]
        serializer = self.get_serializer(data=data_list, many=True)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class FeeAmountDetailView(SessionScopedMixin, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FeeAmountSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = FeeAmount.objects.all()


class FeeAmountBulkUpdateView(APIView):
    permission_classes = [IsSchoolAdmin]
    
    def post(self, request):
        """Bulk update fee amounts for multiple heads"""
        updates = request.data.get('amounts', [])
        updated_count = 0
        
        for item in updates:
            fee_id = item.get('id')
            if fee_id:
                try:
                    fee_amount = FeeAmount.objects.get(id=fee_id)
                    for key, value in item.items():
                        if key != 'id' and hasattr(fee_amount, key):
                            setattr(fee_amount, key, value)
                    fee_amount.save()
                    updated_count += 1
                except FeeAmount.DoesNotExist:
                    pass
        
        return Response({
            'message': f'{updated_count} fee amounts updated successfully',
            'updated_count': updated_count
        })


class FeeStructureListCreateView(SessionScopedMixin, generics.ListCreateAPIView):
    serializer_class = FeeStructureSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = FeeStructure.objects.select_related('fee_head')

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        if params.get('class_id'):
            qs = qs.filter(class_id=params['class_id'])
        return qs


class DiscountHeadListCreateView(generics.ListCreateAPIView):
    serializer_class = DiscountHeadSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = DiscountHead.objects.filter(is_active=True)


class StudentFeeDiscountView(SessionScopedMixin, generics.ListCreateAPIView):
    serializer_class = StudentFeeDiscountSerializer
    permission_classes = [IsSchoolStaff]
    queryset = StudentFeeDiscount.objects.select_related('discount_head', 'fee_head')

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.query_params.get('student_id'):
            qs = qs.filter(student_id=self.request.query_params['student_id'])
        return qs


class PayFeeView(APIView):
    permission_classes = [IsSchoolStaff]

    def post(self, request):
        serializer = PayFeeSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        items_data = data.pop('items')

        total = sum(item.get('amount', 0) for item in items_data)
        discount = sum(item.get('discount', 0) for item in items_data)
        late_fine = data.get('late_fine', 0)
        net = total - discount + late_fine

        receipt = FeeReceipt.objects.create(
            receipt_no=generate_receipt_no(),
            student_id=data['student_id'],
            student_name=data['student_name'],
            class_name=data['class_name'],
            section_name=data['section_name'],
            admission_no=data['admission_no'],
            session_year=current_session_year() or data['session_year'],
            payment_date=data['payment_date'],
            payment_mode=data['payment_mode'],
            cheque_no=data.get('cheque_no', ''),
            cheque_date=data.get('cheque_date'),
            bank_name=data.get('bank_name', ''),
            transaction_id=data.get('transaction_id', ''),
            total_amount=total,
            discount_amount=discount,
            late_fine=late_fine,
            net_amount=net,
            remarks=data.get('remarks', ''),
            collected_by=request.user.id,
        )

        for item in items_data:
            FeeReceiptItem.objects.create(
                receipt=receipt,
                fee_head_id=item['fee_head_id'],
                amount=item.get('amount', 0),
                discount=item.get('discount', 0),
                net_amount=item.get('amount', 0) - item.get('discount', 0),
            )

        return Response(FeeReceiptSerializer(receipt).data, status=status.HTTP_201_CREATED)


class FeeReceiptListView(SessionScopedMixin, generics.ListAPIView):
    serializer_class = FeeReceiptListSerializer
    permission_classes = [IsSchoolStaff]
    queryset = FeeReceipt.objects.all()

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        if params.get('student_id'):
            qs = qs.filter(student_id=params['student_id'])
        if params.get('date'):
            qs = qs.filter(payment_date=params['date'])
        if params.get('from_date') and params.get('to_date'):
            qs = qs.filter(payment_date__range=[params['from_date'], params['to_date']])
        if params.get('class_name'):
            qs = qs.filter(class_name=params['class_name'])
        if params.get('payment_mode'):
            qs = qs.filter(payment_mode=params['payment_mode'])
        if params.get('status'):
            qs = qs.filter(status=params['status'])
        return qs


class FeeReceiptDetailView(SessionScopedMixin, generics.RetrieveAPIView):
    serializer_class = FeeReceiptSerializer
    permission_classes = [IsSchoolStaff]
    queryset = FeeReceipt.objects.all()


class DailyCollectionReportView(APIView):
    permission_classes = [IsSchoolStaff]

    def get(self, request):
        date = request.query_params.get('date', str(timezone.now().date()))
        receipts = FeeReceipt.objects.filter(payment_date=date, status='paid')
        session_year = current_session_year()
        if session_year:
            receipts = receipts.filter(session_year=session_year)
        total = receipts.aggregate(total=Sum('net_amount'))['total'] or 0
        by_mode = receipts.values('payment_mode').annotate(
            count=Count('id'), amount=Sum('net_amount')
        )
        return Response({
            'date': date,
            'total_receipts': receipts.count(),
            'total_amount': total,
            'by_payment_mode': list(by_mode),
        })


class ClasswiseCollectionReportView(APIView):
    permission_classes = [IsSchoolStaff]

    def get(self, request):
        params = request.query_params
        qs = FeeReceipt.objects.filter(status='paid')
        session_year = params.get('session_year') or current_session_year()
        if session_year:
            qs = qs.filter(session_year=session_year)
        if params.get('from_date') and params.get('to_date'):
            qs = qs.filter(payment_date__range=[params['from_date'], params['to_date']])
        data = qs.values('class_name').annotate(
            total_receipts=Count('id'),
            total_amount=Sum('net_amount'),
        ).order_by('class_name')
        return Response(list(data))


class FeeDefaulterView(APIView):
    permission_classes = [IsSchoolStaff]

    def get(self, request):
        params = request.query_params
        session_year = params.get('session_year') or current_session_year() or ''
        paid_student_ids = FeeReceipt.objects.filter(
            session_year=session_year, status='paid'
        ).values_list('student_id', flat=True).distinct()
        return Response({
            'paid_count': len(paid_student_ids),
            'session_year': session_year,
            'note': 'Cross reference with student list to find defaulters',
        })


class BookSetListCreateView(SessionScopedMixin, generics.ListCreateAPIView):
    serializer_class = BookSetSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = BookSet.objects.prefetch_related('books')


class BookListCreateView(generics.ListCreateAPIView):
    serializer_class = BookSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = Book.objects.filter(is_active=True)


class BookSaleView(APIView):
    permission_classes = [IsSchoolStaff]

    def post(self, request):
        data = request.data
        book_set = BookSet.objects.get(pk=data['book_set_id'])
        sale = BookSale.objects.create(
            student_id=data['student_id'],
            student_name=data['student_name'],
            book_set=book_set,
            sale_date=data.get('sale_date', str(timezone.now().date())),
            total_amount=book_set.total_amount,
            payment_mode=data.get('payment_mode', 'cash'),
            receipt_no=generate_receipt_no('BS'),
            collected_by=request.user.id,
        )
        return Response(BookSaleSerializer(sale).data, status=status.HTTP_201_CREATED)


class UniformItemListCreateView(generics.ListCreateAPIView):
    serializer_class = UniformItemSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = UniformItem.objects.filter(is_active=True)


class UniformSaleView(APIView):
    permission_classes = [IsSchoolStaff]

    def post(self, request):
        data = request.data
        items_data = data.get('items', [])
        total = sum(i['quantity'] * i['unit_price'] for i in items_data)
        sale = UniformSale.objects.create(
            student_id=data['student_id'],
            student_name=data['student_name'],
            sale_date=data.get('sale_date', str(timezone.now().date())),
            total_amount=total,
            payment_mode=data.get('payment_mode', 'cash'),
            receipt_no=generate_receipt_no('US'),
            collected_by=request.user.id,
        )
        for item in items_data:
            UniformSaleItem.objects.create(
                sale=sale,
                uniform_item_id=item['uniform_item_id'],
                quantity=item['quantity'],
                unit_price=item['unit_price'],
                total_price=item['quantity'] * item['unit_price'],
            )
        return Response(UniformSaleSerializer(sale).data, status=status.HTTP_201_CREATED)


class DepositFeeListCreateView(generics.ListCreateAPIView):
    serializer_class = DepositFeeSerializer
    permission_classes = [IsSchoolStaff]

    def get_queryset(self):
        qs = DepositFee.objects.all()
        if self.request.query_params.get('student_id'):
            qs = qs.filter(student_id=self.request.query_params['student_id'])
        return qs


class AdditionalFeeListCreateView(generics.ListCreateAPIView):
    serializer_class = AdditionalFeeSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = AdditionalFee.objects.filter(is_active=True)


class FeeStructureDetailView(SessionScopedMixin, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FeeStructureSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = FeeStructure.objects.all()


class DiscountHeadDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DiscountHeadSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = DiscountHead.objects.all()


class CancelReceiptView(APIView):
    permission_classes = [IsSchoolAdmin]

    def post(self, request, pk):
        try:
            receipt = FeeReceipt.objects.get(pk=pk)
            if receipt.status == 'cancelled':
                return Response({'detail': 'Receipt already cancelled.'}, status=status.HTTP_400_BAD_REQUEST)
            receipt.status = 'cancelled'
            receipt.remarks = request.data.get('reason', 'Cancelled by admin')
            receipt.save()
            return Response(FeeReceiptSerializer(receipt).data)
        except FeeReceipt.DoesNotExist:
            return Response({'detail': 'Receipt not found.'}, status=status.HTTP_404_NOT_FOUND)


class MonthlyCollectionReportView(APIView):
    permission_classes = [IsSchoolStaff]

    def get(self, request):
        params = request.query_params
        month = params.get('month')
        year = params.get('year')
        session_year = params.get('session_year') or current_session_year() or ''

        qs = FeeReceipt.objects.filter(status='paid')
        if session_year:
            qs = qs.filter(session_year=session_year)
        if month and year:
            qs = qs.filter(payment_date__month=month, payment_date__year=year)

        total = qs.aggregate(total=Sum('net_amount'))['total'] or 0
        by_mode = qs.values('payment_mode').annotate(
            count=Count('id'), amount=Sum('net_amount')
        )
        by_class = qs.values('class_name').annotate(
            count=Count('id'), amount=Sum('net_amount')
        ).order_by('class_name')

        return Response({
            'month': month,
            'year': year,
            'total_receipts': qs.count(),
            'total_amount': total,
            'by_payment_mode': list(by_mode),
            'by_class': list(by_class),
        })


class BookSetDetailView(SessionScopedMixin, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BookSetSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = BookSet.objects.all()


class BookDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BookSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = Book.objects.all()


class UniformItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UniformItemSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = UniformItem.objects.all()


class DepositFeeDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DepositFeeSerializer
    permission_classes = [IsSchoolStaff]
    queryset = DepositFee.objects.all()


class AdditionalFeeDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AdditionalFeeSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = AdditionalFee.objects.all()


class AdmissionQueryListCreateView(SessionScopedMixin, generics.ListCreateAPIView):
    permission_classes = [IsSchoolStaff]
    queryset = AdmissionQuery.objects.all()
    session_scope_create = False  # injected manually below alongside created_by

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return AdmissionQueryListSerializer
        return AdmissionQuerySerializer

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params

        # Filters
        if params.get('status'):
            qs = qs.filter(status=params['status'])
        if params.get('adm_status'):
            qs = qs.filter(adm_status=params['adm_status'])
        if params.get('class_id'):
            qs = qs.filter(class_id=params['class_id'])
        if params.get('source'):
            qs = qs.filter(source_of_information=params['source'])
        if params.get('search'):
            search = params['search']
            qs = qs.filter(
                Q(student_name__icontains=search) |
                Q(father_name__icontains=search) |
                Q(father_mobile__icontains=search) |
                Q(mother_mobile__icontains=search)
            )
        
        return qs
    
    def perform_create(self, serializer):
        extra = {'created_by': self.request.user.id if hasattr(self.request.user, 'id') else None}
        session_year = current_session_year()
        field = resolve_session_field(serializer.Meta.model) if session_year else None
        if field:
            extra[field] = session_year
        query = serializer.save(**extra)

        # Send email notification to father's email
        if query.father_email:
            self.send_query_email(query)
    
    def send_query_email(self, query):
        """Send admission query confirmation email"""
        try:
            subject = f'Admission Query Received - {query.student_name}'
            message = f"""
Dear {query.father_name},

Thank you for your interest in our school for admission of your child {query.student_name}.

Query Details:
- Student Name: {query.student_name}
- Class: {query.class_name}
- Session: {query.session}
- Date of Birth: {query.date_of_birth}
- Query Date: {query.query_date.strftime('%d-%m-%Y')}

We have received your admission query. Our team will contact you shortly on your registered mobile number ({query.father_mobile}).

For any immediate assistance, please feel free to contact us.

Best Regards,
School Administration
            """
            
            print(f"Attempting to send email to: {query.father_email}")
            print(f"From: {settings.DEFAULT_FROM_EMAIL}")
            print(f"Subject: {subject}")

            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[query.father_email],
                fail_silently=False,  # Changed to False to see errors
            )

            print(f"Email sent successfully to {query.father_email}")

        except Exception as e:
            print(f"Email sending failed: {str(e)}")
            print(f"Error type: {type(e).__name__}")
            import traceback
            print(traceback.format_exc())


class AdmissionQueryDetailView(SessionScopedMixin, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AdmissionQuerySerializer
    permission_classes = [IsSchoolStaff]
    queryset = AdmissionQuery.objects.all()


class AdmissionQueryStatusUpdateView(APIView):
    permission_classes = [IsSchoolStaff]
    
    def patch(self, request, pk):
        try:
            query = AdmissionQuery.objects.get(pk=pk)
            new_status = request.data.get('adm_status')
            remarks = request.data.get('remarks', '')
            follow_up_date = request.data.get('follow_up_date')
            
            if new_status:
                query.adm_status = new_status
            if remarks:
                query.remarks = remarks
            if follow_up_date:
                query.follow_up_date = follow_up_date
                
            query.save()
            
            return Response(AdmissionQuerySerializer(query).data)
        except AdmissionQuery.DoesNotExist:
            return Response({'detail': 'Query not found.'}, status=status.HTTP_404_NOT_FOUND)


class PayRegistrationFeeView(APIView):
    permission_classes = [IsSchoolStaff]
    
    def post(self, request):
        try:
            query_id = request.data.get('admission_query_id')
            query = AdmissionQuery.objects.get(pk=query_id)

            # Check if already paid
            if FeePaid.objects.filter(stu_id=query.id, type='EXTRA').exists():
                return Response(
                    {'detail': 'Registration fee already paid for this enquiry.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Generate receipt number
            rec_no = f"REG{timezone.now().strftime('%Y%m%d')}{str(uuid.uuid4().int)[:6]}"

            # Create payment record. Registration fee is paid before the
            # student is approved/created, so stu_id holds the admission
            # query's id (not a real student id) and type is 'EXTRA'.
            payment = FeePaid.objects.create(
                stu_id=query.id,
                type='EXTRA',
                session=query.session,
                amount=request.data.get('amount', 100.00),
                mode=request.data.get('payment_mode'),
                date=request.data.get('payment_date'),
                trans_id=request.data.get('transaction_id', ''),
                rec_no=rec_no,
            )

            # Update admission query status to 'registered' after payment
            query.adm_status = 'registered'
            query.save()

            return Response(
                FeePaidSerializer(payment).data,
                status=status.HTTP_201_CREATED
            )
            
        except AdmissionQuery.DoesNotExist:
            return Response(
                {'detail': 'Admission query not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class RegistrationReceiptView(APIView):
    permission_classes = [IsSchoolStaff]
    
    def get(self, request, pk):
        """Get registration receipt by admission query ID"""
        try:
            query = AdmissionQuery.objects.get(pk=pk)

            payment = FeePaid.objects.filter(stu_id=query.id, type='EXTRA').first()
            if payment is None:
                return Response(
                    {'detail': 'No payment record found for this enquiry.'},
                    status=status.HTTP_404_NOT_FOUND
                )

            receipt_data = {
                'receipt_no': payment.rec_no,
                'payment_date': payment.date,
                'student_name': query.student_name,
                'father_name': query.father_name,
                'class_name': query.class_name,
                'mobile': query.father_mobile,
                'session': query.session,
                'amount': payment.amount,
                'payment_mode': payment.mode,
                'transaction_id': payment.trans_id,
                'created_at': payment.created_at,
            }

            return Response(receipt_data)
            
        except AdmissionQuery.DoesNotExist:
            return Response(
                {'detail': 'Admission query not found.'},
                status=status.HTTP_404_NOT_FOUND
            )


class ApproveAdmissionView(APIView):
    permission_classes = [IsSchoolStaff]
    
    def post(self, request, pk):
        """Approve admission - creates student entry and fee details"""
        try:
            from apps.masters.models import Student
            from django.db import connections
            from utils.tenant import get_current_tenant
            
            query = AdmissionQuery.objects.get(pk=pk)
            
            # Check if registration fee is paid
            if not FeePaid.objects.filter(stu_id=query.id, type='EXTRA').exists():
                return Response(
                    {'detail': 'Registration fee must be paid before admission approval.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if already approved
            if query.adm_status == 'approved':
                return Response(
                    {'detail': 'This admission is already approved.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Fee structure must be defined for this class before admission can
            # proceed — otherwise there'd be nothing to bill the student for.
            fee_amounts = FeeAmount.objects.filter(
                class_id=query.class_id,
                type='new',
                session=query.session
            ).order_by('id')[:20]  # Max 20 heads

            if not fee_amounts:
                return Response(
                    {'detail': 'No fee structure defined for this class. Please define the fee structure before approving admission.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Generate admission number
            year = query.session.split('-')[0]
            last_student = Student.objects.filter(admission_no__startswith=f'STU{year}').order_by('-admission_no').first()
            if last_student:
                last_num = int(last_student.admission_no[-4:])
                new_num = last_num + 1
            else:
                new_num = 1
            admission_no = f'STU{year}{new_num:04d}'

            # Create student record
            student = Student.objects.create(
                admission_no=admission_no,
                student_name=query.student_name,
                father_name=query.father_name,
                mother_name=query.mother_name,
                date_of_birth=query.date_of_birth,
                gender=query.gender.upper()[0] if query.gender else 'M',
                father_mobile=query.father_mobile,
                mother_mobile=query.mother_mobile,
                father_email=query.father_email or '',
                mother_email=query.mother_email or '',
                class_name=query.class_id,
                section='1',  # SectionMaster id 1 = Section A; staff reassign the real section later
                type='new',   # New student
                session=query.session,
                admission_date=timezone.now().date(),
                status='active'
            )

            # Build dynamic column assignments for student_fee_details
            # Structure: head1_apr, head1_may, ..., head20_mar
            fee_data = {'stu_id': student.id, 'session': query.session}
            
            months_map = {
                'april': 'apr', 'may': 'may', 'june': 'jun', 
                'july': 'jul', 'august': 'aug', 'september': 'sep',
                'october': 'oct', 'november': 'nov', 'december': 'dec',
                'january': 'jan', 'february': 'feb', 'march': 'mar'
            }
            
            # Map each fee head to head1, head2, etc.
            for idx, fee in enumerate(fee_amounts, start=1):
                head_num = idx  # head1, head2, ...
                for month_full, month_abbr in months_map.items():
                    col_name = f'head{head_num}_{month_abbr}'
                    fee_data[col_name] = getattr(fee, month_full, 0)
            
            # Get the tenant database connection
            tenant_db = get_current_tenant()
            
            # Insert into student_fee_details using raw SQL with tenant connection
            columns = list(fee_data.keys())
            placeholders = ['%s'] * len(columns)
            values = [fee_data[col] for col in columns]
            
            insert_sql = f"""
                INSERT INTO student_fee_details ({', '.join(columns)})
                VALUES ({', '.join(placeholders)})
            """
            
            with connections[tenant_db].cursor() as cursor:
                cursor.execute(insert_sql, values)
            
            # Update admission query status
            query.adm_status = 'approved'
            query.status = 'admitted'
            query.save()
            
            return Response({
                'message': 'Admission approved successfully',
                'student_id': student.id,
                'admission_no': admission_no,
                'student_name': student.student_name,
                'fee_heads_assigned': len(fee_amounts)
            }, status=status.HTTP_200_OK)
            
        except AdmissionQuery.DoesNotExist:
            return Response(
                {'detail': 'Admission query not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return Response(
                {'detail': f'Error approving admission: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )


class UnapproveAdmissionView(APIView):
    permission_classes = [IsSchoolStaff]
    
    def post(self, request, pk):
        """Unapprove admission - revert to registered status"""
        try:
            query = AdmissionQuery.objects.get(pk=pk)
            
            remarks = request.data.get('remarks', '')
            if not remarks:
                return Response(
                    {'detail': 'Remarks are required for unapproving admission.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Update status
            query.adm_status = 'unapproved'
            query.status = 'rejected'
            query.remarks = remarks
            query.save()
            
            return Response({
                'message': 'Admission unapproved successfully',
                'query_id': query.id,
                'adm_status': query.adm_status
            }, status=status.HTTP_200_OK)
            
        except AdmissionQuery.DoesNotExist:
            return Response(
                {'detail': 'Admission query not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'detail': f'Error unapproving admission: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )



class StudentSearchView(APIView):
    """Search student by admission number"""
    permission_classes = [IsSchoolStaff]
    
    def get(self, request):
        from apps.masters.models import Student
        
        admission_no = request.query_params.get('admission_no', '').strip()
        
        if not admission_no:
            return Response(
                {'detail': 'Admission number is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            student = Student.objects.get(admission_no=admission_no)
            class_name, section_name = resolve_student_class_section(student)
            return Response({
                'id': student.id,
                'admission_no': student.admission_no,
                'student_name': student.student_name,
                'father_name': student.father_name,
                'class_name': class_name,
                'section': section_name,
                'session': student.session,
                'status': student.status
            })
        except Student.DoesNotExist:
            return Response(
                {'detail': 'Student not found with this admission number'},
                status=status.HTTP_404_NOT_FOUND
            )


class StudentsByClassView(APIView):
    """Get all students by class"""
    permission_classes = [IsSchoolStaff]
    
    def get(self, request):
        from apps.masters.models import Student
        
        class_name = request.query_params.get('class_name')
        session = request.query_params.get('session') or current_session_year()

        if not class_name:
            return Response(
                {'detail': 'class_name is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        students = Student.objects.filter(class_name=class_name, status='active')

        if session:
            students = students.filter(session=session)

        students = students.order_by('student_name')

        data = []
        for s in students:
            resolved_class, resolved_section = resolve_student_class_section(s)
            data.append({
                'id': s.id,
                'admission_no': s.admission_no,
                'student_name': s.student_name,
                'father_name': s.father_name,
                'class_name': resolved_class,
                'section': resolved_section,
                'type': s.type,
                'session': s.session,
                'admission_date': s.admission_date,
                'father_mobile': s.father_mobile
            })

        return Response(data)


MONTH_COLUMNS = ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar']
MONTH_NAMES = ['April', 'May', 'June', 'July', 'August', 'September',
               'October', 'November', 'December', 'January', 'February', 'March']
MONTH_NAME_MAP = dict(zip(MONTH_COLUMNS, MONTH_NAMES))
# StudentFeeDetail/FeeAmount columns use 3-letter abbreviations; FeeAmount's
# month fields are spelled out in full — this bridges the two.
MONTH_FULL_FIELD = {
    'apr': 'april', 'may': 'may', 'jun': 'june', 'jul': 'july',
    'aug': 'august', 'sep': 'september', 'oct': 'october', 'nov': 'november',
    'dec': 'december', 'jan': 'january', 'feb': 'february', 'mar': 'march',
}


def get_class_master_for_student(student):
    """Resolve a Student's ClassMaster row. `class_name` stores the
    ClassMaster id for students approved after the id-based refactor (see
    ApproveAdmissionView) — older rows still hold the class's display name,
    so fall back to a name match."""
    from apps.masters.models import ClassMaster

    class_master = None
    if str(student.class_name).isdigit():
        class_master = ClassMaster.objects.filter(
            id=student.class_name, session=student.session
        ).first()
    if class_master is None:
        class_master = ClassMaster.objects.filter(
            class_name=student.class_name, session=student.session
        ).first()
    return class_master


def get_section_master_for_student(student):
    """Resolve a Student's SectionMaster row. `section` stores the
    SectionMaster id directly (not a ClassSectionMaster id — that table only
    maps "which sections exist for a class", it doesn't identify a specific
    student's section). Older rows may hold the literal section letter
    instead, so fall back to a name match."""
    from apps.masters.models import SectionMaster

    section_master = None
    if str(student.section).isdigit():
        section_master = SectionMaster.objects.filter(id=student.section).first()
    if section_master is None:
        section_master = SectionMaster.objects.filter(section=student.section).first()
    return section_master


def resolve_student_class_section(student):
    """Display-ready (class_name, section_name) for a student, resolved via
    ClassMaster/SectionMaster — never the raw stored id/legacy text."""
    class_master = get_class_master_for_student(student)
    section_master = get_section_master_for_student(student)
    return (
        class_master.class_name if class_master else student.class_name,
        section_master.section if section_master else student.section,
    )


def get_class_fee_amounts(class_master, session):
    """Ordered FeeAmount rows for a class+session — this order IS the
    head_number convention used throughout (head_number = 1-based position
    in this list), matching how ApproveAdmissionView originally populated
    StudentFeeDetail."""
    if not class_master:
        return []
    return list(FeeAmount.objects.filter(
        class_id=class_master.id, session=session, type='new'
    ).order_by('id')[:20])


def find_transport_head_number(class_master, session):
    """Position (1-based) of the FeeAmount row named 'Transport' for this
    class+session, or None if not configured. Apply Transport requires this
    to exist so a head_number slot is reserved in StudentFeeDetail."""
    fee_amounts = get_class_fee_amounts(class_master, session)
    for idx, fa in enumerate(fee_amounts, start=1):
        if (fa.head_name or '').strip().lower() == 'transport':
            return idx
    return None


def get_student_monthly_breakdown(student, months=None):
    """Per-head, per-month due/discount/paid/balance for a student.

    due      — from StudentFeeDetail.head{n}_{month}
    discount — from StudentFeeHeadMonthDiscount (permanent, head+month+student)
    paid     — sum of REGULAR FeePaid.head{n} for rows recorded against that month
    balance  — max(0, due - discount - paid)

    `months` optionally restricts the per-month rows to a subset (still
    returns annual totals across all 12 regardless, for the profile summary).
    """
    class_master = get_class_master_for_student(student)
    fee_amounts = get_class_fee_amounts(class_master, student.session)

    if not fee_amounts:
        return {'fee_structure': [], 'total_due': 0, 'total_discount': 0, 'total_paid': 0, 'total_balance': 0}

    detail = StudentFeeDetail.objects.filter(stu_id=student.id, session=student.session).first()

    discount_map = {
        (d.head_number, d.month): float(d.discount_amount)
        for d in StudentFeeHeadMonthDiscount.objects.filter(student_id=student.id, session=student.session)
    }

    paid_map = {}  # {(head_number, month): amount}
    for p in FeePaid.objects.filter(stu_id=student.id, session=student.session, type='REGULAR'):
        if not p.month:
            continue
        for i in range(1, len(fee_amounts) + 1):
            val = getattr(p, f'head{i}', None)
            if val:
                key = (i, p.month)
                paid_map[key] = paid_map.get(key, 0) + float(val)

    display_months = months or MONTH_COLUMNS

    fee_structure = []
    total_due = total_discount = total_paid = 0.0
    for idx, fa in enumerate(fee_amounts, start=1):
        month_rows = []
        annual_due = annual_discount = annual_paid = 0.0
        for m in MONTH_COLUMNS:
            due = float(getattr(detail, f'head{idx}_{m}', 0) or 0) if detail else 0.0
            discount = discount_map.get((idx, m), 0.0)
            paid = paid_map.get((idx, m), 0.0)
            balance = max(0.0, due - discount - paid)
            annual_due += due
            annual_discount += discount
            annual_paid += paid
            if m in display_months:
                month_rows.append({
                    'month': m, 'month_name': MONTH_NAME_MAP[m],
                    'due': due, 'discount': discount, 'paid': paid, 'balance': balance,
                })

        fee_structure.append({
            'head_number': idx,
            'head_name': fa.head_name,
            'months': month_rows,
            'annual_total': annual_due,
            'annual_discount': annual_discount,
            'paid': annual_paid,
            'balance': max(0.0, annual_due - annual_discount - annual_paid),
        })
        total_due += annual_due
        total_discount += annual_discount
        total_paid += annual_paid

    return {
        'fee_structure': fee_structure,
        'total_due': total_due,
        'total_discount': total_discount,
        'total_paid': total_paid,
        'total_balance': max(0.0, total_due - total_discount - total_paid),
    }


class StudentProfileView(APIView):
    """Get complete student profile with the full yearly month-wise fee
    structure (due/discount/paid/balance per head per month) and transport
    status."""
    permission_classes = [IsSchoolStaff]

    def get(self, request, student_id):
        from apps.masters.models import Student
        from apps.transport.models import StudentTransport

        try:
            student = Student.objects.get(id=student_id)
        except Student.DoesNotExist:
            return Response(
                {'detail': 'Student not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        request_scheme = request.build_absolute_uri('/')[:-1]
        resolved_class, resolved_section = resolve_student_class_section(student)
        profile = {
            'id': student.id,
            'admission_no': student.admission_no,
            'roll_no': student.roll_no,
            'photo': (request_scheme + student.photo.url) if student.photo else None,
            'student_name': student.student_name,
            'father_name': student.father_name,
            'mother_name': student.mother_name,
            'date_of_birth': student.date_of_birth,
            'gender': student.gender,
            'father_mobile': student.father_mobile,
            'mother_mobile': student.mother_mobile,
            'father_email': student.father_email,
            'mother_email': student.mother_email,
            'class_name': resolved_class,
            'section': resolved_section,
            'type': student.type,
            'session': student.session,
            'admission_date': student.admission_date,
            'status': student.status,
        }

        breakdown = get_student_monthly_breakdown(student)
        profile['fee_structure'] = breakdown['fee_structure']
        profile['has_fee_structure'] = len(breakdown['fee_structure']) > 0
        profile['total_due'] = breakdown['total_due']
        profile['total_discount'] = breakdown['total_discount']
        profile['total_paid'] = breakdown['total_paid']
        profile['total_balance'] = breakdown['total_balance']

        transport = StudentTransport.objects.filter(
            student_id=student.id, session_year=student.session, status='active'
        ).select_related('route', 'stop').first()
        profile['transport'] = None
        if transport:
            profile['transport'] = {
                'id': transport.id,
                'route_id': transport.route_id,
                'route_name': transport.route.name,
                'stop_id': transport.stop_id,
                'stop_name': transport.stop.name,
                'monthly_fee': float(transport.stop.monthly_fee),
                'start_date': transport.start_date,
            }

        payment_history = FeePaid.objects.filter(
            stu_id=student.id, session=student.session, type='REGULAR'
        ).order_by('-date', '-created_at')
        profile['payment_history'] = FeePaidSerializer(payment_history, many=True).data

        return Response(profile)


class PayStudentFeeView(APIView):
    """Pay fee heads for a student across a month range. Body:
    {
      from_month, to_month,                  # 3-letter abbrs, e.g. 'apr'..'mar'
      heads_by_month: {month: {head_no: amount}},
      discounts_by_month: {month: {head_no: discount_amount}},  # optional
      mode, date, remarks, trans_id
    }
    One FeePaid row is created per month that has a non-zero amount. Discount
    entries are upserted into StudentFeeHeadMonthDiscount (permanent — same
    store the standalone Apply Discount action uses). Both amount and
    discount are validated against the live balance server-side."""
    permission_classes = [IsSchoolStaff]

    def post(self, request, student_id):
        from apps.masters.models import Student

        try:
            student = Student.objects.get(id=student_id)
        except Student.DoesNotExist:
            return Response({'detail': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)

        from_month = request.data.get('from_month')
        to_month = request.data.get('to_month')
        if from_month not in MONTH_COLUMNS or to_month not in MONTH_COLUMNS:
            return Response({'detail': 'Valid from_month and to_month are required.'}, status=status.HTTP_400_BAD_REQUEST)

        start_idx, end_idx = MONTH_COLUMNS.index(from_month), MONTH_COLUMNS.index(to_month)
        if start_idx > end_idx:
            return Response({'detail': 'from_month must come before to_month in the academic year (Apr-Mar).'}, status=status.HTTP_400_BAD_REQUEST)
        month_range = MONTH_COLUMNS[start_idx:end_idx + 1]

        breakdown = get_student_monthly_breakdown(student, months=month_range)
        if not breakdown['fee_structure']:
            return Response({'detail': 'No fee structure assigned to this student.'}, status=status.HTTP_400_BAD_REQUEST)

        balance_lookup = {}   # (head_no, month) -> balance
        head_name_by_number = {}
        for head in breakdown['fee_structure']:
            head_name_by_number[head['head_number']] = head['head_name']
            for m in head['months']:
                balance_lookup[(head['head_number'], m['month'])] = m['balance']

        heads_by_month = request.data.get('heads_by_month') or {}
        discounts_by_month = request.data.get('discounts_by_month') or {}
        mode = request.data.get('mode')
        date = request.data.get('date')
        remarks = request.data.get('remarks', '')
        if not mode or not date:
            return Response({'detail': 'mode and date are required.'}, status=status.HTTP_400_BAD_REQUEST)

        errors = []
        per_month_heads = {}     # month -> {f'head{n}': amount}
        per_month_discounts = {} # month -> {head_no: discount}
        total_amount = 0.0

        for month in month_range:
            head_amounts = heads_by_month.get(month) or {}
            head_discounts = discounts_by_month.get(month) or {}

            for head_str, raw_disc in head_discounts.items():
                try:
                    head_no = int(head_str)
                    disc = float(raw_disc)
                except (TypeError, ValueError):
                    errors.append(f'{month}/head{head_str}: invalid discount amount')
                    continue
                if disc <= 0:
                    continue
                balance = balance_lookup.get((head_no, month), 0)
                if disc > balance + 0.01:
                    name = head_name_by_number.get(head_no, f'head{head_no}')
                    errors.append(f"{name} ({MONTH_NAME_MAP[month]}): discount ₹{disc:.2f} exceeds due ₹{balance:.2f}")
                    continue
                per_month_discounts.setdefault(month, {})[head_no] = disc
                balance_lookup[(head_no, month)] = balance - disc  # net remaining for the amount check below

            month_total = 0.0
            for head_str, raw_amt in head_amounts.items():
                try:
                    head_no = int(head_str)
                    amt = float(raw_amt)
                except (TypeError, ValueError):
                    errors.append(f'{month}/head{head_str}: invalid amount')
                    continue
                if amt <= 0:
                    continue
                balance = balance_lookup.get((head_no, month), 0)
                if amt > balance + 0.01:
                    name = head_name_by_number.get(head_no, f'head{head_no}')
                    errors.append(f"{name} ({MONTH_NAME_MAP[month]}): amount ₹{amt:.2f} exceeds balance due ₹{balance:.2f}")
                    continue
                per_month_heads.setdefault(month, {})[f'head{head_no}'] = amt
                month_total += amt
            total_amount += month_total

        if errors:
            return Response({'detail': 'Validation failed', 'errors': errors}, status=status.HTTP_400_BAD_REQUEST)

        if total_amount <= 0 and not per_month_discounts:
            return Response({'detail': 'Enter at least one fee head amount or discount to save.'}, status=status.HTTP_400_BAD_REQUEST)

        # Persist discounts first (permanent records regardless of whether a payment is also made this time).
        for month, head_map in per_month_discounts.items():
            for head_no, disc in head_map.items():
                StudentFeeHeadMonthDiscount.objects.update_or_create(
                    student_id=student.id, head_number=head_no, month=month, session=student.session,
                    defaults={'discount_amount': disc, 'created_by': request.user.id, 'remarks': remarks},
                )

        created_payments = []
        for month, head_amounts in per_month_heads.items():
            month_amount = sum(head_amounts.values())
            if month_amount <= 0:
                continue
            rec_no = f"FEE{timezone.now().strftime('%Y%m%d')}{str(uuid.uuid4().int)[:6]}"
            payment = FeePaid.objects.create(
                stu_id=student.id,
                type='REGULAR',
                session=student.session,
                month=month,
                amount=month_amount,
                mode=mode,
                date=date,
                trans_id=request.data.get('trans_id', ''),
                remarks=remarks,
                rec_no=rec_no,
                **head_amounts,
            )
            created_payments.append(payment)

        return Response({
            'detail': f'{len(created_payments)} month(s) recorded, ₹{total_amount:.2f} collected.',
            'total_amount': total_amount,
            'payments': FeePaidSerializer(created_payments, many=True).data,
        }, status=status.HTTP_201_CREATED)


class StudentDetailUpdateView(APIView):
    """GET/PATCH the full Student record — backs the 'Complete Detail' form.
    Changing `class_name` requires `effective_month`: months before it keep
    the OLD class's structure untouched, and from that month through March
    the NEW class's FeeAmount values are written into StudentFeeDetail."""
    permission_classes = [IsSchoolStaff]

    def get(self, request, student_id):
        from apps.masters.models import Student
        from apps.masters.serializers import StudentDetailSerializer
        try:
            student = Student.objects.get(id=student_id)
        except Student.DoesNotExist:
            return Response({'detail': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(StudentDetailSerializer(student).data)

    def patch(self, request, student_id):
        from apps.masters.models import Student
        from apps.masters.serializers import StudentDetailSerializer

        try:
            student = Student.objects.get(id=student_id)
        except Student.DoesNotExist:
            return Response({'detail': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)

        new_class_name = request.data.get('class_name')
        class_changed = new_class_name is not None and str(new_class_name) != str(student.class_name)
        effective_month = request.data.get('effective_month')

        if class_changed:
            if not effective_month:
                return Response(
                    {'detail': 'effective_month is required when changing class — months before it keep the old fee structure.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if effective_month not in MONTH_COLUMNS:
                return Response({'detail': 'Invalid effective_month.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = StudentDetailSerializer(student, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        applied_heads = 0
        if class_changed:
            applied_heads = self._apply_class_change_fee_split(student, effective_month)

        return Response({
            **StudentDetailSerializer(student).data,
            'class_changed': class_changed,
            'fee_heads_updated': applied_heads,
        })

    def _apply_class_change_fee_split(self, student, effective_month):
        class_master = get_class_master_for_student(student)
        fee_amounts = get_class_fee_amounts(class_master, student.session)
        if not fee_amounts:
            return 0

        detail, _ = StudentFeeDetail.objects.get_or_create(stu_id=student.id, session=student.session)
        start_idx = MONTH_COLUMNS.index(effective_month)
        months_to_update = MONTH_COLUMNS[start_idx:]

        for idx, fa in enumerate(fee_amounts, start=1):
            for m in months_to_update:
                new_amount = getattr(fa, MONTH_FULL_FIELD[m], 0)
                setattr(detail, f'head{idx}_{m}', new_amount)
        detail.save()
        return len(fee_amounts)


class StudentFeeHeadMonthDiscountView(generics.ListAPIView):
    """GET: list a student's per-head-per-month discounts.
    POST: upsert one or many {head_number, month, discount_amount, remarks}
    rows — used by the standalone Apply Discount action (the Pay Fee modal's
    discount fields write to this same store via PayStudentFeeView)."""
    serializer_class = StudentFeeHeadMonthDiscountSerializer
    permission_classes = [IsSchoolStaff]

    def get_queryset(self):
        qs = StudentFeeHeadMonthDiscount.objects.all()
        student_id = self.request.query_params.get('student_id')
        if student_id:
            qs = qs.filter(student_id=student_id)
        return qs.order_by('head_number', 'month')

    def post(self, request):
        from apps.masters.models import Student

        student_id = request.data.get('student_id')
        rows = request.data.get('discounts', [])
        if not student_id or not rows:
            return Response({'detail': 'student_id and discounts are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            student = Student.objects.get(id=student_id)
        except Student.DoesNotExist:
            return Response({'detail': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)

        breakdown = get_student_monthly_breakdown(student)
        balance_lookup = {}
        head_name_by_number = {}
        for head in breakdown['fee_structure']:
            head_name_by_number[head['head_number']] = head['head_name']
            for m in head['months']:
                balance_lookup[(head['head_number'], m['month'])] = m['balance']

        errors = []
        saved = []
        for row in rows:
            try:
                head_no = int(row.get('head_number'))
                month = row.get('month')
                disc = float(row.get('discount_amount'))
            except (TypeError, ValueError):
                errors.append(f'Invalid row: {row}')
                continue
            if month not in MONTH_COLUMNS:
                errors.append(f'Invalid month: {month}')
                continue
            balance = balance_lookup.get((head_no, month), 0)
            if disc > balance + 0.01:
                name = head_name_by_number.get(head_no, f'head{head_no}')
                errors.append(f"{name} ({MONTH_NAME_MAP[month]}): discount ₹{disc:.2f} exceeds fee amount due ₹{balance:.2f}")
                continue
            saved.append((head_no, month, disc, row.get('remarks', '')))

        if errors:
            return Response({'detail': 'Validation failed', 'errors': errors}, status=status.HTTP_400_BAD_REQUEST)

        results = []
        for head_no, month, disc, remarks in saved:
            obj, _ = StudentFeeHeadMonthDiscount.objects.update_or_create(
                student_id=student.id, head_number=head_no, month=month, session=student.session,
                defaults={'discount_amount': disc, 'remarks': remarks, 'created_by': request.user.id},
            )
            results.append(obj)

        return Response(
            StudentFeeHeadMonthDiscountSerializer(results, many=True).data,
            status=status.HTTP_201_CREATED
        )


class FeeSummaryView(APIView):
    """Student-wise, month-wise due/paid/balance summary, filterable by
    class, section, session, and month range."""
    permission_classes = [IsSchoolStaff]

    def get(self, request):
        from apps.masters.models import Student

        params = request.query_params
        session = params.get('session') or current_session_year()
        students = Student.objects.filter(status='active')
        if session:
            students = students.filter(session=session)
        if params.get('class_name'):
            students = students.filter(class_name=params['class_name'])
        if params.get('section'):
            students = students.filter(section=params['section'])
        if params.get('search'):
            search = params['search']
            students = students.filter(
                Q(student_name__icontains=search) | Q(admission_no__icontains=search)
            )

        from_month = params.get('from_month')
        to_month = params.get('to_month')
        months = None
        if from_month in MONTH_COLUMNS and to_month in MONTH_COLUMNS:
            i, j = MONTH_COLUMNS.index(from_month), MONTH_COLUMNS.index(to_month)
            if i <= j:
                months = MONTH_COLUMNS[i:j + 1]

        results = []
        for student in students.order_by('student_name')[:500]:
            breakdown = get_student_monthly_breakdown(student, months=months)
            if not breakdown['fee_structure']:
                continue
            resolved_class, resolved_section = resolve_student_class_section(student)
            results.append({
                'student_id': student.id,
                'admission_no': student.admission_no,
                'student_name': student.student_name,
                'class_name': resolved_class,
                'section': resolved_section,
                'total_due': breakdown['total_due'],
                'total_discount': breakdown['total_discount'],
                'total_paid': breakdown['total_paid'],
                'total_balance': breakdown['total_balance'],
            })

        return Response(results)


class FeeTransactionView(generics.ListAPIView):
    """Daily fee transaction ledger (FeePaid rows) with student name/class
    joined in, filterable by date range, mode, and search."""
    serializer_class = FeePaidSerializer
    permission_classes = [IsSchoolStaff]

    def get_queryset(self):
        qs = FeePaid.objects.filter(type='REGULAR').order_by('-date', '-created_at')
        params = self.request.query_params
        session = params.get('session') or current_session_year()
        if session:
            qs = qs.filter(session=session)
        if params.get('from_date') and params.get('to_date'):
            qs = qs.filter(date__range=[params['from_date'], params['to_date']])
        if params.get('mode'):
            qs = qs.filter(mode=params['mode'])
        return qs

    def list(self, request, *args, **kwargs):
        from apps.masters.models import Student

        qs = self.filter_queryset(self.get_queryset())
        student_ids = list(qs.values_list('stu_id', flat=True).distinct())
        students = {s.id: s for s in Student.objects.filter(id__in=student_ids)}

        search = request.query_params.get('search', '').strip().lower()
        rows = []
        for p in qs:
            student = students.get(p.stu_id)
            if search and student and search not in student.student_name.lower() and search not in student.admission_no.lower():
                continue
            resolved_class, resolved_section = resolve_student_class_section(student) if student else ('', '')
            heads = []
            for i in range(1, 21):
                val = getattr(p, f'head{i}', None)
                if val:
                    heads.append({'head_number': i, 'amount': float(val)})
            rows.append({
                'id': p.id,
                'rec_no': p.rec_no,
                'date': p.date,
                'student_id': p.stu_id,
                'student_name': student.student_name if student else '—',
                'admission_no': student.admission_no if student else '',
                'class_name': resolved_class,
                'section': resolved_section,
                'amount': float(p.amount),
                'mode': p.mode,
                'month': p.month,
                'heads': heads,
                'remarks': p.remarks,
                'trans_id': p.trans_id,
            })
        return Response(rows)

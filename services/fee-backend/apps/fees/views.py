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
    AdmissionQuery, RegistrationFeePaid, StudentFeeDetail
)
from .serializers import (
    FeeHeadSerializer, FeeAmountSerializer, FeeStructureSerializer, DiscountHeadSerializer,
    StudentFeeDiscountSerializer, FeeReceiptSerializer, FeeReceiptListSerializer,
    PayFeeSerializer, AdditionalFeeSerializer, DepositFeeSerializer,
    BookSetSerializer, BookSerializer, BookSaleSerializer,
    UniformItemSerializer, UniformSaleSerializer,
    AdmissionQuerySerializer, AdmissionQueryListSerializer, RegistrationFeePaidSerializer
)
from utils.permissions import IsSchoolAdmin, IsSchoolStaff
import uuid


def generate_receipt_no(prefix='R'):
    return f"{prefix}{timezone.now().strftime('%Y%m%d')}{str(uuid.uuid4().int)[:6]}"


class FeeHeadListCreateView(generics.ListCreateAPIView):
    serializer_class = FeeHeadSerializer
    permission_classes = [IsSchoolAdmin]
    
    def get_queryset(self):
        qs = FeeHead.objects.all().order_by('-created_at')
        session = self.request.query_params.get('session')
        if session:
            qs = qs.filter(session=session)
        return qs


class FeeHeadDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FeeHeadSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = FeeHead.objects.all()


class FeeAmountListCreateView(generics.ListCreateAPIView):
    serializer_class = FeeAmountSerializer
    permission_classes = [IsSchoolAdmin]

    def get_queryset(self):
        qs = FeeAmount.objects.all().order_by('head_name')
        class_id = self.request.query_params.get('class_id')
        type_param = self.request.query_params.get('type')
        session = self.request.query_params.get('session')
        
        if class_id:
            qs = qs.filter(class_id=class_id)
        if type_param:
            qs = qs.filter(type=type_param)
        if session:
            qs = qs.filter(session=session)
        return qs
    
    def create(self, request, *args, **kwargs):
        # Bulk create for multiple fee heads
        data_list = request.data if isinstance(request.data, list) else [request.data]
        serializer = self.get_serializer(data=data_list, many=True)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class FeeAmountDetailView(generics.RetrieveUpdateDestroyAPIView):
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


class FeeStructureListCreateView(generics.ListCreateAPIView):
    serializer_class = FeeStructureSerializer
    permission_classes = [IsSchoolAdmin]

    def get_queryset(self):
        qs = FeeStructure.objects.select_related('fee_head')
        params = self.request.query_params
        if params.get('class_id'):
            qs = qs.filter(class_id=params['class_id'])
        if params.get('session_year'):
            qs = qs.filter(session_year=params['session_year'])
        return qs


class DiscountHeadListCreateView(generics.ListCreateAPIView):
    serializer_class = DiscountHeadSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = DiscountHead.objects.filter(is_active=True)


class StudentFeeDiscountView(generics.ListCreateAPIView):
    serializer_class = StudentFeeDiscountSerializer
    permission_classes = [IsSchoolStaff]

    def get_queryset(self):
        qs = StudentFeeDiscount.objects.select_related('discount_head', 'fee_head')
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
            session_year=data['session_year'],
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


class FeeReceiptListView(generics.ListAPIView):
    serializer_class = FeeReceiptListSerializer
    permission_classes = [IsSchoolStaff]

    def get_queryset(self):
        qs = FeeReceipt.objects.all()
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


class FeeReceiptDetailView(generics.RetrieveAPIView):
    serializer_class = FeeReceiptSerializer
    permission_classes = [IsSchoolStaff]
    queryset = FeeReceipt.objects.all()


class DailyCollectionReportView(APIView):
    permission_classes = [IsSchoolStaff]

    def get(self, request):
        date = request.query_params.get('date', str(timezone.now().date()))
        receipts = FeeReceipt.objects.filter(payment_date=date, status='paid')
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
        if params.get('session_year'):
            qs = qs.filter(session_year=params['session_year'])
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
        session_year = params.get('session_year', '')
        paid_student_ids = FeeReceipt.objects.filter(
            session_year=session_year, status='paid'
        ).values_list('student_id', flat=True).distinct()
        return Response({
            'paid_count': len(paid_student_ids),
            'session_year': session_year,
            'note': 'Cross reference with student list to find defaulters',
        })


class BookSetListCreateView(generics.ListCreateAPIView):
    serializer_class = BookSetSerializer
    permission_classes = [IsSchoolAdmin]

    def get_queryset(self):
        qs = BookSet.objects.prefetch_related('books')
        if self.request.query_params.get('session_year'):
            qs = qs.filter(session_year=self.request.query_params['session_year'])
        return qs


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


class FeeStructureDetailView(generics.RetrieveUpdateDestroyAPIView):
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
        session_year = params.get('session_year', '')

        qs = FeeReceipt.objects.filter(status='paid')
        if month and year:
            qs = qs.filter(payment_date__month=month, payment_date__year=year)
        elif session_year:
            qs = qs.filter(session_year=session_year)

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


class BookSetDetailView(generics.RetrieveUpdateDestroyAPIView):
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


class AdmissionQueryListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsSchoolStaff]
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return AdmissionQueryListSerializer
        return AdmissionQuerySerializer
    
    def get_queryset(self):
        qs = AdmissionQuery.objects.all()
        params = self.request.query_params
        
        # Filters
        if params.get('status'):
            qs = qs.filter(status=params['status'])
        if params.get('adm_status'):
            qs = qs.filter(adm_status=params['adm_status'])
        if params.get('session'):
            qs = qs.filter(session=params['session'])
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
        query = serializer.save(created_by=self.request.user.id if hasattr(self.request.user, 'id') else None)
        
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
            
            print(f"📧 Attempting to send email to: {query.father_email}")
            print(f"📧 From: {settings.DEFAULT_FROM_EMAIL}")
            print(f"📧 Subject: {subject}")
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[query.father_email],
                fail_silently=False,  # Changed to False to see errors
            )
            
            print(f"✅ Email sent successfully to {query.father_email}")
            
        except Exception as e:
            print(f"❌ Email sending failed: {str(e)}")
            print(f"❌ Error type: {type(e).__name__}")
            import traceback
            print(traceback.format_exc())


class AdmissionQueryDetailView(generics.RetrieveUpdateDestroyAPIView):
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
            if hasattr(query, 'registration_payment'):
                return Response(
                    {'detail': 'Registration fee already paid for this enquiry.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Generate receipt number
            receipt_no = f"REG{timezone.now().strftime('%Y%m%d')}{str(uuid.uuid4().int)[:6]}"
            
            # Create payment record
            payment = RegistrationFeePaid.objects.create(
                admission_query=query,
                student_name=query.student_name,
                father_name=query.father_name,
                class_name=query.class_name,
                mobile=query.father_mobile,
                amount=request.data.get('amount', 100.00),
                payment_mode=request.data.get('payment_mode'),
                payment_date=request.data.get('payment_date'),
                transaction_id=request.data.get('transaction_id', ''),
                bank_name=request.data.get('bank_name', ''),
                receipt_no=receipt_no,
                collected_by=request.user.id if hasattr(request.user, 'id') else None,
                remarks=request.data.get('remarks', '')
            )
            
            # Update admission query status to 'registered' after payment
            query.adm_status = 'registered'
            query.save()
            
            return Response(
                RegistrationFeePaidSerializer(payment).data,
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
            
            if not hasattr(query, 'registration_payment'):
                return Response(
                    {'detail': 'No payment record found for this enquiry.'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            payment = query.registration_payment
            receipt_data = {
                'receipt_no': payment.receipt_no,
                'payment_date': payment.payment_date,
                'student_name': payment.student_name,
                'father_name': payment.father_name,
                'class_name': payment.class_name,
                'mobile': payment.mobile,
                'session': query.session,
                'amount': payment.amount,
                'payment_mode': payment.payment_mode,
                'transaction_id': payment.transaction_id,
                'bank_name': payment.bank_name,
                'remarks': payment.remarks,
                'collected_by': payment.collected_by,
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
            if not hasattr(query, 'registration_payment'):
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
                class_name=query.class_name,
                section='A',  # Default section
                type='new',   # New student
                session=query.session,
                admission_date=timezone.now().date(),
                status='active'
            )
            
            # Fetch fee structure for this class (get up to 20 heads)
            fee_amounts = FeeAmount.objects.filter(
                class_id=query.class_id,
                type='new',
                session=query.session
            ).order_by('id')[:20]  # Max 20 heads
            
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
            return Response({
                'id': student.id,
                'admission_no': student.admission_no,
                'student_name': student.student_name,
                'father_name': student.father_name,
                'class_name': student.class_name,
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
        session = request.query_params.get('session')
        
        if not class_name:
            return Response(
                {'detail': 'class_name is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        students = Student.objects.filter(class_name=class_name, status='active')
        
        if session:
            students = students.filter(session=session)
        
        students = students.order_by('student_name')
        
        data = [{
            'id': s.id,
            'admission_no': s.admission_no,
            'student_name': s.student_name,
            'father_name': s.father_name,
            'class_name': s.class_name,
            'section': s.section,
            'type': s.type,
            'session': s.session,
            'admission_date': s.admission_date,
            'father_mobile': s.father_mobile
        } for s in students]
        
        return Response(data)


class StudentProfileView(APIView):
    """Get complete student profile with fee structure"""
    permission_classes = [IsSchoolStaff]
    
    def get(self, request, student_id):
        from apps.masters.models import Student
        from django.db import connections
        from utils.tenant import get_current_tenant
        
        try:
            student = Student.objects.get(id=student_id)
        except Student.DoesNotExist:
            return Response(
                {'detail': 'Student not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get student basic info
        profile = {
            'id': student.id,
            'admission_no': student.admission_no,
            'student_name': student.student_name,
            'father_name': student.father_name,
            'mother_name': student.mother_name,
            'date_of_birth': student.date_of_birth,
            'gender': student.gender,
            'father_mobile': student.father_mobile,
            'mother_mobile': student.mother_mobile,
            'father_email': student.father_email,
            'mother_email': student.mother_email,
            'class_name': student.class_name,
            'section': student.section,
            'type': student.type,
            'session': student.session,
            'admission_date': student.admission_date,
            'status': student.status
        }
        
        # Get fee structure from student_fee_details table
        tenant_db = get_current_tenant()
        
        try:
            with connections[tenant_db].cursor() as cursor:
                cursor.execute("""
                    SELECT * FROM student_fee_details 
                    WHERE stu_id = %s AND session = %s
                """, [student_id, student.session])
                
                columns = [col[0] for col in cursor.description]
                row = cursor.fetchone()
                
                if row:
                    fee_data = dict(zip(columns, row))
                    
                    # Get fee head names from fee_amount table based on class_name
                    # Note: We need to get class_id from ClassMaster for FeeAmount query
                    from apps.masters.models import ClassMaster
                    class_master = ClassMaster.objects.filter(
                        class_name=student.class_name, 
                        session=student.session
                    ).first()
                    
                    if class_master:
                        fee_heads = FeeAmount.objects.filter(
                            class_id=class_master.id,
                            session=student.session,
                            type='new'
                        ).order_by('id')[:20]
                    else:
                        fee_heads = []
                    
                    # Format fee structure for frontend
                    fee_structure = []
                    months = ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar']
                    month_names = ['April', 'May', 'June', 'July', 'August', 'September', 
                                  'October', 'November', 'December', 'January', 'February', 'March']
                    
                    for idx, fee_head in enumerate(fee_heads, start=1):
                        head_fees = {
                            'head_number': idx,
                            'head_name': fee_head.head_name,
                            'months': []
                        }
                        
                        total = 0
                        for month, month_name in zip(months, month_names):
                            col_name = f'head{idx}_{month}'
                            amount = float(fee_data.get(col_name, 0))
                            total += amount
                            head_fees['months'].append({
                                'month': month_name,
                                'amount': amount
                            })
                        
                        head_fees['annual_total'] = total
                        fee_structure.append(head_fees)
                    
                    profile['fee_structure'] = fee_structure
                    profile['has_fee_structure'] = True
                else:
                    profile['fee_structure'] = []
                    profile['has_fee_structure'] = False
                    
        except Exception as e:
            print(f"Error fetching fee structure: {e}")
            profile['fee_structure'] = []
            profile['has_fee_structure'] = False
        
        return Response(profile)

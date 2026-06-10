from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum, Count, Q
from django.utils import timezone
from .models import (
    FeeHead, FeeStructure, DiscountHead, StudentFeeDiscount,
    FeeReceipt, FeeReceiptItem, AdditionalFee, DepositFee,
    BookSet, Book, BookSale, UniformItem, UniformSale, UniformSaleItem
)
from .serializers import (
    FeeHeadSerializer, FeeStructureSerializer, DiscountHeadSerializer,
    StudentFeeDiscountSerializer, FeeReceiptSerializer, FeeReceiptListSerializer,
    PayFeeSerializer, AdditionalFeeSerializer, DepositFeeSerializer,
    BookSetSerializer, BookSerializer, BookSaleSerializer,
    UniformItemSerializer, UniformSaleSerializer
)
from utils.permissions import IsSchoolAdmin, IsSchoolStaff
import uuid


def generate_receipt_no(prefix='R'):
    return f"{prefix}{timezone.now().strftime('%Y%m%d')}{str(uuid.uuid4().int)[:6]}"


class FeeHeadListCreateView(generics.ListCreateAPIView):
    serializer_class = FeeHeadSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = FeeHead.objects.filter(is_active=True)


class FeeHeadDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FeeHeadSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = FeeHead.objects.all()


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

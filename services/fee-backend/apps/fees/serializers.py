from rest_framework import serializers
from .models import (
    FeeHead, FeeAmount, FeeStructure, DiscountHead, StudentFeeDiscount,
    FeeReceipt, FeeReceiptItem, AdditionalFee, DepositFee,
    BookSet, Book, BookSale, UniformItem, UniformSale, UniformSaleItem,
    AdmissionQuery
)


class FeeAmountSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeeAmount
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class FeeHeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeeHead
        fields = '__all__'


class FeeStructureSerializer(serializers.ModelSerializer):
    fee_head_name = serializers.CharField(source='fee_head.name', read_only=True)

    class Meta:
        model = FeeStructure
        fields = '__all__'


class DiscountHeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiscountHead
        fields = '__all__'


class StudentFeeDiscountSerializer(serializers.ModelSerializer):
    discount_head_name = serializers.CharField(source='discount_head.name', read_only=True)
    fee_head_name = serializers.CharField(source='fee_head.name', read_only=True, allow_null=True)

    class Meta:
        model = StudentFeeDiscount
        fields = '__all__'


class FeeReceiptItemSerializer(serializers.ModelSerializer):
    fee_head_name = serializers.CharField(source='fee_head.name', read_only=True)

    class Meta:
        model = FeeReceiptItem
        fields = '__all__'


class FeeReceiptSerializer(serializers.ModelSerializer):
    items = FeeReceiptItemSerializer(many=True, read_only=True)

    class Meta:
        model = FeeReceipt
        fields = '__all__'
        read_only_fields = ['id', 'receipt_no', 'created_at']


class FeeReceiptListSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeeReceipt
        fields = [
            'id', 'receipt_no', 'student_name', 'admission_no', 'class_name',
            'section_name', 'payment_date', 'payment_mode', 'net_amount',
            'status', 'created_at'
        ]


class PayFeeSerializer(serializers.Serializer):
    student_id = serializers.IntegerField()
    student_name = serializers.CharField()
    class_name = serializers.CharField()
    section_name = serializers.CharField()
    admission_no = serializers.CharField()
    session_year = serializers.CharField()
    payment_mode = serializers.ChoiceField(choices=['cash', 'cheque', 'online', 'upi', 'card', 'dd'])
    payment_date = serializers.DateField()
    cheque_no = serializers.CharField(required=False, allow_blank=True)
    cheque_date = serializers.DateField(required=False, allow_null=True)
    bank_name = serializers.CharField(required=False, allow_blank=True)
    transaction_id = serializers.CharField(required=False, allow_blank=True)
    remarks = serializers.CharField(required=False, allow_blank=True)
    items = serializers.ListField(child=serializers.DictField())


class AdditionalFeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdditionalFee
        fields = '__all__'


class DepositFeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = DepositFee
        fields = '__all__'


class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = '__all__'


class BookSetSerializer(serializers.ModelSerializer):
    books = BookSerializer(many=True, read_only=True)

    class Meta:
        model = BookSet
        fields = '__all__'


class BookSaleSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookSale
        fields = '__all__'


class UniformItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = UniformItem
        fields = '__all__'


class UniformSaleItemSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='uniform_item.name', read_only=True)

    class Meta:
        model = UniformSaleItem
        fields = '__all__'


class UniformSaleSerializer(serializers.ModelSerializer):
    items = UniformSaleItemSerializer(many=True, read_only=True)

    class Meta:
        model = UniformSale
        fields = '__all__'


class AdmissionQuerySerializer(serializers.ModelSerializer):
    fee_structure = serializers.SerializerMethodField()
    
    class Meta:
        model = AdmissionQuery
        fields = '__all__'
        read_only_fields = ['id', 'query_date', 'updated_at', 'created_by']
    
    def get_fee_structure(self, obj):
        """Get annual fee structure for selected class and type"""
        from .models import FeeAmount
        fee_amounts = FeeAmount.objects.filter(
            class_id=obj.class_id,
            type=obj.type,
            session=obj.session
        )
        
        result = []
        for fee in fee_amounts:
            annual_total = (
                fee.april + fee.may + fee.june + fee.july + 
                fee.august + fee.september + fee.october + fee.november + 
                fee.december + fee.january + fee.february + fee.march
            )
            result.append({
                'head_name': fee.head_name,
                'frequency': fee.frequency,
                'annual_amount': float(annual_total),
                'monthly_breakdown': {
                    'april': float(fee.april),
                    'may': float(fee.may),
                    'june': float(fee.june),
                    'july': float(fee.july),
                    'august': float(fee.august),
                    'september': float(fee.september),
                    'october': float(fee.october),
                    'november': float(fee.november),
                    'december': float(fee.december),
                    'january': float(fee.january),
                    'february': float(fee.february),
                    'march': float(fee.march),
                }
            })
        
        return result


class AdmissionQueryListSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdmissionQuery
        fields = [
            'id', 'student_name', 'father_name', 'father_mobile', 
            'class_name', 'session', 'status', 'source_of_information',
            'query_date', 'follow_up_date'
        ]

from django.db import models
from django.utils import timezone


class FeeHead(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    is_optional = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'fee_heads'

    def __str__(self):
        return self.name


class FeeStructure(models.Model):
    FREQUENCY_CHOICES = [
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('half_yearly', 'Half Yearly'),
        ('annually', 'Annually'),
        ('one_time', 'One Time'),
    ]

    fee_head = models.ForeignKey(FeeHead, on_delete=models.CASCADE, related_name='structures')
    class_id = models.IntegerField()
    class_name = models.CharField(max_length=50)
    section_id = models.IntegerField(null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    frequency = models.CharField(max_length=15, choices=FREQUENCY_CHOICES, default='monthly')
    session_year = models.CharField(max_length=10)
    due_date = models.IntegerField(default=10, help_text="Day of month by which fee is due")
    late_fine_per_day = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'fee_structures'

    def __str__(self):
        return f'{self.fee_head.name} - Class {self.class_name}'


class DiscountHead(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    discount_type = models.CharField(max_length=10, choices=[('percent', 'Percent'), ('amount', 'Amount')], default='percent')
    value = models.DecimalField(max_digits=5, decimal_places=2)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'discount_heads'


class StudentFeeDiscount(models.Model):
    student_id = models.IntegerField()
    discount_head = models.ForeignKey(DiscountHead, on_delete=models.CASCADE)
    fee_head = models.ForeignKey(FeeHead, on_delete=models.CASCADE, null=True, blank=True)
    session_year = models.CharField(max_length=10)
    remarks = models.CharField(max_length=200, blank=True)
    approved_by = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'student_fee_discounts'


class FeeReceipt(models.Model):
    PAYMENT_MODE_CHOICES = [
        ('cash', 'Cash'),
        ('cheque', 'Cheque'),
        ('online', 'Online/NEFT/RTGS'),
        ('upi', 'UPI'),
        ('card', 'Card'),
        ('dd', 'Demand Draft'),
    ]
    STATUS_CHOICES = [
        ('paid', 'Paid'),
        ('pending', 'Pending'),
        ('cancelled', 'Cancelled'),
        ('bounced', 'Cheque Bounced'),
    ]

    receipt_no = models.CharField(max_length=20, unique=True)
    student_id = models.IntegerField()
    student_name = models.CharField(max_length=200)
    class_name = models.CharField(max_length=50)
    section_name = models.CharField(max_length=10)
    admission_no = models.CharField(max_length=20)
    session_year = models.CharField(max_length=10)
    payment_date = models.DateField(default=timezone.now)
    payment_mode = models.CharField(max_length=10, choices=PAYMENT_MODE_CHOICES, default='cash')
    cheque_no = models.CharField(max_length=20, blank=True)
    cheque_date = models.DateField(null=True, blank=True)
    bank_name = models.CharField(max_length=100, blank=True)
    transaction_id = models.CharField(max_length=50, blank=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    late_fine = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    net_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='paid')
    remarks = models.CharField(max_length=200, blank=True)
    collected_by = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'fee_receipts'
        ordering = ['-payment_date', '-id']

    def __str__(self):
        return f'Receipt #{self.receipt_no} - {self.student_name}'


class FeeReceiptItem(models.Model):
    receipt = models.ForeignKey(FeeReceipt, on_delete=models.CASCADE, related_name='items')
    fee_head = models.ForeignKey(FeeHead, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    net_amount = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = 'fee_receipt_items'


class AdditionalFee(models.Model):
    name = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    session_year = models.CharField(max_length=10)
    class_id = models.IntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'additional_fees'


class DepositFee(models.Model):
    STATUS_CHOICES = [('paid', 'Paid'), ('pending', 'Pending'), ('refunded', 'Refunded')]

    student_id = models.IntegerField()
    student_name = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    deposit_date = models.DateField()
    refund_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='paid')
    remarks = models.CharField(max_length=200, blank=True)
    receipt_no = models.CharField(max_length=20, blank=True)

    class Meta:
        db_table = 'deposit_fees'


class BookSet(models.Model):
    name = models.CharField(max_length=100)
    class_id = models.IntegerField()
    class_name = models.CharField(max_length=50)
    session_year = models.CharField(max_length=10)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'book_sets'


class Book(models.Model):
    title = models.CharField(max_length=200)
    author = models.CharField(max_length=200, blank=True)
    publisher = models.CharField(max_length=200, blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    book_set = models.ForeignKey(BookSet, on_delete=models.CASCADE, related_name='books', null=True, blank=True)
    stock = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'books'


class BookSale(models.Model):
    student_id = models.IntegerField()
    student_name = models.CharField(max_length=200)
    book_set = models.ForeignKey(BookSet, on_delete=models.CASCADE, null=True, blank=True)
    sale_date = models.DateField(default=timezone.now)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_mode = models.CharField(max_length=10, default='cash')
    receipt_no = models.CharField(max_length=20, unique=True)
    collected_by = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = 'book_sales'


class UniformItem(models.Model):
    name = models.CharField(max_length=100)
    size = models.CharField(max_length=20, blank=True)
    gender = models.CharField(max_length=1, choices=[('M', 'Male'), ('F', 'Female'), ('U', 'Unisex')], default='U')
    price = models.DecimalField(max_digits=8, decimal_places=2)
    stock = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'uniform_items'


class UniformSale(models.Model):
    student_id = models.IntegerField()
    student_name = models.CharField(max_length=200)
    sale_date = models.DateField(default=timezone.now)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_mode = models.CharField(max_length=10, default='cash')
    receipt_no = models.CharField(max_length=20, unique=True)
    collected_by = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = 'uniform_sales'


class UniformSaleItem(models.Model):
    sale = models.ForeignKey(UniformSale, on_delete=models.CASCADE, related_name='items')
    uniform_item = models.ForeignKey(UniformItem, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    unit_price = models.DecimalField(max_digits=8, decimal_places=2)
    total_price = models.DecimalField(max_digits=8, decimal_places=2)

    class Meta:
        db_table = 'uniform_sale_items'

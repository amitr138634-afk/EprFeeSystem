from django.db import models
from django.utils import timezone


class FeeAmount(models.Model):
    FREQUENCY_CHOICES = [
        ('one_time', 'One Time'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('yearly', 'Yearly'),
    ]
    
    TYPE_CHOICES = [
        ('old', 'Old'),
        ('new', 'New'),
    ]
    
    # id auto-increment by default
    class_id = models.IntegerField()
    class_name = models.CharField(max_length=100)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    session = models.CharField(max_length=20)
    head_name = models.CharField(max_length=100)
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)
    
    # Month-wise amounts (April to March)
    april = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    may = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    june = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    july = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    august = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    september = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    october = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    november = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    december = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    january = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    february = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    march = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'fee_amount'
        unique_together = ['class_id', 'type', 'session', 'head_name']

    def __str__(self):
        return f'{self.class_name} - {self.head_name} ({self.session})'


class FeeHead(models.Model):
    # id auto-increment by default
    session = models.CharField(max_length=20, default='2024-25')
    head1 = models.CharField(max_length=100, blank=True, null=True)
    head2 = models.CharField(max_length=100, blank=True, null=True)
    head3 = models.CharField(max_length=100, blank=True, null=True)
    head4 = models.CharField(max_length=100, blank=True, null=True)
    head5 = models.CharField(max_length=100, blank=True, null=True)
    head6 = models.CharField(max_length=100, blank=True, null=True)
    head7 = models.CharField(max_length=100, blank=True, null=True)
    head8 = models.CharField(max_length=100, blank=True, null=True)
    head9 = models.CharField(max_length=100, blank=True, null=True)
    head10 = models.CharField(max_length=100, blank=True, null=True)
    head11 = models.CharField(max_length=100, blank=True, null=True)
    head12 = models.CharField(max_length=100, blank=True, null=True)
    head13 = models.CharField(max_length=100, blank=True, null=True)
    head14 = models.CharField(max_length=100, blank=True, null=True)
    head15 = models.CharField(max_length=100, blank=True, null=True)
    head16 = models.CharField(max_length=100, blank=True, null=True)
    head17 = models.CharField(max_length=100, blank=True, null=True)
    head18 = models.CharField(max_length=100, blank=True, null=True)
    head19 = models.CharField(max_length=100, blank=True, null=True)
    head20 = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'fee_heads'

    def __str__(self):
        return f'Fee Heads - Session {self.session}'


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


class AdmissionQuery(models.Model):
    STATUS_CHOICES = [
        ('enquiry', 'Enquiry'),
        ('contacted', 'Contacted'),
        ('visited', 'Visited'),
        ('admitted', 'Admitted'),
        ('rejected', 'Rejected'),
    ]
    
    SOURCE_CHOICES = [
        ('walk_in', 'Walk In'),
        ('phone', 'Phone'),
        ('website', 'Website'),
        ('reference', 'Reference'),
        ('advertisement', 'Advertisement'),
        ('social_media', 'Social Media'),
        ('other', 'Other'),
    ]
    
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    ]

    # Student Information
    student_name = models.CharField(max_length=200)
    father_name = models.CharField(max_length=200)
    mother_name = models.CharField(max_length=200)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    
    # Contact Information
    father_email = models.EmailField(blank=True, null=True)
    mother_email = models.EmailField(blank=True, null=True)
    father_mobile = models.CharField(max_length=15)
    mother_mobile = models.CharField(max_length=15, blank=True)
    
    # Admission Details
    session = models.CharField(max_length=20)
    class_id = models.IntegerField()
    class_name = models.CharField(max_length=50)
    type = models.CharField(max_length=10, default='new')  # new/old
    
    # Query Details
    source_of_information = models.CharField(max_length=50, choices=SOURCE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='enquiry')
    remarks = models.TextField(blank=True)
    
    # Timestamps
    query_date = models.DateTimeField(auto_now_add=True)
    follow_up_date = models.DateField(null=True, blank=True)
    created_by = models.IntegerField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'admission_queries'
        ordering = ['-query_date']

    def __str__(self):
        return f'{self.student_name} - {self.class_name} ({self.session})'

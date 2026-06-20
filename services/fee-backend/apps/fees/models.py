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
    # Session is injected from the active session (see SessionScopedMixin); no hardcoded default.
    session = models.CharField(max_length=20, blank=True)
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


class StudentFeeHeadMonthDiscount(models.Model):
    """Per-student, per-fee-head, per-month discount amount — granular
    override used by both the standalone Apply Discount action and the
    optional discount field inside the Pay Fee flow (same store, so either
    entry point produces a permanent record)."""
    MONTH_CHOICES = [
        ('apr', 'April'), ('may', 'May'), ('jun', 'June'), ('jul', 'July'),
        ('aug', 'August'), ('sep', 'September'), ('oct', 'October'),
        ('nov', 'November'), ('dec', 'December'), ('jan', 'January'),
        ('feb', 'February'), ('mar', 'March'),
    ]

    student_id = models.IntegerField()
    head_number = models.IntegerField()  # 1-20, maps to StudentFeeDetail's head{N}_{month}
    month = models.CharField(max_length=3, choices=MONTH_CHOICES)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    session = models.CharField(max_length=20)
    remarks = models.CharField(max_length=200, blank=True)
    created_by = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'student_fee_head_month_discounts'
        unique_together = ['student_id', 'head_number', 'month', 'session']

    def __str__(self):
        return f'Student {self.student_id} - head{self.head_number} - {self.month} - ₹{self.discount_amount}'


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
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='enquiry')  # Query status
    adm_status = models.CharField(max_length=20, default='enquiry')  # Admission status: enquiry, registered, admitted, etc.
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


class FeePaid(models.Model):
    """General fee-payment ledger. For type=EXTRA (registration fee, paid
    before a student record exists), stu_id holds the admission_query's id
    and the flat amount goes in `amount`. Other types use head1..head20 for
    per-head amounts and stu_id holds the real student id."""
    TYPE_CHOICES = [
        ('EXTRA', 'Extra/Registration'),
        ('REGULAR', 'Regular Fee'),
    ]
    PAYMENT_MODE_CHOICES = [
        ('cash', 'Cash'),
        ('upi', 'UPI'),
        ('paytm', 'Paytm'),
        ('online', 'Online'),
        ('cheque', 'Cheque'),
        ('card', 'Card'),
    ]

    stu_id = models.IntegerField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='EXTRA')
    session = models.CharField(max_length=20)
    month = models.CharField(max_length=20, blank=True, null=True)

    head1 = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    head2 = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    head3 = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    head4 = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    head5 = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    head6 = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    head7 = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    head8 = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    head9 = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    head10 = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    head11 = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    head12 = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    head13 = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    head14 = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    head15 = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    head16 = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    head17 = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    head18 = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    head19 = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    head20 = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    mode = models.CharField(max_length=20, choices=PAYMENT_MODE_CHOICES)
    rec_no = models.CharField(max_length=50, unique=True)
    trans_id = models.CharField(max_length=100, blank=True, null=True)
    date = models.DateField()
    remarks = models.CharField(max_length=255, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'fee_paid'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.stu_id} - {self.type} - ₹{self.amount} ({self.rec_no})'


class StudentFeeDetail(models.Model):
    """
    Stores fee structure for each student - ONE ROW PER STUDENT
    Structure: stu_id references students.id
    Columns: head1_apr to head20_mar (20 heads × 12 months = 240 fee columns)
    """
    stu_id = models.IntegerField(unique=True, db_index=True)  # References students.id
    session = models.CharField(max_length=20)
    
    # Head 1 - Months (April to March)
    head1_apr = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head1_may = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head1_jun = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head1_jul = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head1_aug = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head1_sep = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head1_oct = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head1_nov = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head1_dec = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head1_jan = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head1_feb = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head1_mar = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Head 2 - Months
    head2_apr = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head2_may = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head2_jun = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head2_jul = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head2_aug = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head2_sep = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head2_oct = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head2_nov = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head2_dec = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head2_jan = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head2_feb = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head2_mar = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Head 3 - Months
    head3_apr = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head3_may = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head3_jun = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head3_jul = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head3_aug = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head3_sep = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head3_oct = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head3_nov = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head3_dec = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head3_jan = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head3_feb = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head3_mar = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Head 4 - Months
    head4_apr = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head4_may = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head4_jun = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head4_jul = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head4_aug = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head4_sep = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head4_oct = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head4_nov = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head4_dec = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head4_jan = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head4_feb = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head4_mar = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Head 5 - Months
    head5_apr = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head5_may = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head5_jun = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head5_jul = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head5_aug = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head5_sep = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head5_oct = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head5_nov = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head5_dec = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head5_jan = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head5_feb = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head5_mar = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Head 6 - Months
    head6_apr = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head6_may = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head6_jun = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head6_jul = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head6_aug = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head6_sep = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head6_oct = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head6_nov = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head6_dec = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head6_jan = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head6_feb = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head6_mar = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Head 7 - Months
    head7_apr = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head7_may = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head7_jun = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head7_jul = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head7_aug = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head7_sep = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head7_oct = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head7_nov = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head7_dec = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head7_jan = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head7_feb = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head7_mar = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Head 8 - Months
    head8_apr = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head8_may = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head8_jun = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head8_jul = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head8_aug = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head8_sep = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head8_oct = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head8_nov = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head8_dec = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head8_jan = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head8_feb = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head8_mar = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Head 9 - Months
    head9_apr = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head9_may = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head9_jun = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head9_jul = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head9_aug = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head9_sep = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head9_oct = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head9_nov = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head9_dec = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head9_jan = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head9_feb = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head9_mar = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Head 10 - Months
    head10_apr = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head10_may = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head10_jun = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head10_jul = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head10_aug = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head10_sep = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head10_oct = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head10_nov = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head10_dec = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head10_jan = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head10_feb = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head10_mar = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Head 11 - Months
    head11_apr = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head11_may = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head11_jun = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head11_jul = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head11_aug = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head11_sep = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head11_oct = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head11_nov = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head11_dec = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head11_jan = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head11_feb = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head11_mar = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Head 12 - Months
    head12_apr = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head12_may = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head12_jun = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head12_jul = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head12_aug = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head12_sep = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head12_oct = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head12_nov = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head12_dec = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head12_jan = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head12_feb = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head12_mar = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Head 13 - Months
    head13_apr = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head13_may = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head13_jun = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head13_jul = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head13_aug = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head13_sep = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head13_oct = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head13_nov = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head13_dec = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head13_jan = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head13_feb = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head13_mar = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Head 14 - Months
    head14_apr = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head14_may = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head14_jun = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head14_jul = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head14_aug = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head14_sep = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head14_oct = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head14_nov = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head14_dec = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head14_jan = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head14_feb = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head14_mar = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Head 15 - Months
    head15_apr = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head15_may = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head15_jun = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head15_jul = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head15_aug = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head15_sep = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head15_oct = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head15_nov = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head15_dec = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head15_jan = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head15_feb = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head15_mar = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Head 16 - Months
    head16_apr = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head16_may = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head16_jun = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head16_jul = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head16_aug = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head16_sep = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head16_oct = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head16_nov = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head16_dec = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head16_jan = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head16_feb = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head16_mar = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Head 17 - Months
    head17_apr = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head17_may = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head17_jun = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head17_jul = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head17_aug = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head17_sep = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head17_oct = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head17_nov = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head17_dec = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head17_jan = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head17_feb = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head17_mar = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Head 18 - Months
    head18_apr = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head18_may = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head18_jun = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head18_jul = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head18_aug = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head18_sep = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head18_oct = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head18_nov = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head18_dec = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head18_jan = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head18_feb = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head18_mar = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Head 19 - Months
    head19_apr = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head19_may = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head19_jun = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head19_jul = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head19_aug = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head19_sep = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head19_oct = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head19_nov = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head19_dec = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head19_jan = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head19_feb = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head19_mar = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Head 20 - Months
    head20_apr = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head20_may = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head20_jun = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head20_jul = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head20_aug = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head20_sep = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head20_oct = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head20_nov = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head20_dec = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head20_jan = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head20_feb = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    head20_mar = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'student_fee_details'
        ordering = ['stu_id']

    def __str__(self):
        return f'Student ID: {self.stu_id} - Session: {self.session}'
    
    @classmethod
    def get_head_field_name(cls, head_number, month_abbr):
        """
        Get field name for a specific head and month
        head_number: 1-20
        month_abbr: 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'
        Returns: 'head{N}_{month}' e.g., 'head1_apr'
        """
        return f'head{head_number}_{month_abbr}'


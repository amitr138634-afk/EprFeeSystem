from django.db import models


class Department(models.Model):
    STATUS_CHOICES = [('active', 'Active'), ('inactive', 'Inactive')]
    
    name = models.CharField(max_length=100)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'departments'

    def __str__(self):
        return self.name


class Designation(models.Model):
    STATUS_CHOICES = [('active', 'Active'), ('inactive', 'Inactive')]
    
    name = models.CharField(max_length=100)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'designations'

    def __str__(self):
        return self.name


class DepartmentDesignation(models.Model):
    """Maps departments to their allowed designations"""
    STATUS_CHOICES = [('active', 'Active'), ('inactive', 'Inactive')]
    
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='department_designations')
    designations = models.ManyToManyField(Designation, related_name='department_mappings')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'department_designations'
        unique_together = ['department']

    def __str__(self):
        return f"{self.department.name} - Designations"


class Staff(models.Model):
    GENDER_CHOICES = [('M', 'Male'), ('F', 'Female'), ('O', 'Other')]
    STATUS_CHOICES = [('active', 'Active'), ('inactive', 'Inactive'), ('resigned', 'Resigned')]
    STAFF_TYPE_CHOICES = [('teaching', 'Teaching'), ('non_teaching', 'Non-Teaching')]
    MARITAL_STATUS_CHOICES = [('single', 'Single'), ('married', 'Married'), ('divorced', 'Divorced'), ('widowed', 'Widowed')]

    # Personal Information
    employee_id = models.CharField(max_length=20, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15)
    alternate_phone = models.CharField(max_length=15, blank=True)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    blood_group = models.CharField(max_length=5, blank=True)
    aadhar_no = models.CharField(max_length=12, blank=True)
    pan_no = models.CharField(max_length=10, blank=True)
    photo = models.ImageField(upload_to='staff_photos/', null=True, blank=True)
    aadhar_card = models.FileField(upload_to='staff_documents/aadhar/', null=True, blank=True)
    pan_card = models.FileField(upload_to='staff_documents/pan/', null=True, blank=True)
    address = models.TextField()
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=10, blank=True)

    # Bank Information
    bank_name = models.CharField(max_length=100, blank=True)
    bank_account = models.CharField(max_length=20, blank=True)
    bank_ifsc = models.CharField(max_length=15, blank=True)
    salary = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Family Information
    father_or_husband_name = models.CharField(max_length=100, blank=True)
    mother_name = models.CharField(max_length=100, blank=True)
    marital_status = models.CharField(max_length=10, choices=MARITAL_STATUS_CHOICES, default='single')
    spouse_name = models.CharField(max_length=100, blank=True)
    emergency_contact_person = models.CharField(max_length=100, blank=True)
    emergency_contact_number = models.CharField(max_length=15, blank=True)

    # Employment Information
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, related_name='staff')
    designation = models.ForeignKey(Designation, on_delete=models.SET_NULL, null=True, related_name='staff_set')
    staff_type = models.CharField(max_length=15, choices=STAFF_TYPE_CHOICES, default='teaching')
    class_assigned = models.ForeignKey('students.ClassMaster', on_delete=models.SET_NULL, null=True, blank=True, related_name='class_teachers')
    section_assigned = models.ForeignKey('students.ClassSectionMaster', on_delete=models.SET_NULL, null=True, blank=True, related_name='section_teachers')
    joining_date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    qualification = models.CharField(max_length=200, blank=True)
    experience_years = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'staff'
        ordering = ['first_name', 'last_name']

    def __str__(self):
        return f'{self.first_name} {self.last_name} ({self.employee_id})'

    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name}'


class Shift(models.Model):
    name = models.CharField(max_length=50)
    start_time = models.TimeField()
    end_time = models.TimeField()
    grace_minutes = models.IntegerField(default=10)
    is_default = models.BooleanField(default=False)

    class Meta:
        db_table = 'shifts'

    def __str__(self):
        return f'{self.name} ({self.start_time} - {self.end_time})'


class LeaveType(models.Model):
    name = models.CharField(max_length=50)
    code = models.CharField(max_length=10, unique=True)
    days_allowed = models.IntegerField(default=0)
    is_paid = models.BooleanField(default=True)

    class Meta:
        db_table = 'leave_types'

    def __str__(self):
        return self.name


class LeaveRequest(models.Model):
    STATUS_CHOICES = [('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')]

    staff = models.ForeignKey(Staff, on_delete=models.CASCADE, related_name='leave_requests')
    leave_type = models.ForeignKey(LeaveType, on_delete=models.CASCADE)
    from_date = models.DateField()
    to_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    approved_by = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, blank=True, related_name='approvals')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'leave_requests'

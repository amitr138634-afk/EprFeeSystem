from django.db import models


class Class(models.Model):
    name = models.CharField(max_length=20)
    order = models.IntegerField(default=0)

    class Meta:
        db_table = 'classes'
        ordering = ['order']

    def __str__(self):
        return self.name


class Section(models.Model):
    name = models.CharField(max_length=10)
    class_ref = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='sections')

    class Meta:
        db_table = 'sections'

    def __str__(self):
        return f'{self.class_ref.name}-{self.name}'


# Fee-backend ke tables ko use karne ke liye (managed=False means no migrations)
class ClassMaster(models.Model):
    """Uses class_master table from fee-backend (no migrations generated here)"""
    class_name = models.CharField(max_length=50, verbose_name='Class')
    status = models.BooleanField(default=True, help_text='1=Active, 0=Inactive')
    session = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'class_master'
        managed = False  # Table created by fee-backend
        ordering = ['class_name']

    def __str__(self):
        return f'{self.class_name} ({self.session})'


class ClassSectionMaster(models.Model):
    """Uses class_section_master table from fee-backend (no migrations generated here)"""
    class_master = models.ForeignKey(ClassMaster, on_delete=models.CASCADE, related_name='sections')
    section_name = models.CharField(max_length=10, verbose_name='Section')
    status = models.BooleanField(default=True, help_text='1=Active, 0=Inactive')
    session = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'class_section_master'
        managed = False  # Table created by fee-backend
        ordering = ['class_master', 'section_name']

    def __str__(self):
        return f'{self.class_master.class_name} - {self.section_name}'


class Student(models.Model):
    GENDER_CHOICES = [('M', 'Male'), ('F', 'Female'), ('O', 'Other')]
    CATEGORY_CHOICES = [('GEN', 'General'), ('OBC', 'OBC'), ('SC', 'SC'), ('ST', 'ST'), ('EWS', 'EWS')]
    STATUS_CHOICES = [('active', 'Active'), ('inactive', 'Inactive'), ('tc_issued', 'TC Issued')]

    admission_no = models.CharField(max_length=20, unique=True)
    roll_no = models.CharField(max_length=10, blank=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    category = models.CharField(max_length=5, choices=CATEGORY_CHOICES, default='GEN')
    blood_group = models.CharField(max_length=5, blank=True)
    religion = models.CharField(max_length=50, blank=True)
    nationality = models.CharField(max_length=50, default='Indian')
    mother_tongue = models.CharField(max_length=50, blank=True)
    aadhar_no = models.CharField(max_length=12, blank=True)

    class_ref = models.ForeignKey(Class, on_delete=models.SET_NULL, null=True)
    section = models.ForeignKey(Section, on_delete=models.SET_NULL, null=True)
    session_year = models.CharField(max_length=10)

    father_name = models.CharField(max_length=100)
    father_phone = models.CharField(max_length=15)
    father_occupation = models.CharField(max_length=100, blank=True)
    mother_name = models.CharField(max_length=100)
    mother_phone = models.CharField(max_length=15, blank=True)
    guardian_name = models.CharField(max_length=100, blank=True)
    guardian_phone = models.CharField(max_length=15, blank=True)
    address = models.TextField()
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=10, blank=True)

    photo = models.ImageField(upload_to='student_photos/', null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    admission_date = models.DateField()
    previous_school = models.CharField(max_length=200, blank=True)
    using_transport = models.BooleanField(default=False)
    using_hostel = models.BooleanField(default=False)
    sibling = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='siblings')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'students'
        ordering = ['class_ref__order', 'section__name', 'first_name']

    def __str__(self):
        return f'{self.first_name} {self.last_name} ({self.admission_no})'

    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name}'

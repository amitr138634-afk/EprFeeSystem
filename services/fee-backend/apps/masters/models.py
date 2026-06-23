from django.db import models


class ClassMaster(models.Model):
    # id auto-increment by default
    class_name = models.CharField(max_length=50, verbose_name='Class')
    status = models.BooleanField(default=True, help_text='1=Active, 0=Inactive')
    session = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'class_master'
        ordering = ['class_name']

    def __str__(self):
        return f'{self.class_name} ({self.session})'


class SectionMaster(models.Model):
    """Independent Section Master - just section name and status"""
    # id auto-increment by default
    section = models.CharField(max_length=50, verbose_name='Section Name', unique=True)
    status = models.BooleanField(default=True, help_text='1=Active, 0=Inactive')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'sec_master'
        ordering = ['section']

    def __str__(self):
        return self.section


class ClassSectionMaster(models.Model):
    """Pure mapping: which generic SectionMaster sections exist for which
    class. Names are never stored here directly — resolve them via
    class_master.class_name and section_master.section."""
    # id auto-increment by default
    class_master = models.ForeignKey(ClassMaster, on_delete=models.CASCADE, related_name='sections')
    section_master = models.ForeignKey(SectionMaster, on_delete=models.CASCADE, related_name='class_sections')
    status = models.BooleanField(default=True, help_text='1=Active, 0=Inactive')
    session = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'class_section_master'
        ordering = ['class_master', 'section_master']
        unique_together = ['class_master', 'section_master', 'session']  # Prevent duplicates

    def __str__(self):
        return f'{self.class_master.class_name} - {self.section_master.section}'

    @property
    def section_name(self):
        """Back-compat accessor — existing code/serializers read
        `.section_name` as a plain attribute; this resolves it via the FK
        instead of a duplicated text column."""
        return self.section_master.section



class Student(models.Model):
    """Student master table for fee-backend"""
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('tc_issued', 'TC Issued'),
    ]
    
    TYPE_CHOICES = [
        ('new', 'New'),
        ('old', 'Old'),
    ]
    
    admission_no = models.CharField(max_length=20, unique=True)
    roll_no = models.CharField(max_length=20, blank=True)
    photo = models.ImageField(upload_to='student_photos/', null=True, blank=True)
    student_name = models.CharField(max_length=200)
    father_name = models.CharField(max_length=200)
    mother_name = models.CharField(max_length=200)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    father_mobile = models.CharField(max_length=15)
    mother_mobile = models.CharField(max_length=15, blank=True)
    father_email = models.EmailField(blank=True)
    mother_email = models.EmailField(blank=True)
    class_name = models.CharField(max_length=50)
    section = models.CharField(max_length=10, default='A')  # Default section A
    type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='new')  # New/Old student
    session = models.CharField(max_length=20)
    admission_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'students'
        ordering = ['-admission_date']

    def __str__(self):
        return f'{self.student_name} ({self.admission_no})'


class SessionMaster(models.Model):
    """Academic session master - simplified version"""
    session_year = models.CharField(max_length=20, unique=True)  # '2024-2025'
    status = models.BooleanField(default=True, help_text='1=Active, 0=Inactive')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'session_master'
        ordering = ['-session_year']

    def __str__(self):
        return self.session_year


class HouseMaster(models.Model):
    """School house (sports day / inter-house competitions etc.)"""
    house_name = models.CharField(max_length=50, verbose_name='House Name', unique=True)
    color = models.CharField(max_length=30, blank=True, help_text='e.g. Red, #FF0000')
    status = models.BooleanField(default=True, help_text='1=Active, 0=Inactive')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'house_master'
        ordering = ['house_name']

    def __str__(self):
        return self.house_name


class BloodGroupMaster(models.Model):
    """Blood group options (A+, B+, O-, etc.) for student records"""
    name = models.CharField(max_length=10, verbose_name='Blood Group', unique=True)
    status = models.BooleanField(default=True, help_text='1=Active, 0=Inactive')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'blood_group_master'
        ordering = ['name']

    def __str__(self):
        return self.name


class SchoolMaster(models.Model):
    """Single-record school info (name, address, board, logo, etc.) — used
    on receipts, ID cards, report cards. Singleton: always accessed/created
    as id=1, never listed."""
    school_name = models.CharField(max_length=200, blank=True)
    address = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=10, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    website = models.CharField(max_length=200, blank=True)
    affiliation_board = models.CharField(max_length=100, blank=True)
    registration_no = models.CharField(max_length=100, blank=True)
    established_year = models.CharField(max_length=4, blank=True)
    principal_name = models.CharField(max_length=200, blank=True)
    logo = models.ImageField(upload_to='school_logo/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'school_master'

    def __str__(self):
        return self.school_name or 'School Info'


class CategoryMaster(models.Model):
    """Admission/reservation category (General, OBC, SC, ST, EWS, etc.)"""
    category_name = models.CharField(max_length=50, verbose_name='Category Name', unique=True)
    status = models.BooleanField(default=True, help_text='1=Active, 0=Inactive')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'category_master'
        ordering = ['category_name']

    def __str__(self):
        return self.category_name


class ReligionMaster(models.Model):
    """Religion options for student records"""
    religion_name = models.CharField(max_length=50, verbose_name='Religion Name', unique=True)
    status = models.BooleanField(default=True, help_text='1=Active, 0=Inactive')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'religion_master'
        ordering = ['religion_name']

    def __str__(self):
        return self.religion_name


class CasteMaster(models.Model):
    """Caste options for student records"""
    caste_name = models.CharField(max_length=50, verbose_name='Caste Name', unique=True)
    status = models.BooleanField(default=True, help_text='1=Active, 0=Inactive')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'caste_master'
        ordering = ['caste_name']

    def __str__(self):
        return self.caste_name


class AttendanceMaster(models.Model):
    """Attendance status options (Present, Absent, Leave, etc.) — feeds the
    attendance status dropdown on Transport Attendance (and any future
    attendance register)."""
    status_name = models.CharField(max_length=30, verbose_name='Status Name', unique=True)
    status = models.BooleanField(default=True, help_text='1=Active, 0=Inactive')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'attendance_master'
        ordering = ['status_name']

    def __str__(self):
        return self.status_name


class CertificateMaster(models.Model):
    """Certificate types (Birth Certificate, Transfer Certificate, Caste
    Certificate, etc.) — defines exactly which certificate upload slots
    appear on a student's profile."""
    certificate_name = models.CharField(max_length=100, verbose_name='Certificate Name', unique=True)
    status = models.BooleanField(default=True, help_text='1=Active, 0=Inactive')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'certificate_master'
        ordering = ['certificate_name']

    def __str__(self):
        return self.certificate_name


class StudentCertificate(models.Model):
    """A student's uploaded file for one CertificateMaster type. One row per
    (student, certificate type) — re-uploading replaces the existing file."""
    stu_id = models.IntegerField()  # References students.id
    certificate_id = models.IntegerField()  # References CertificateMaster.id
    certificate_name = models.CharField(max_length=100, blank=True)  # denormalized for display
    file = models.FileField(upload_to='student_certificates/')
    uploaded_by = models.IntegerField(null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'student_certificates'
        unique_together = ['stu_id', 'certificate_id']

    def __str__(self):
        return f'Student {self.stu_id} - {self.certificate_name}'



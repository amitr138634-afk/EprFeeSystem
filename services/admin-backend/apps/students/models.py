from django.db import models


# ══════════════════════════════════════════════════════════════════════════════
# MANAGED=FALSE MODELS - Tables created and managed by fee-backend
# ══════════════════════════════════════════════════════════════════════════════

class SectionMaster(models.Model):
    """Uses sec_master table from fee-backend - Generic sections (A, B, C, D etc)"""
    section = models.CharField(max_length=50, verbose_name='Section Name', unique=True)
    status = models.BooleanField(default=True, help_text='1=Active, 0=Inactive')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'sec_master'
        managed = False  # Table created by fee-backend
        ordering = ['section']

    def __str__(self):
        return self.section


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
    """Uses class_section_master table from fee-backend (no migrations generated here).
    Pure mapping: which generic SectionMaster sections exist for which class.
    Names are never stored here directly — resolve via class_master.class_name
    and section_master.section."""
    class_master = models.ForeignKey(ClassMaster, on_delete=models.CASCADE, related_name='sections')
    section_master = models.ForeignKey(SectionMaster, on_delete=models.CASCADE, related_name='class_sections')
    status = models.BooleanField(default=True, help_text='1=Active, 0=Inactive')
    session = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'class_section_master'
        managed = False  # Table created by fee-backend
        ordering = ['class_master', 'section_master']

    def __str__(self):
        return f'{self.class_master.class_name} - {self.section_master.section}'

    @property
    def section_name(self):
        """Back-compat accessor — existing code/serializers read
        `.section_name` as a plain attribute; this resolves it via the FK
        instead of a duplicated text column."""
        return self.section_master.section


class Student(models.Model):
    """Uses students table from fee-backend - Single source of truth"""
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
    section = models.CharField(max_length=10, default='A')
    type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='new')
    session = models.CharField(max_length=20)
    admission_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'students'
        managed = False  # Table created and managed by fee-backend
        ordering = ['-admission_date']

    def __str__(self):
        return f'{self.student_name} ({self.admission_no})'


class SessionMaster(models.Model):
    """Uses session_master table from fee-backend"""
    session_year = models.CharField(max_length=20, unique=True)
    status = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'session_master'
        managed = False  # Table created and managed by fee-backend
        ordering = ['-session_year']
    
    def __str__(self):
        return self.session_year


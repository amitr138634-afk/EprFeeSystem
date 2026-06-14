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
    # id auto-increment by default
    class_master = models.ForeignKey(ClassMaster, on_delete=models.CASCADE, related_name='sections')
    section_name = models.CharField(max_length=10, verbose_name='Section')
    status = models.BooleanField(default=True, help_text='1=Active, 0=Inactive')
    session = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'class_section_master'
        ordering = ['class_master', 'section_name']
        unique_together = ['class_master', 'section_name', 'session']  # Prevent duplicates

    def __str__(self):
        return f'{self.class_master.class_name} - {self.section_name}'



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
    
    admission_no = models.CharField(max_length=20, unique=True)
    student_name = models.CharField(max_length=200)
    father_name = models.CharField(max_length=200)
    mother_name = models.CharField(max_length=200)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    father_mobile = models.CharField(max_length=15)
    mother_mobile = models.CharField(max_length=15, blank=True)
    father_email = models.EmailField(blank=True)
    mother_email = models.EmailField(blank=True)
    class_id = models.IntegerField()
    class_name = models.CharField(max_length=50)
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



from django.db import models
from apps.students.models import Student, Class, Section
from apps.timetable.models import Subject
from apps.staff.models import Staff


class ExamType(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20)
    max_marks = models.DecimalField(max_digits=5, decimal_places=2)
    passing_marks = models.DecimalField(max_digits=5, decimal_places=2)
    weightage = models.DecimalField(max_digits=5, decimal_places=2, default=100)
    session_year = models.CharField(max_length=10)

    class Meta:
        db_table = 'exam_types'

    def __str__(self):
        return f'{self.name} ({self.session_year})'


class SubjectAllocation(models.Model):
    class_ref = models.ForeignKey(Class, on_delete=models.CASCADE)
    section = models.ForeignKey(Section, on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    teacher = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True)
    session_year = models.CharField(max_length=10)

    class Meta:
        db_table = 'subject_allocations'
        unique_together = ['class_ref', 'section', 'subject', 'session_year']


class StudentSubject(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='subjects')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    session_year = models.CharField(max_length=10)
    is_elective = models.BooleanField(default=False)

    class Meta:
        db_table = 'student_subjects'
        unique_together = ['student', 'subject', 'session_year']


class Marks(models.Model):
    GRADE_CHOICES = [
        ('A1', 'A1'), ('A2', 'A2'), ('B1', 'B1'), ('B2', 'B2'),
        ('C1', 'C1'), ('C2', 'C2'), ('D', 'D'), ('E1', 'E1'), ('E2', 'E2'),
    ]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='marks')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    exam_type = models.ForeignKey(ExamType, on_delete=models.CASCADE)
    marks_obtained = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    grade = models.CharField(max_length=3, choices=GRADE_CHOICES, blank=True)
    remarks = models.CharField(max_length=200, blank=True)
    is_absent = models.BooleanField(default=False)
    entered_by = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'marks'
        unique_together = ['student', 'subject', 'exam_type']


class RemarkMaster(models.Model):
    text = models.CharField(max_length=200)
    category = models.CharField(max_length=50, blank=True)

    class Meta:
        db_table = 'remark_masters'


class SignatureMaster(models.Model):
    title = models.CharField(max_length=100)
    signature = models.ImageField(upload_to='signatures/')
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'signature_masters'


class GradeScale(models.Model):
    """Grade bands used to compute the overall grade shown on report cards."""
    grade = models.CharField(max_length=5)
    min_percent = models.DecimalField(max_digits=5, decimal_places=2)
    max_percent = models.DecimalField(max_digits=5, decimal_places=2)
    grade_point = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    remark = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = 'grade_scales'
        ordering = ['-min_percent']

    def __str__(self):
        return f'{self.grade} ({self.min_percent}-{self.max_percent}%)'

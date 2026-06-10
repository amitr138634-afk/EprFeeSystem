from django.db import models
from apps.students.models import Class, Section
from apps.staff.models import Staff


class Subject(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    is_elective = models.BooleanField(default=False)

    class Meta:
        db_table = 'subjects'

    def __str__(self):
        return f'{self.name} ({self.code})'


class Period(models.Model):
    name = models.CharField(max_length=20)
    start_time = models.TimeField()
    end_time = models.TimeField()
    order = models.IntegerField(default=0)
    is_break = models.BooleanField(default=False)

    class Meta:
        db_table = 'periods'
        ordering = ['order']

    def __str__(self):
        return f'{self.name} ({self.start_time}-{self.end_time})'


class Timetable(models.Model):
    DAYS = [
        ('MON', 'Monday'), ('TUE', 'Tuesday'), ('WED', 'Wednesday'),
        ('THU', 'Thursday'), ('FRI', 'Friday'), ('SAT', 'Saturday'),
    ]

    class_ref = models.ForeignKey(Class, on_delete=models.CASCADE)
    section = models.ForeignKey(Section, on_delete=models.CASCADE)
    day = models.CharField(max_length=3, choices=DAYS)
    period = models.ForeignKey(Period, on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, null=True, blank=True)
    teacher = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, blank=True)
    room = models.CharField(max_length=20, blank=True)
    session_year = models.CharField(max_length=10)

    class Meta:
        db_table = 'timetable'
        unique_together = ['class_ref', 'section', 'day', 'period', 'session_year']

    def __str__(self):
        return f'{self.class_ref}-{self.section} {self.day} {self.period}'


class SubstituteTeacher(models.Model):
    original_teacher = models.ForeignKey(Staff, on_delete=models.CASCADE, related_name='substitute_for')
    substitute_teacher = models.ForeignKey(Staff, on_delete=models.CASCADE, related_name='substitutions')
    timetable = models.ForeignKey(Timetable, on_delete=models.CASCADE)
    date = models.DateField()
    reason = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'substitute_teachers'

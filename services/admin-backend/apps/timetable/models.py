from django.db import models
from apps.students.models import ClassMaster, ClassSectionMaster
from apps.staff.models import Staff


class Subject(models.Model):
    """Subject Master - Global subjects list"""
    STATUS_CHOICES = [('active', 'Active'), ('inactive', 'Inactive')]
    
    name = models.CharField(max_length=100)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'subjects'
        ordering = ['name']

    def __str__(self):
        return self.name


class Period(models.Model):
    """Period Master - Time slots for timetable"""
    name = models.CharField(max_length=50)  # e.g., "Period 1", "Break", "Lunch"
    start_time = models.TimeField()
    end_time = models.TimeField()
    period_order = models.IntegerField(default=0, help_text='Display order')
    is_break = models.BooleanField(default=False, help_text='Is this a break period?')
    status = models.BooleanField(default=True, help_text='Active/Inactive')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'periods'
        ordering = ['period_order']

    def __str__(self):
        return f'{self.name} ({self.start_time.strftime("%H:%M")}-{self.end_time.strftime("%H:%M")})'
    
    @property
    def duration_minutes(self):
        """Calculate duration in minutes"""
        from datetime import datetime, timedelta
        start = datetime.combine(datetime.today(), self.start_time)
        end = datetime.combine(datetime.today(), self.end_time)
        duration = end - start
        return int(duration.total_seconds() / 60)


class Timetable(models.Model):
    DAYS = [
        ('MON', 'Monday'), ('TUE', 'Tuesday'), ('WED', 'Wednesday'),
        ('THU', 'Thursday'), ('FRI', 'Friday'), ('SAT', 'Saturday'),
    ]

    class_ref = models.ForeignKey(ClassMaster, on_delete=models.CASCADE, related_name='timetables')
    sections = models.ManyToManyField(ClassSectionMaster, blank=True, related_name='timetables')
    day = models.CharField(max_length=3, choices=DAYS)
    period = models.ForeignKey(Period, on_delete=models.CASCADE, related_name='timetable_entries')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, null=True, blank=True)
    teacher = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, blank=True)
    room = models.CharField(max_length=20, blank=True)
    session_year = models.CharField(max_length=10)

    class Meta:
        db_table = 'timetable'
        ordering = ['day', 'period__period_order']

    def __str__(self):
        sections_str = ', '.join([s.section_name for s in self.sections.all()]) if self.sections.exists() else 'All'
        return f'{self.class_ref.class_name} ({sections_str}) - {self.day} - {self.period}'


class SubstituteTeacher(models.Model):
    original_teacher = models.ForeignKey(Staff, on_delete=models.CASCADE, related_name='substitute_for')
    substitute_teacher = models.ForeignKey(Staff, on_delete=models.CASCADE, related_name='substitutions')
    timetable = models.ForeignKey(Timetable, on_delete=models.CASCADE)
    date = models.DateField()
    reason = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'substitute_teachers'

from django.db import models
from apps.students.models import Student, ClassMaster, ClassSectionMaster
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


# NOTE: SubjectAllocation needs redesign to work with fee-backend structure
# Temporarily disabled - will be fixed in next iteration
# class SubjectAllocation(models.Model):
#     class_ref = models.ForeignKey(ClassMaster, on_delete=models.CASCADE)
#     section = models.ForeignKey(ClassSectionMaster, on_delete=models.CASCADE)
#     subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
#     teacher = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True)
#     session_year = models.CharField(max_length=10)
#
#     class Meta:
#         db_table = 'subject_allocations'
#         unique_together = ['class_ref', 'section', 'subject', 'session_year']


class StudentSubject(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='subjects')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    session_year = models.CharField(max_length=10)
    is_elective = models.BooleanField(default=False)

    class Meta:
        db_table = 'student_subjects'
        unique_together = ['student', 'subject', 'session_year']


class Marks(models.Model):
    """Legacy rows are keyed by (student, subject, exam_type) — the old
    weightage-based report-card flow, untouched. New CCE Marks Feeding rows
    leave exam_type null and use (student, subject_or_co_scholastic_subject,
    test, session) instead; uniqueness for that shape is enforced in
    MarksFeedingGridView's upsert logic rather than a DB constraint, since a
    second unique_together with nullable columns wouldn't reliably catch
    duplicates (NULL never equals NULL in SQL)."""
    GRADE_CHOICES = [
        ('A1', 'A1'), ('A2', 'A2'), ('B1', 'B1'), ('B2', 'B2'),
        ('C1', 'C1'), ('C2', 'C2'), ('D', 'D'), ('E1', 'E1'), ('E2', 'E2'),
    ]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='marks')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, null=True, blank=True)
    co_scholastic_subject = models.ForeignKey('CoScholasticSubject', on_delete=models.SET_NULL, null=True, blank=True)
    exam_type = models.ForeignKey(ExamType, on_delete=models.CASCADE, null=True, blank=True)
    test = models.ForeignKey('Test', on_delete=models.SET_NULL, null=True, blank=True)
    class_ref = models.ForeignKey(ClassMaster, on_delete=models.SET_NULL, null=True, blank=True)
    section = models.ForeignKey(ClassSectionMaster, on_delete=models.SET_NULL, null=True, blank=True)
    session = models.CharField(max_length=10, blank=True)
    marks_obtained = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    grade = models.CharField(max_length=20, blank=True)
    remarks = models.CharField(max_length=200, blank=True)
    is_absent = models.BooleanField(default=False)
    entered_by = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'marks'
        unique_together = ['student', 'subject', 'exam_type']


class Remark(models.Model):
    """Predefined remark for a class, mapped to one or more of that class's
    sections. Shown as a per-student dropdown column in Marks Feeding; the
    dropdown only lists remarks whose class + section match the grid's
    selected class + section.

    section_ids holds comma-separated ClassSectionMaster ids (e.g. "10,12")
    rather than a join table — a remark only ever maps to a handful of
    sections within one class, so this is simpler than a separate table."""
    text = models.CharField(max_length=200)
    class_ref = models.ForeignKey(ClassMaster, on_delete=models.CASCADE, related_name='remarks')
    section_ids = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)
    display_order = models.IntegerField(default=0)
    session = models.CharField(max_length=10)

    class Meta:
        db_table = 'remarks'
        ordering = ['display_order', 'id']

    def __str__(self):
        return self.text

    def section_id_list(self):
        return [int(x) for x in self.section_ids.split(',') if x.strip().isdigit()]


class StudentRemark(models.Model):
    """A teacher's remark selection for one student, per test. One remark per
    (student, test, session). remark null = no selection / cleared."""
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='student_remarks')
    test = models.ForeignKey('Test', on_delete=models.CASCADE)
    remark = models.ForeignKey(Remark, on_delete=models.SET_NULL, null=True, blank=True)
    class_ref = models.ForeignKey(ClassMaster, on_delete=models.SET_NULL, null=True, blank=True)
    section = models.ForeignKey(ClassSectionMaster, on_delete=models.SET_NULL, null=True, blank=True)
    session = models.CharField(max_length=10, blank=True)
    entered_by = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'student_remarks'
        unique_together = ['student', 'test', 'session']


class SignatureMaster(models.Model):
    """Signature images printed on report cards. Principal and Examination IC
    are school-level singletons (one per session); Class Teacher has one
    record per class+section (one per session). The class teacher's name is
    never stored here — it's resolved live from Staff.class_assigned/
    section_assigned via the SignatureSerializer, so reassigning the class
    teacher updates report cards automatically without re-saving this row."""
    DESIGNATION_CHOICES = [
        ('principal', 'Principal'),
        ('examination_ic', 'Examination IC'),
        ('class_teacher', 'Class Teacher'),
    ]
    designation = models.CharField(max_length=20, choices=DESIGNATION_CHOICES)
    class_ref = models.ForeignKey(ClassMaster, on_delete=models.CASCADE, null=True, blank=True, related_name='signatures')
    section = models.ForeignKey(ClassSectionMaster, on_delete=models.CASCADE, null=True, blank=True, related_name='signatures')
    original_image = models.ImageField(upload_to='signatures/original/')
    processed_image = models.ImageField(upload_to='signatures/processed/', null=True, blank=True)
    is_active = models.BooleanField(default=True)
    session = models.CharField(max_length=10)

    class Meta:
        db_table = 'signature_masters'
        constraints = [
            models.UniqueConstraint(
                fields=['designation', 'session'],
                condition=models.Q(designation__in=['principal', 'examination_ic']),
                name='unique_singleton_signature_per_session',
            ),
            models.UniqueConstraint(
                fields=['designation', 'class_ref', 'section', 'session'],
                condition=models.Q(designation='class_teacher'),
                name='unique_class_teacher_signature_per_session',
            ),
        ]

    def __str__(self):
        return f'{self.get_designation_display()} ({self.session})'


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


# ─────────────────────────────────────────────────────────────────────────────
# CCE — Assign Subject & Test master configuration
# ─────────────────────────────────────────────────────────────────────────────
class Grade(models.Model):
    """Grade Master — one table for both marks-based bands and direct grades.

    Marks Based (``min_marks``/``max_marks`` required) is used to auto-calculate
    a grade from entered marks. Direct Grade (``min_marks``/``max_marks`` null)
    appears as a dropdown option when a teacher assigns a grade without marks.
    Consumers filter by ``grade_type``.
    """
    TYPE_CHOICES = [('marks_based', 'Marks Based'), ('direct', 'Direct Grade')]

    grade_label = models.CharField(max_length=20)
    min_marks = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    max_marks = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    remark = models.CharField(max_length=200, blank=True)
    display_order = models.IntegerField(default=0)
    grade_type = models.CharField(max_length=12, choices=TYPE_CHOICES, default='marks_based')
    session = models.CharField(max_length=10)

    class Meta:
        db_table = 'grade_master'
        ordering = ['grade_type', 'display_order', 'id']

    def __str__(self):
        return f'{self.grade_label} ({self.get_grade_type_display()})'


class Test(models.Model):
    """Test Master — tests that become the columns of the Assign Subject & Test grid."""
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, blank=True)
    display_order = models.IntegerField(default=0)
    session = models.CharField(max_length=10)

    class Meta:
        db_table = 'tests'
        ordering = ['display_order', 'id']

    def __str__(self):
        return self.name


class CoScholasticSubject(models.Model):
    """Master of co-scholastic activities (Art, Music, Sports, Discipline...) that
    never appear in the timetable. Always graded as Direct Grade. Shown in the
    Co-Scholastic section of every class-section for the active session."""
    name = models.CharField(max_length=100)
    display_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    session = models.CharField(max_length=10)

    class Meta:
        db_table = 'co_scholastic_subjects'
        ordering = ['display_order', 'id']

    def __str__(self):
        return self.name


class SubjectAssignment(models.Model):
    """Evaluation config for one timetable subject in a class-section (mode is per
    subject, shared across all that subject's tests).

    Scholastic subjects use ``marks`` / ``marks_grade``. A subject moved to the
    Co-Scholastic section has ``is_co_scholastic=True`` and mode ``direct`` (no
    test marks)."""
    MODE_CHOICES = [
        ('marks', 'Marks'),
        ('marks_grade', 'Marks Based Grade'),
        ('direct', 'Direct Grade'),
    ]

    class_ref = models.ForeignKey(ClassMaster, on_delete=models.CASCADE)
    section = models.ForeignKey(ClassSectionMaster, on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    evaluation_mode = models.CharField(max_length=12, choices=MODE_CHOICES, default='marks')
    is_co_scholastic = models.BooleanField(default=False)
    session = models.CharField(max_length=10)

    class Meta:
        db_table = 'subject_assignments'
        unique_together = ['class_ref', 'section', 'subject', 'session']

    def __str__(self):
        return f'{self.subject} [{self.evaluation_mode}]'


class SubjectTestMark(models.Model):
    """Max marks for one (subject assignment, test) cell of the grid. Absent for
    Direct Grade subjects."""
    assignment = models.ForeignKey(SubjectAssignment, on_delete=models.CASCADE, related_name='test_marks')
    test = models.ForeignKey(Test, on_delete=models.CASCADE)
    max_marks = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)

    class Meta:
        db_table = 'subject_test_marks'
        unique_together = ['assignment', 'test']


class CoScholasticAssignment(models.Model):
    """Which class-sections a Co-Scholastic Subject Master activity applies to.
    A master activity (e.g. Art) only shows up in the Assign Subject & Test
    grid for the class-sections it's been assigned to here — it no longer
    applies to every class-section by default."""
    co_scholastic_subject = models.ForeignKey(CoScholasticSubject, on_delete=models.CASCADE, related_name='assignments')
    class_ref = models.ForeignKey(ClassMaster, on_delete=models.CASCADE)
    section = models.ForeignKey(ClassSectionMaster, on_delete=models.CASCADE)
    session = models.CharField(max_length=10)

    class Meta:
        db_table = 'co_scholastic_assignments'
        unique_together = ['co_scholastic_subject', 'class_ref', 'section', 'session']

    def __str__(self):
        return f'{self.co_scholastic_subject} - {self.class_ref} {self.section}'

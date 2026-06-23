from django.db import models


class Visitor(models.Model):
    PURPOSE_CHOICES = [
        ('meeting', 'Meeting'), ('enquiry', 'Enquiry'),
        ('delivery', 'Delivery'), ('other', 'Other')
    ]

    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15)
    address = models.CharField(max_length=200, blank=True)
    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES, default='meeting')
    whom_to_meet = models.CharField(max_length=100)
    id_proof_type = models.CharField(max_length=50, blank=True)
    id_proof_no = models.CharField(max_length=50, blank=True)
    visit_date = models.DateField(auto_now_add=True)
    in_time = models.TimeField(auto_now_add=True)
    out_time = models.TimeField(null=True, blank=True)
    remarks = models.TextField(blank=True)

    class Meta:
        db_table = 'visitors'
        ordering = ['-visit_date', '-in_time']


class ShortLeave(models.Model):
    STATUS_CHOICES = [('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')]

    student_id = models.IntegerField()
    student_name = models.CharField(max_length=200)
    class_name = models.CharField(max_length=50)
    section_name = models.CharField(max_length=10)
    reason = models.TextField()
    from_time = models.TimeField()
    to_time = models.TimeField(null=True, blank=True)
    leave_date = models.DateField()
    authorized_by = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'short_leaves'


class Feedback(models.Model):
    TYPE_CHOICES = [('feedback', 'Feedback'), ('suggestion', 'Suggestion'), ('complaint', 'Complaint')]
    STATUS_CHOICES = [('open', 'Open'), ('in_progress', 'In Progress'), ('resolved', 'Resolved')]

    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15, blank=True)
    email = models.EmailField(blank=True)
    type = models.CharField(max_length=15, choices=TYPE_CHOICES, default='feedback')
    subject = models.CharField(max_length=200)
    message = models.TextField()
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='open')
    response = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'feedbacks'


class AuthorisedPerson(models.Model):
    student_id = models.IntegerField()
    student_name = models.CharField(max_length=200)
    name = models.CharField(max_length=100)
    relation = models.CharField(max_length=50)
    phone = models.CharField(max_length=15)
    id_proof_type = models.CharField(max_length=50, blank=True)
    id_proof_no = models.CharField(max_length=50, blank=True)
    photo = models.ImageField(upload_to='authorised_persons/', null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'authorised_persons'


class HRMLetter(models.Model):
    LETTER_TYPE_CHOICES = [
        ('appointment', 'Appointment'), ('confirmation', 'Confirmation'),
        ('increment', 'Increment'), ('warning', 'Warning'), ('termination', 'Termination'),
        ('experience', 'Experience'), ('other', 'Other')
    ]

    staff_id = models.IntegerField()
    staff_name = models.CharField(max_length=200)
    letter_type = models.CharField(max_length=15, choices=LETTER_TYPE_CHOICES)
    subject = models.CharField(max_length=200)
    content = models.TextField()
    date = models.DateField()
    issued_by = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'hrm_letters'


class HRMCandidate(models.Model):
    """Staff recruitment candidate captured via Add HRM. Reviewed in List
    HRM (Interview status select) and decided in Add Letter (Selected /
    Rejected select, only shown there once an interview is scheduled)."""
    GENDER_CHOICES = [('M', 'Male'), ('F', 'Female'), ('O', 'Other')]
    INTERVIEW_CHOICES = [('not_scheduled', 'Not Scheduled'), ('scheduled', 'Interview Scheduled')]
    DECISION_CHOICES = [('pending', 'Pending'), ('selected', 'Selected'), ('rejected', 'Rejected')]

    # Section 1 — Personal Detail
    full_name = models.CharField(max_length=200)
    father_name = models.CharField(max_length=200, blank=True)
    mother_name = models.CharField(max_length=200, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True)
    mobile = models.CharField(max_length=15)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    photo = models.ImageField(upload_to='hrm_candidates/photos/', null=True, blank=True)

    # Section 2 — 10th Class Information
    tenth_school = models.CharField(max_length=200, blank=True)
    tenth_board = models.CharField(max_length=100, blank=True)
    tenth_year = models.CharField(max_length=4, blank=True)
    tenth_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    tenth_certificate = models.FileField(upload_to='hrm_candidates/tenth/', null=True, blank=True)

    # Section 3 — 12th Class Information
    twelfth_school = models.CharField(max_length=200, blank=True)
    twelfth_board = models.CharField(max_length=100, blank=True)
    twelfth_stream = models.CharField(max_length=100, blank=True)
    twelfth_year = models.CharField(max_length=4, blank=True)
    twelfth_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    twelfth_certificate = models.FileField(upload_to='hrm_candidates/twelfth/', null=True, blank=True)

    # Section 4 — Graduation Detail
    graduation_degree = models.CharField(max_length=150, blank=True)
    graduation_college = models.CharField(max_length=200, blank=True)
    graduation_university = models.CharField(max_length=200, blank=True)
    graduation_year = models.CharField(max_length=4, blank=True)
    graduation_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    graduation_certificate = models.FileField(upload_to='hrm_candidates/graduation/', null=True, blank=True)

    # Section 5 — Highest Study Information
    highest_qualification = models.CharField(max_length=150, blank=True)
    highest_institute = models.CharField(max_length=200, blank=True)
    highest_year = models.CharField(max_length=4, blank=True)
    highest_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    highest_certificate = models.FileField(upload_to='hrm_candidates/highest/', null=True, blank=True)

    # Section 6 — Certificate Uploads (additional documents)
    resume = models.FileField(upload_to='hrm_candidates/resume/', null=True, blank=True)
    other_certificate = models.FileField(upload_to='hrm_candidates/other/', null=True, blank=True)

    # Workflow
    interview_status = models.CharField(max_length=15, choices=INTERVIEW_CHOICES, default='not_scheduled')
    decision = models.CharField(max_length=10, choices=DECISION_CHOICES, default='pending')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'hrm_candidates'
        ordering = ['-created_at']

    def __str__(self):
        return self.full_name

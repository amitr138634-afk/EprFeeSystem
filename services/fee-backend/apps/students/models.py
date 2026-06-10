from django.db import models


class NewAdmission(models.Model):
    STATUS_CHOICES = [('enquiry', 'Enquiry'), ('applied', 'Applied'), ('admitted', 'Admitted'), ('cancelled', 'Cancelled')]

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    father_name = models.CharField(max_length=100)
    mother_name = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=15)
    email = models.EmailField(blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=1, choices=[('M', 'Male'), ('F', 'Female'), ('O', 'Other')], default='M')
    applying_for_class = models.CharField(max_length=50)
    session_year = models.CharField(max_length=10)
    previous_school = models.CharField(max_length=200, blank=True)
    address = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='enquiry')
    admission_no = models.CharField(max_length=20, blank=True)
    enquiry_date = models.DateField(auto_now_add=True)
    remarks = models.TextField(blank=True)

    class Meta:
        db_table = 'new_admissions'

    def __str__(self):
        return f'{self.first_name} {self.last_name}'


class EnquiryFollowUp(models.Model):
    admission = models.ForeignKey(NewAdmission, on_delete=models.CASCADE, related_name='follow_ups')
    follow_up_date = models.DateField()
    next_follow_up = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=50)
    remarks = models.TextField()
    done_by = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'enquiry_follow_ups'


class PromotionRecord(models.Model):
    student_id = models.IntegerField()
    from_class = models.CharField(max_length=50)
    from_section = models.CharField(max_length=10)
    to_class = models.CharField(max_length=50)
    to_section = models.CharField(max_length=10)
    from_session = models.CharField(max_length=10)
    to_session = models.CharField(max_length=10)
    status = models.CharField(max_length=15, choices=[('promoted', 'Promoted'), ('demoted', 'Demoted'), ('detained', 'Detained')], default='promoted')
    promoted_at = models.DateTimeField(auto_now_add=True)
    promoted_by = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = 'promotion_records'

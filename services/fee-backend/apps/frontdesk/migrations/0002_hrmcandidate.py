from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('frontdesk', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='HRMCandidate',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('full_name', models.CharField(max_length=200)),
                ('father_name', models.CharField(blank=True, max_length=200)),
                ('mother_name', models.CharField(blank=True, max_length=200)),
                ('date_of_birth', models.DateField(blank=True, null=True)),
                ('gender', models.CharField(blank=True, choices=[('M', 'Male'), ('F', 'Female'), ('O', 'Other')], max_length=1)),
                ('mobile', models.CharField(max_length=15)),
                ('email', models.EmailField(blank=True, max_length=254)),
                ('address', models.TextField(blank=True)),
                ('photo', models.ImageField(blank=True, null=True, upload_to='hrm_candidates/photos/')),
                ('tenth_school', models.CharField(blank=True, max_length=200)),
                ('tenth_board', models.CharField(blank=True, max_length=100)),
                ('tenth_year', models.CharField(blank=True, max_length=4)),
                ('tenth_percentage', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('tenth_certificate', models.FileField(blank=True, null=True, upload_to='hrm_candidates/tenth/')),
                ('twelfth_school', models.CharField(blank=True, max_length=200)),
                ('twelfth_board', models.CharField(blank=True, max_length=100)),
                ('twelfth_stream', models.CharField(blank=True, max_length=100)),
                ('twelfth_year', models.CharField(blank=True, max_length=4)),
                ('twelfth_percentage', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('twelfth_certificate', models.FileField(blank=True, null=True, upload_to='hrm_candidates/twelfth/')),
                ('graduation_degree', models.CharField(blank=True, max_length=150)),
                ('graduation_college', models.CharField(blank=True, max_length=200)),
                ('graduation_university', models.CharField(blank=True, max_length=200)),
                ('graduation_year', models.CharField(blank=True, max_length=4)),
                ('graduation_percentage', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('graduation_certificate', models.FileField(blank=True, null=True, upload_to='hrm_candidates/graduation/')),
                ('highest_qualification', models.CharField(blank=True, max_length=150)),
                ('highest_institute', models.CharField(blank=True, max_length=200)),
                ('highest_year', models.CharField(blank=True, max_length=4)),
                ('highest_percentage', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('highest_certificate', models.FileField(blank=True, null=True, upload_to='hrm_candidates/highest/')),
                ('resume', models.FileField(blank=True, null=True, upload_to='hrm_candidates/resume/')),
                ('other_certificate', models.FileField(blank=True, null=True, upload_to='hrm_candidates/other/')),
                ('interview_status', models.CharField(choices=[('not_scheduled', 'Not Scheduled'), ('scheduled', 'Interview Scheduled')], default='not_scheduled', max_length=15)),
                ('decision', models.CharField(choices=[('pending', 'Pending'), ('selected', 'Selected'), ('rejected', 'Rejected')], default='pending', max_length=10)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'hrm_candidates',
                'ordering': ['-created_at'],
            },
        ),
    ]

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('masters', '0011_attendancemaster'),
    ]

    operations = [
        migrations.CreateModel(
            name='CertificateMaster',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('certificate_name', models.CharField(max_length=100, unique=True, verbose_name='Certificate Name')),
                ('status', models.BooleanField(default=True, help_text='1=Active, 0=Inactive')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'certificate_master',
                'ordering': ['certificate_name'],
            },
        ),
        migrations.CreateModel(
            name='StudentCertificate',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('stu_id', models.IntegerField()),
                ('certificate_id', models.IntegerField()),
                ('certificate_name', models.CharField(blank=True, max_length=100)),
                ('file', models.FileField(upload_to='student_certificates/')),
                ('uploaded_by', models.IntegerField(blank=True, null=True)),
                ('uploaded_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'student_certificates',
            },
        ),
        migrations.AlterUniqueTogether(
            name='studentcertificate',
            unique_together={('stu_id', 'certificate_id')},
        ),
    ]

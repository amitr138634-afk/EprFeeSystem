# Generated migration file

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('fees', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='AdmissionQuery',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('student_name', models.CharField(max_length=200)),
                ('father_name', models.CharField(max_length=200)),
                ('mother_name', models.CharField(max_length=200)),
                ('date_of_birth', models.DateField()),
                ('gender', models.CharField(choices=[('male', 'Male'), ('female', 'Female'), ('other', 'Other')], max_length=10)),
                ('father_email', models.EmailField(blank=True, max_length=254, null=True)),
                ('mother_email', models.EmailField(blank=True, max_length=254, null=True)),
                ('father_mobile', models.CharField(max_length=15)),
                ('mother_mobile', models.CharField(blank=True, max_length=15)),
                ('session', models.CharField(max_length=20)),
                ('class_id', models.IntegerField()),
                ('class_name', models.CharField(max_length=50)),
                ('type', models.CharField(default='new', max_length=10)),
                ('source_of_information', models.CharField(choices=[('walk_in', 'Walk In'), ('phone', 'Phone'), ('website', 'Website'), ('reference', 'Reference'), ('advertisement', 'Advertisement'), ('social_media', 'Social Media'), ('other', 'Other')], max_length=50)),
                ('status', models.CharField(choices=[('enquiry', 'Enquiry'), ('contacted', 'Contacted'), ('visited', 'Visited'), ('admitted', 'Admitted'), ('rejected', 'Rejected')], default='enquiry', max_length=20)),
                ('remarks', models.TextField(blank=True)),
                ('query_date', models.DateTimeField(auto_now_add=True)),
                ('follow_up_date', models.DateField(blank=True, null=True)),
                ('created_by', models.IntegerField(blank=True, null=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'admission_queries',
                'ordering': ['-query_date'],
            },
        ),
    ]

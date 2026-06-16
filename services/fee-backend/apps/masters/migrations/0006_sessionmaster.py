# Generated manually for simplified SessionMaster

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('masters', '0005_student'),
    ]

    operations = [
        migrations.CreateModel(
            name='SessionMaster',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('session_year', models.CharField(max_length=20, unique=True)),
                ('status', models.BooleanField(default=True, help_text='1=Active, 0=Inactive')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'session_master',
                'ordering': ['-session_year'],
            },
        ),
    ]

from django.db import migrations, models


def seed_attendance_statuses(apps, schema_editor):
    AttendanceMaster = apps.get_model('masters', 'AttendanceMaster')
    for name in ['Present', 'Absent', 'Leave']:
        AttendanceMaster.objects.get_or_create(status_name=name)


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('masters', '0010_categorymaster_religionmaster_castemaster'),
    ]

    operations = [
        migrations.CreateModel(
            name='AttendanceMaster',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status_name', models.CharField(max_length=30, unique=True, verbose_name='Status Name')),
                ('status', models.BooleanField(default=True, help_text='1=Active, 0=Inactive')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'attendance_master',
                'ordering': ['status_name'],
            },
        ),
        migrations.RunPython(seed_attendance_statuses, noop),
    ]

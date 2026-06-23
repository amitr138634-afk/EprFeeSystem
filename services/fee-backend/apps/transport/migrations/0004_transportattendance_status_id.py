from django.db import migrations, models


def backfill_status_id(apps, schema_editor):
    TransportAttendance = apps.get_model('transport', 'TransportAttendance')
    AttendanceMaster = apps.get_model('masters', 'AttendanceMaster')

    present, _ = AttendanceMaster.objects.get_or_create(status_name='Present')
    name_to_id = {a.status_name.lower(): a.id for a in AttendanceMaster.objects.all()}

    for row in TransportAttendance.objects.all():
        row.status_id = name_to_id.get((row.status or '').lower(), present.id)
        row.save(update_fields=['status_id'])


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('transport', '0003_transportattendance_status_open_ended'),
        ('masters', '0011_attendancemaster'),
    ]

    operations = [
        migrations.AddField(
            model_name='transportattendance',
            name='status_id',
            field=models.IntegerField(null=True),
        ),
        migrations.RunPython(backfill_status_id, noop),
        migrations.RemoveField(
            model_name='transportattendance',
            name='status',
        ),
        migrations.AlterField(
            model_name='transportattendance',
            name='status_id',
            field=models.IntegerField(),
        ),
    ]

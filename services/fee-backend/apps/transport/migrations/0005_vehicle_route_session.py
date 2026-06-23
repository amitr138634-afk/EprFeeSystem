from django.db import migrations, models


def backfill_session(apps, schema_editor):
    Vehicle = apps.get_model('transport', 'Vehicle')
    Route = apps.get_model('transport', 'Route')
    SessionMaster = apps.get_model('masters', 'SessionMaster')

    # All existing rows pre-date session-scoping — assign them to whichever
    # session the school is actively using (matches the existing
    # StudentTransport test data, session='2026-2027').
    active = SessionMaster.objects.filter(status=True).order_by('-session_year').first()
    session_year = active.session_year if active else ''

    Vehicle.objects.update(session=session_year)
    Route.objects.update(session=session_year)


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('transport', '0004_transportattendance_status_id'),
        ('masters', '0012_certificatemaster_studentcertificate'),
    ]

    operations = [
        migrations.AddField(
            model_name='vehicle',
            name='session',
            field=models.CharField(blank=True, max_length=20),
        ),
        migrations.AddField(
            model_name='route',
            name='session',
            field=models.CharField(blank=True, max_length=20),
        ),
        migrations.RunPython(backfill_session, noop),
        migrations.AlterField(
            model_name='vehicle',
            name='bus_no',
            field=models.CharField(max_length=20),
        ),
        migrations.AlterField(
            model_name='vehicle',
            name='registration_no',
            field=models.CharField(max_length=20),
        ),
        migrations.AlterField(
            model_name='route',
            name='code',
            field=models.CharField(max_length=20),
        ),
        migrations.AlterUniqueTogether(
            name='vehicle',
            unique_together={('bus_no', 'session'), ('registration_no', 'session')},
        ),
        migrations.AlterUniqueTogether(
            name='route',
            unique_together={('code', 'session')},
        ),
    ]

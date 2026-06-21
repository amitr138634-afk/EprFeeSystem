from django.db import migrations, models


class Migration(migrations.Migration):
    """Drop the hardcoded '2024-25' default on FeeHead.session.

    The active session is now injected at write time by SessionScopedMixin, so a
    static default is no longer appropriate. CharField defaults are applied at the
    application layer (not the DB), so this is a state-only change with no SQL.
    """

    dependencies = [
        ('fees', '0006_admissionquery_adm_status_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='feehead',
            name='session',
            field=models.CharField(blank=True, max_length=20),
        ),
    ]

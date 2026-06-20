from django.db import migrations, models


class Migration(migrations.Migration):
    """Add the REGULAR choice to FeePaid.type for normal fee payments
    (alongside EXTRA for registration fee). Choices aren't enforced at the
    DB level, so this is a state-only change with no SQL."""

    dependencies = [
        ('fees', '0008_feepaid'),
    ]

    operations = [
        migrations.AlterField(
            model_name='feepaid',
            name='type',
            field=models.CharField(choices=[('EXTRA', 'Extra/Registration'), ('REGULAR', 'Regular Fee')], default='EXTRA', max_length=20),
        ),
    ]

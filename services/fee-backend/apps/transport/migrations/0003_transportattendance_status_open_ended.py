from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('transport', '0002_transportattendance_rename_and_audit_fields'),
    ]

    operations = [
        migrations.AlterField(
            model_name='transportattendance',
            name='status',
            field=models.CharField(default='Present', max_length=30),
        ),
    ]

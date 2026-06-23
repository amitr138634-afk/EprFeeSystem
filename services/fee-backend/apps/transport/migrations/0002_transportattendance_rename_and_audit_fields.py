from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('transport', '0001_initial'),
    ]

    operations = [
        migrations.AlterModelTable(
            name='transportattendance',
            table='student_transport_attendance',
        ),
        migrations.AddField(
            model_name='transportattendance',
            name='student_name',
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name='transportattendance',
            name='marked_by',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='transportattendance',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, default='2026-01-01T00:00:00'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='transportattendance',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
    ]

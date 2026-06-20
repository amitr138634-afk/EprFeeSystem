from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('masters', '0006_sessionmaster'),
    ]

    operations = [
        migrations.AddField(
            model_name='student',
            name='roll_no',
            field=models.CharField(blank=True, max_length=20, default=''),
        ),
        migrations.AddField(
            model_name='student',
            name='photo',
            field=models.ImageField(blank=True, null=True, upload_to='student_photos/'),
        ),
    ]

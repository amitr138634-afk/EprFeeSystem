from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('fees', '0010_studentfeedetail_heads_and_discount'),
    ]

    operations = [
        migrations.AddField(
            model_name='feepaid',
            name='remarks',
            field=models.CharField(blank=True, default='', max_length=255),
        ),
    ]

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('fees', '0011_feepaid_remarks'),
    ]

    operations = [
        migrations.AddField(model_name='studentfeedetail', name='tp_apr', field=models.DecimalField(decimal_places=2, default=0, max_digits=10)),
        migrations.AddField(model_name='studentfeedetail', name='tp_may', field=models.DecimalField(decimal_places=2, default=0, max_digits=10)),
        migrations.AddField(model_name='studentfeedetail', name='tp_jun', field=models.DecimalField(decimal_places=2, default=0, max_digits=10)),
        migrations.AddField(model_name='studentfeedetail', name='tp_jul', field=models.DecimalField(decimal_places=2, default=0, max_digits=10)),
        migrations.AddField(model_name='studentfeedetail', name='tp_aug', field=models.DecimalField(decimal_places=2, default=0, max_digits=10)),
        migrations.AddField(model_name='studentfeedetail', name='tp_sep', field=models.DecimalField(decimal_places=2, default=0, max_digits=10)),
        migrations.AddField(model_name='studentfeedetail', name='tp_oct', field=models.DecimalField(decimal_places=2, default=0, max_digits=10)),
        migrations.AddField(model_name='studentfeedetail', name='tp_nov', field=models.DecimalField(decimal_places=2, default=0, max_digits=10)),
        migrations.AddField(model_name='studentfeedetail', name='tp_dec', field=models.DecimalField(decimal_places=2, default=0, max_digits=10)),
        migrations.AddField(model_name='studentfeedetail', name='tp_jan', field=models.DecimalField(decimal_places=2, default=0, max_digits=10)),
        migrations.AddField(model_name='studentfeedetail', name='tp_feb', field=models.DecimalField(decimal_places=2, default=0, max_digits=10)),
        migrations.AddField(model_name='studentfeedetail', name='tp_mar', field=models.DecimalField(decimal_places=2, default=0, max_digits=10)),

        migrations.AddField(model_name='feepaid', name='transport_amount', field=models.DecimalField(decimal_places=2, max_digits=10, null=True, blank=True)),

        migrations.RenameField(model_name='studentfeeheadmonthdiscount', old_name='student_id', new_name='stu_id'),
        migrations.AddField(model_name='studentfeeheadmonthdiscount', name='actual_amount', field=models.DecimalField(decimal_places=2, default=0, max_digits=10)),
        migrations.AlterUniqueTogether(
            name='studentfeeheadmonthdiscount',
            unique_together={('stu_id', 'head_number', 'month', 'session')},
        ),
    ]

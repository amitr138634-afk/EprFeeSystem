from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('students', '0005_alter_classsectionmaster_options'),
        ('academics', '0009_remark_section_ids_delete_remarksection'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='signaturemaster',
            name='title',
        ),
        migrations.RemoveField(
            model_name='signaturemaster',
            name='signature',
        ),
        migrations.AddField(
            model_name='signaturemaster',
            name='designation',
            field=models.CharField(
                max_length=20,
                choices=[
                    ('principal', 'Principal'),
                    ('examination_ic', 'Examination IC'),
                    ('class_teacher', 'Class Teacher'),
                ],
                default='principal',
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='signaturemaster',
            name='class_ref',
            field=models.ForeignKey(
                null=True, blank=True, on_delete=django.db.models.deletion.CASCADE,
                related_name='signatures', to='students.classmaster',
            ),
        ),
        migrations.AddField(
            model_name='signaturemaster',
            name='section',
            field=models.ForeignKey(
                null=True, blank=True, on_delete=django.db.models.deletion.CASCADE,
                related_name='signatures', to='students.classsectionmaster',
            ),
        ),
        migrations.AddField(
            model_name='signaturemaster',
            name='original_image',
            field=models.ImageField(default='', upload_to='signatures/original/'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='signaturemaster',
            name='processed_image',
            field=models.ImageField(null=True, blank=True, upload_to='signatures/processed/'),
        ),
        migrations.AddField(
            model_name='signaturemaster',
            name='session',
            field=models.CharField(max_length=10, default=''),
            preserve_default=False,
        ),
        migrations.AddConstraint(
            model_name='signaturemaster',
            constraint=models.UniqueConstraint(
                fields=['designation', 'session'],
                condition=models.Q(designation__in=['principal', 'examination_ic']),
                name='unique_singleton_signature_per_session',
            ),
        ),
        migrations.AddConstraint(
            model_name='signaturemaster',
            constraint=models.UniqueConstraint(
                fields=['designation', 'class_ref', 'section', 'session'],
                condition=models.Q(designation='class_teacher'),
                name='unique_class_teacher_signature_per_session',
            ),
        ),
    ]

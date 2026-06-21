import django.db.models.deletion
from django.db import migrations, models


def backfill_section_master(apps, schema_editor):
    """For each existing ClassSectionMaster row, find or create a matching
    SectionMaster row (by exact text) and link it via the new FK."""
    ClassSectionMaster = apps.get_model('masters', 'ClassSectionMaster')
    SectionMaster = apps.get_model('masters', 'SectionMaster')
    for row in ClassSectionMaster.objects.all():
        section, _ = SectionMaster.objects.get_or_create(section=row.section_name)
        row.section_master_id = section.id
        row.save(update_fields=['section_master'])


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('masters', '0007_student_roll_no_photo'),
    ]

    operations = [
        migrations.AddField(
            model_name='classsectionmaster',
            name='section_master',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='class_sections', to='masters.sectionmaster'),
        ),
        migrations.RunPython(backfill_section_master, noop),
        # The unique_together declared in 0004 doesn't actually exist as a
        # constraint in this database (pre-existing drift) — drop it from
        # Django's migration *state* only, without attempting a real SQL
        # DROP CONSTRAINT that would fail to find it.
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AlterUniqueTogether(name='classsectionmaster', unique_together=set()),
            ],
            database_operations=[],
        ),
        migrations.RemoveField(
            model_name='classsectionmaster',
            name='section_name',
        ),
        migrations.AlterField(
            model_name='classsectionmaster',
            name='section_master',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='class_sections', to='masters.sectionmaster'),
        ),
        migrations.AlterUniqueTogether(
            name='classsectionmaster',
            unique_together={('class_master', 'section_master', 'session')},
        ),
    ]

# Generated migration file

from django.db import migrations, models


def set_default_adm_status(apps, schema_editor):
    """Set adm_status='enquiry' for all existing admission queries"""
    # Use raw SQL to update since column might not exist yet
    from django.db import connection
    with connection.cursor() as cursor:
        try:
            cursor.execute("UPDATE admission_queries SET adm_status = 'enquiry' WHERE adm_status IS NULL OR adm_status = '';")
        except:
            pass  # Column might not exist yet


class Migration(migrations.Migration):

    dependencies = [
        ('fees', '0004_registrationfeepaid_alter_admissionquery_status'),
    ]

    operations = [
        # First, add the column with NULL allowed
        migrations.RunSQL(
            sql="ALTER TABLE admission_queries ADD COLUMN IF NOT EXISTS adm_status VARCHAR(20) DEFAULT 'enquiry';",
            reverse_sql="ALTER TABLE admission_queries DROP COLUMN IF EXISTS adm_status;"
        ),
        # Then set default for existing rows
        migrations.RunPython(set_default_adm_status, migrations.RunPython.noop),
    ]

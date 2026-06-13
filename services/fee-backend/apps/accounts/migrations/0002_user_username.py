# Mirrors admin-backend's accounts.0002_user_username. Both services share the
# central `school_erp_central` DB (and its django_migrations history), so the
# `username` column already exists; this keeps fee-backend's migration state in
# sync without re-running the column add.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='username',
            field=models.CharField(blank=True, max_length=50, null=True, unique=True),
        ),
    ]

#!/usr/bin/env python
"""Migrate fee-backend across all tenant databases.

fee-backend has no School model, so the list of schools is read via raw SQL
from the shared central DB (school_erp_central). The fee-backend apps
(fees, masters, transport, frontdesk, ...) are routed to the tenant DBs by
utils/db_router.py, so a plain `migrate --database <tenant>` applies them.

Usage:
    services/fee-backend/venv/bin/python scripts/python/migrate_all_fee_tenants.py
"""
import os
import sys
import django
from pathlib import Path

project_root = Path(__file__).resolve().parent.parent.parent / 'services' / 'fee-backend'
sys.path.insert(0, str(project_root))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.core.management import call_command
from django.db import connection, connections
from django.conf import settings


def get_schools():
    """Read (id, db_name) for every school from the central DB."""
    with connection.cursor() as cursor:
        cursor.execute("SELECT id, db_name FROM schools ORDER BY id")
        return cursor.fetchall()


def migrate_tenant_db(db_name):
    """Migrate a single tenant database."""
    if db_name not in settings.DATABASES:
        # Copy all settings from default so host/user/pass/options match.
        settings.DATABASES[db_name] = settings.DATABASES['default'].copy()
        settings.DATABASES[db_name]['NAME'] = db_name

    print(f"\n{'='*60}")
    print(f"Migrating: {db_name}")
    print(f"{'='*60}")

    try:
        conn = connections[db_name]
        conn.ensure_connection()
        print(f"✓ Connected to {db_name}")

        call_command('migrate', database=db_name, interactive=False, verbosity=1)

        print(f"✓ Successfully migrated {db_name}\n")
        return True
    except Exception:
        import traceback
        print(f"✗ Error migrating {db_name}:")
        print(traceback.format_exc())
        return False


def main():
    print("\n" + "=" * 60)
    print("FEE-BACKEND TENANT DATABASE MIGRATION")
    print("=" * 60)

    schools = get_schools()
    if not schools:
        print("\n✗ No schools found in central DB!")
        return

    print(f"\nFound {len(schools)} school(s):\n")

    success_count = 0
    failed_count = 0

    for school_id, db_name in schools:
        print(f"School id={school_id}  Database: {db_name}")
        if migrate_tenant_db(db_name):
            success_count += 1
        else:
            failed_count += 1

    print("\n" + "=" * 60)
    print("MIGRATION SUMMARY")
    print("=" * 60)
    print(f"✓ Successful: {success_count}")
    print(f"✗ Failed: {failed_count}")
    print(f"Total: {len(schools)}")
    print("=" * 60 + "\n")


if __name__ == '__main__':
    main()

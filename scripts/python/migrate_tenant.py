#!/usr/bin/env python
"""
Migrate a specific tenant database
Usage: python scripts/python/migrate_tenant.py <db_name>
Example: python scripts/python/migrate_tenant.py school_erp_232323
"""
import os
import sys
import django
from pathlib import Path

# Add project root to path
project_root = Path(__file__).resolve().parent.parent.parent / 'services' / 'admin-backend'
sys.path.insert(0, str(project_root))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.core.management import call_command
from django.db import connections
from django.conf import settings

def migrate_tenant(db_name):
    """Run migrations on a tenant database"""
    
    # Add tenant DB to Django connections dynamically
    if db_name not in settings.DATABASES:
        # Copy all settings from default DB and override NAME
        settings.DATABASES[db_name] = settings.DATABASES['default'].copy()
        settings.DATABASES[db_name]['NAME'] = db_name
    
    print(f"Running migrations on {db_name}...")
    
    try:
        # Test connection
        conn = connections[db_name]
        conn.ensure_connection()
        print(f"Connected to {db_name}")

        # Run migrations
        call_command('migrate', '--database', db_name, verbosity=2)
        print(f"Migrations completed for {db_name}")

    except Exception as e:
        print(f"Error migrating {db_name}: {e}")
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python migrate_tenant.py <db_name>")
        print("Example: python migrate_tenant.py school_erp_232323")
        sys.exit(1)
    
    db_name = sys.argv[1]
    migrate_tenant(db_name)

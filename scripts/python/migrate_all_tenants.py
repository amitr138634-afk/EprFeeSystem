#!/usr/bin/env python
"""Migrate all tenant databases"""
import os
import sys
import django
from pathlib import Path

project_root = Path(__file__).resolve().parent.parent.parent / 'services' / 'admin-backend'
sys.path.insert(0, str(project_root))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.core.management import call_command
from django.db import connection, connections
from django.conf import settings
from apps.schools.models import School

def migrate_tenant_db(db_name):
    """Migrate a single tenant database"""
    
    # Dynamically add database config
    if db_name not in settings.DATABASES:
        # Copy all settings from default to ensure compatibility
        default_db = settings.DATABASES['default'].copy()
        default_db['NAME'] = db_name
        settings.DATABASES[db_name] = default_db
    
    print(f"\n{'='*60}")
    print(f"Migrating: {db_name}")
    print(f"{'='*60}")
    
    try:
        # Force Django to recognize this connection
        conn = connections[db_name]
        conn.ensure_connection()
        print(f"✓ Connected to {db_name}")
        
        # Run migrations
        call_command('migrate', database=db_name, interactive=False, verbosity=1)
        
        print(f"✓ Successfully migrated {db_name}\n")
        return True
        
    except Exception as e:
        import traceback
        print(f"✗ Error migrating {db_name}:")
        print(traceback.format_exc())
        return False

def main():
    print("\n" + "="*60)
    print("TENANT DATABASE MIGRATION")
    print("="*60)
    
    # Get all schools
    schools = School.objects.all()
    
    if not schools.exists():
        print("\n✗ No schools found in database!")
        return
    
    print(f"\nFound {schools.count()} school(s):\n")
    
    success_count = 0
    failed_count = 0
    
    for school in schools:
        print(f"School: {school.name} (Code: {school.code})")
        print(f"Database: {school.db_name}")
        
        if migrate_tenant_db(school.db_name):
            success_count += 1
        else:
            failed_count += 1
    
    print("\n" + "="*60)
    print("MIGRATION SUMMARY")
    print("="*60)
    print(f"✓ Successful: {success_count}")
    print(f"✗ Failed: {failed_count}")
    print(f"Total: {schools.count()}")
    print("="*60 + "\n")

if __name__ == '__main__':
    main()

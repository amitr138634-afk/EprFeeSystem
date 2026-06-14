#!/usr/bin/env python
"""
Migrate fee-backend on a specific tenant database
Usage: python scripts/python/migrate_fee_backend_tenant.py <school_code>
Example: python scripts/python/migrate_fee_backend_tenant.py 232323
"""
import os
import sys
import django
from pathlib import Path

# Add fee-backend project root to path
project_root = Path(__file__).resolve().parent.parent.parent / 'services' / 'fee-backend'
sys.path.insert(0, str(project_root))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.core.management import call_command
from django.db import connections
from django.conf import settings

def migrate_tenant(school_code):
    """Run fee-backend migrations on a tenant database"""
    
    db_name = f'school_erp_{school_code}'
    
    # Add tenant DB to Django connections dynamically
    if db_name not in settings.DATABASES:
        # Copy all settings from default DB and override NAME
        settings.DATABASES[db_name] = settings.DATABASES['default'].copy()
        settings.DATABASES[db_name]['NAME'] = db_name
    
    print("\n" + "="*70)
    print(f"MIGRATING FEE-BACKEND ON TENANT: {db_name}")
    print("="*70)
    
    try:
        # Test connection
        conn = connections[db_name]
        conn.ensure_connection()
        print(f"✓ Connected to {db_name}")
        
        # Run migrations
        print(f"\nRunning migrations for fee-backend apps...")
        print("="*70)
        call_command('migrate', '--database', db_name, verbosity=2)
        
        print("\n" + "="*70)
        print(f"✓ MIGRATIONS COMPLETED FOR {db_name}")
        print("="*70 + "\n")
        
    except Exception as e:
        print("\n" + "="*70)
        print(f"✗ ERROR MIGRATING {db_name}: {e}")
        print("="*70 + "\n")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("\nUsage: python migrate_fee_backend_tenant.py <school_code>")
        print("Example: python migrate_fee_backend_tenant.py 232323\n")
        sys.exit(1)
    
    school_code = sys.argv[1]
    migrate_tenant(school_code)

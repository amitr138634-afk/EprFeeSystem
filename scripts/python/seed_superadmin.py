"""
Create a Super-Admin user in the central database.

Credentials come from the admin-backend `.env` (read via python-decouple, the
same loader the Django settings use), with optional CLI flags overriding them
and hard-coded fallbacks if neither is set:

    SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD, SUPERADMIN_FIRST_NAME, SUPERADMIN_LAST_NAME

Run from anywhere (uses the admin-backend venv):

    services/admin-backend/.venv/bin/python scripts/python/seed_superadmin.py

    # or override a value explicitly:
    services/admin-backend/.venv/bin/python scripts/python/seed_superadmin.py \
        --email admin@example.com --password 'S3cret!'

The script is idempotent: if the user already exists it just updates the
password / names / role so you can never end up locked out.
"""
import os
import sys
import argparse
import django


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--email')
    parser.add_argument('--password')
    parser.add_argument('--first-name')
    parser.add_argument('--last-name')
    args = parser.parse_args()

    # Allow being run from anywhere — locate services/admin-backend on PYTHONPATH
    here = os.path.dirname(os.path.abspath(__file__))
    admin_backend = os.path.abspath(os.path.join(here, '..', '..', 'services', 'admin-backend'))
    sys.path.insert(0, admin_backend)
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
    django.setup()

    # `config` is already bound to admin-backend/.env by the settings import above.
    from decouple import config

    email      = args.email      or config('SUPERADMIN_EMAIL',      default='superadmin@erp.com')
    password   = args.password   or config('SUPERADMIN_PASSWORD',   default='Admin@123')
    first_name = args.first_name or config('SUPERADMIN_FIRST_NAME', default='Super')
    last_name  = args.last_name  or config('SUPERADMIN_LAST_NAME',  default='Admin')

    from apps.accounts.models import User

    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            'first_name': first_name,
            'last_name':  last_name,
            'role':       'super_admin',
            'is_active':  True,
            'is_staff':   True,
            'is_superuser': True,
        },
    )
    user.first_name = first_name
    user.last_name  = last_name
    user.role       = 'super_admin'
    user.is_active  = True
    user.is_staff   = True
    user.is_superuser = True
    user.set_password(password)
    user.save()

    action = 'Created' if created else 'Updated'
    print(f'{action} super admin: {user.email}  /  {password}')


if __name__ == '__main__':
    main()

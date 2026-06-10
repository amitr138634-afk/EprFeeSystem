"""
Create a Super-Admin user in the central database.

Run from the services/admin-backend directory after `python manage.py migrate`:

    python ../../scripts/python/seed_superadmin.py \
        --email superadmin@erp.com \
        --password Admin@123 \
        --first-name Super --last-name Admin

The script is idempotent: if the user already exists it just updates the
password / names / role so you can never end up locked out.
"""
import os
import sys
import argparse
import django


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--email',      default='superadmin@erp.com')
    parser.add_argument('--password',   default='Admin@123')
    parser.add_argument('--first-name', default='Super')
    parser.add_argument('--last-name',  default='Admin')
    args = parser.parse_args()

    # Allow being run from anywhere — locate services/admin-backend on PYTHONPATH
    here = os.path.dirname(os.path.abspath(__file__))
    admin_backend = os.path.abspath(os.path.join(here, '..', '..', 'services', 'admin-backend'))
    sys.path.insert(0, admin_backend)
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
    django.setup()

    from apps.accounts.models import User

    user, created = User.objects.get_or_create(
        email=args.email,
        defaults={
            'first_name': args.first_name,
            'last_name':  args.last_name,
            'role':       'super_admin',
            'is_active':  True,
            'is_staff':   True,
            'is_superuser': True,
        },
    )
    user.first_name = args.first_name
    user.last_name  = args.last_name
    user.role       = 'super_admin'
    user.is_active  = True
    user.is_staff   = True
    user.is_superuser = True
    user.set_password(args.password)
    user.save()

    action = 'Created' if created else 'Updated'
    print(f'{action} super admin: {user.email}  /  {args.password}')


if __name__ == '__main__':
    main()

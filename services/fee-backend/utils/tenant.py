import threading
from django.conf import settings
from django.db import connections

_thread_local = threading.local()


def get_current_tenant():
    return getattr(_thread_local, 'tenant_db', 'default')


def set_current_tenant(db_alias):
    _thread_local.tenant_db = db_alias


def clear_current_tenant():
    if hasattr(_thread_local, 'tenant_db'):
        del _thread_local.tenant_db


def get_school_db_alias(school_id):
    return f'school_{school_id}'


def register_school_database(school_id, db_name=None):
    """Dynamically register a school's database in Django's DATABASES setting."""
    alias = get_school_db_alias(school_id)
    if alias not in settings.DATABASES:
        settings.DATABASES[alias] = {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': db_name or f'school_erp_{school_id}',
            'USER': settings.DATABASES['default']['USER'],
            'PASSWORD': settings.DATABASES['default']['PASSWORD'],
            'HOST': settings.DATABASES['default']['HOST'],
            'PORT': settings.DATABASES['default']['PORT'],
        }
    return alias


class TenantMiddleware:
    """Extracts school_id from JWT token and sets the tenant database context."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        clear_current_tenant()

        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if auth_header.startswith('Bearer '):
            try:
                from rest_framework_simplejwt.tokens import AccessToken
                token = AccessToken(auth_header.split(' ')[1])
                school_id = token.get('school_id')
                if school_id:
                    alias = get_school_db_alias(school_id)
                    if alias not in settings.DATABASES:
                        register_school_database(school_id)
                    set_current_tenant(alias)
            except Exception:
                pass

        response = self.get_response(request)
        clear_current_tenant()
        return response

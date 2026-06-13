from utils.tenant import get_current_tenant

# Only these apps should use central DB
# All other apps (fees, masters, transport, students, frontdesk) use tenant DB
CENTRAL_APPS = {
    'accounts', 'schools', 'admin', 'auth', 'contenttypes', 'sessions',
    'token_blacklist',
}


class TenantDatabaseRouter:
    """
    Routes queries to tenant-specific database based on app label and current tenant context.
    Central apps (accounts, schools) always use default DB.
    Tenant apps use the current tenant's database.
    """

    def db_for_read(self, model, **hints):
        if model._meta.app_label in CENTRAL_APPS:
            return 'default'
        tenant = get_current_tenant()
        return tenant if tenant != 'default' else 'default'

    def db_for_write(self, model, **hints):
        if model._meta.app_label in CENTRAL_APPS:
            return 'default'
        tenant = get_current_tenant()
        return tenant if tenant != 'default' else 'default'

    def allow_relation(self, obj1, obj2, **hints):
        return True

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        if db == 'default':
            return app_label in CENTRAL_APPS
        return app_label not in CENTRAL_APPS

"""Active academic-session context.

The selected session is carried inside the JWT (claims ``session_id`` and
``current_session``) and re-issued whenever the user switches sessions. This
module exposes the active session globally (thread-local) so every view, query
and report can scope itself to it without passing a query param around.

Mirrors the pattern in ``utils/tenant.py``.
"""
import threading

_thread_local = threading.local()


def get_current_session():
    """Return the active session as ``{'id', 'session_year'}`` or ``None``."""
    return getattr(_thread_local, 'session', None)


def set_current_session(session_id, session_year):
    _thread_local.session = {'id': session_id, 'session_year': session_year}


def clear_current_session():
    if hasattr(_thread_local, 'session'):
        del _thread_local.session


def current_session_year():
    """Active ``session_year`` string (e.g. ``'2024-2025'``) or ``None``."""
    session = get_current_session()
    return session['session_year'] if session else None


def current_session_id():
    session = get_current_session()
    return session['id'] if session else None


class ActiveSessionMiddleware:
    """Reads the active session from the JWT and sets the thread-local context."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        clear_current_session()

        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if auth_header.startswith('Bearer '):
            try:
                from rest_framework_simplejwt.tokens import AccessToken
                token = AccessToken(auth_header.split(' ')[1])
                session_id = token.get('session_id')
                session_year = token.get('current_session')
                if session_year:
                    set_current_session(session_id, session_year)
            except Exception:
                pass

        response = self.get_response(request)
        clear_current_session()
        return response


# Candidate session column names, in priority order. The active session_year
# string is written to / filtered against whichever the model actually has.
SESSION_FIELD_CANDIDATES = ('session_year', 'session')


def resolve_session_field(model, override=None):
    """Return the model's session column name, or ``None`` if it has none /
    must not be auto-scoped (the session_master table itself)."""
    if getattr(model._meta, 'db_table', '') == 'session_master':
        return None
    if override:
        return override
    field_names = {f.name for f in model._meta.get_fields()}
    for candidate in SESSION_FIELD_CANDIDATES:
        if candidate in field_names:
            return candidate
    return None


class SessionScopedMixin:
    """DRF mixin: auto-filter list/detail querysets by the active session and
    inject it on create.

    The session column is auto-detected (``session_year`` then ``session``);
    set ``session_field`` to force a specific column. Views whose model has no
    session column — and the ``session_master`` table itself — are left
    untouched. Set ``session_scope_create = False`` to skip auto-injection on
    create.
    """
    session_field = None
    session_scope_create = True

    def get_queryset(self):
        qs = super().get_queryset()
        session_year = current_session_year()
        if session_year:
            field = resolve_session_field(qs.model, self.session_field)
            if field:
                qs = qs.filter(**{field: session_year})
        return qs

    def perform_create(self, serializer):
        session_year = current_session_year()
        field = None
        if self.session_scope_create and session_year:
            # Works for both single and many=True (ListSerializer) serializers.
            meta = getattr(getattr(serializer, 'child', serializer), 'Meta', None)
            model = getattr(meta, 'model', None)
            if model is not None:
                field = resolve_session_field(model, self.session_field)
        if field:
            serializer.save(**{field: session_year})
        else:
            serializer.save()

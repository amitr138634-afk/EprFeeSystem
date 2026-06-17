import copy
from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.conf import settings
from .models import SessionMaster
from .serializers import SessionMasterSerializer
from utils.permissions import IsSchoolAdmin


class SessionMasterListCreateView(generics.ListCreateAPIView):
    """List all sessions and create new session"""
    serializer_class = SessionMasterSerializer
    
    def get_permissions(self):
        # Allow unauthenticated access for GET (login page dropdown)
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsSchoolAdmin()]
    
    def get_queryset(self):
        # For authenticated users, use tenant context from JWT
        if self.request.user.is_authenticated:
            return SessionMaster.objects.all().order_by('-session_year')
        
        # For unauthenticated (login page), get school_code from query param
        school_code = self.request.query_params.get('school_code')
        if not school_code:
            return SessionMaster.objects.none()  # Return empty if no school_code provided
        
        # Dynamically register the tenant DB if not already known. Copy the full
        # default config (OPTIONS, ATOMIC_REQUESTS, …) and just override NAME — a
        # partial dict crashes Django's connection setup (e.g. KeyError 'OPTIONS').
        db_name = f'school_erp_{school_code}'
        if db_name not in settings.DATABASES:
            cfg = copy.deepcopy(settings.DATABASES['default'])
            cfg['NAME'] = db_name
            settings.DATABASES[db_name] = cfg

        try:
            # Force evaluation here so a missing DB/table is caught (not during
            # serialization, which would escape this handler as a 500).
            return list(SessionMaster.objects.using(db_name).all().order_by('-session_year'))
        except Exception:
            return SessionMaster.objects.none()


class SessionMasterDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or delete a session"""
    serializer_class = SessionMasterSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = SessionMaster.objects.all()

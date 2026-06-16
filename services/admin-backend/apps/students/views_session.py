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
        
        # Dynamically add tenant DB if not exists
        db_name = f'school_erp_{school_code}'
        if db_name not in settings.DATABASES:
            settings.DATABASES[db_name] = {
                'ENGINE': 'django.db.backends.postgresql',
                'NAME': db_name,
                'USER': settings.DATABASES['default']['USER'],
                'PASSWORD': settings.DATABASES['default']['PASSWORD'],
                'HOST': settings.DATABASES['default']['HOST'],
                'PORT': settings.DATABASES['default']['PORT'],
            }
        
        try:
            # Query from tenant database
            return SessionMaster.objects.using(db_name).all().order_by('-session_year')
        except Exception as e:
            # If tenant DB doesn't exist, return empty
            return SessionMaster.objects.none()


class SessionMasterDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or delete a session"""
    serializer_class = SessionMasterSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = SessionMaster.objects.all()

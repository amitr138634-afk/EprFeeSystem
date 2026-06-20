from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import ClassMaster, ClassSectionMaster, SectionMaster, SessionMaster
from .serializers import (
    ClassMasterSerializer, ClassSectionMasterSerializer, 
    SectionMasterSerializer, SessionMasterSerializer
)
from utils.permissions import IsSchoolAdmin
from utils.session import SessionScopedMixin


class ClassMasterListCreateView(SessionScopedMixin, generics.ListCreateAPIView):
    serializer_class = ClassMasterSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = ClassMaster.objects.all()


class ClassMasterDetailView(SessionScopedMixin, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ClassMasterSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = ClassMaster.objects.all()


class ClassMasterToggleStatusView(APIView):
    permission_classes = [IsSchoolAdmin]

    def post(self, request, pk):
        try:
            class_obj = ClassMaster.objects.get(pk=pk)
            class_obj.status = not class_obj.status
            class_obj.save()
            return Response({
                'id': class_obj.id,
                'status': class_obj.status,
                'message': f'Class {"activated" if class_obj.status else "deactivated"} successfully'
            })
        except ClassMaster.DoesNotExist:
            return Response({'detail': 'Class not found.'}, status=status.HTTP_404_NOT_FOUND)


# Independent Section Master Views
class SectionMasterListCreateView(generics.ListCreateAPIView):
    serializer_class = SectionMasterSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = SectionMaster.objects.all()


class SectionMasterDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SectionMasterSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = SectionMaster.objects.all()


class SectionMasterToggleStatusView(APIView):
    permission_classes = [IsSchoolAdmin]

    def post(self, request, pk):
        try:
            section_obj = SectionMaster.objects.get(pk=pk)
            section_obj.status = not section_obj.status
            section_obj.save()
            return Response({
                'id': section_obj.id,
                'status': section_obj.status,
                'message': f'Section {"activated" if section_obj.status else "deactivated"} successfully'
            })
        except SectionMaster.DoesNotExist:
            return Response({'detail': 'Section not found.'}, status=status.HTTP_404_NOT_FOUND)


# Class Section Master Views (with class relationship)
class ClassSectionMasterListCreateView(SessionScopedMixin, generics.ListCreateAPIView):
    serializer_class = ClassSectionMasterSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = ClassSectionMaster.objects.select_related('class_master', 'section_master')

    def get_queryset(self):
        qs = super().get_queryset()
        class_id = self.request.query_params.get('class_id')
        if class_id:
            qs = qs.filter(class_master_id=class_id)
        return qs


class ClassSectionMasterDetailView(SessionScopedMixin, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ClassSectionMasterSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = ClassSectionMaster.objects.all()


class ClassSectionMasterToggleStatusView(APIView):
    permission_classes = [IsSchoolAdmin]

    def post(self, request, pk):
        try:
            section_obj = ClassSectionMaster.objects.get(pk=pk)
            section_obj.status = not section_obj.status
            section_obj.save()
            return Response({
                'id': section_obj.id,
                'status': section_obj.status,
                'message': f'Section {"activated" if section_obj.status else "deactivated"} successfully'
            })
        except ClassSectionMaster.DoesNotExist:
            return Response({'detail': 'Section not found.'}, status=status.HTTP_404_NOT_FOUND)



# Session Master Views
class SessionMasterListCreateView(generics.ListCreateAPIView):
    """List all sessions and create new session"""
    serializer_class = SessionMasterSerializer
    
    def get_permissions(self):
        # Allow unauthenticated access for GET (login page dropdown)
        if self.request.method == 'GET':
            from rest_framework.permissions import AllowAny
            return [AllowAny()]
        return [IsSchoolAdmin()]
    
    def get_queryset(self):
        # Authenticated requests are routed to the active tenant DB by the router.
        if self.request.user.is_authenticated:
            return SessionMaster.objects.all().order_by('-session_year')

        # Unauthenticated (login-page dropdown). fee-backend is deployed
        # single-tenant — the 'default' DB (set in .env) IS this school's
        # tenant DB, so without a school_code we can just read from it
        # directly rather than looking up a central school registry that
        # doesn't exist in this deployment model. ?school_code= is still
        # honored for cross-tenant lookups (e.g. driven by admin-frontend).
        import copy
        from django.conf import settings
        school_code = self.request.query_params.get('school_code')
        if not school_code:
            try:
                return list(SessionMaster.objects.using('default').all().order_by('-session_year'))
            except Exception:
                return SessionMaster.objects.none()
        db_name = f'school_erp_{school_code}'
        if db_name not in settings.DATABASES:
            cfg = copy.deepcopy(settings.DATABASES['default'])
            cfg['NAME'] = db_name
            settings.DATABASES[db_name] = cfg
        try:
            return list(SessionMaster.objects.using(db_name).all().order_by('-session_year'))
        except Exception:
            return SessionMaster.objects.none()


class SessionMasterDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or delete a session"""
    serializer_class = SessionMasterSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = SessionMaster.objects.all()

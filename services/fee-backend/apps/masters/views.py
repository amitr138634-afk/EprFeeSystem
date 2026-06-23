from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import (
    ClassMaster, ClassSectionMaster, SectionMaster, SessionMaster,
    HouseMaster, BloodGroupMaster, SchoolMaster,
    CategoryMaster, ReligionMaster, CasteMaster, AttendanceMaster,
    CertificateMaster,
)
from .serializers import (
    ClassMasterSerializer, ClassSectionMasterSerializer,
    SectionMasterSerializer, SessionMasterSerializer,
    HouseMasterSerializer, BloodGroupMasterSerializer, SchoolMasterSerializer,
    CategoryMasterSerializer, ReligionMasterSerializer, CasteMasterSerializer,
    AttendanceMasterSerializer, CertificateMasterSerializer,
)
from utils.permissions import IsSchoolAdmin
from utils.session import SessionScopedMixin


class ClassMasterListCreateView(SessionScopedMixin, generics.ListCreateAPIView):
    serializer_class = ClassMasterSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = ClassMaster.objects.all()

    def get_queryset(self):
        # Opt-out of the usual current-session-only filtering — used by
        # Promote Student, where the source/target class pickers need to
        # see every class ever defined, not just the active session's.
        if self.request.query_params.get('all_sessions'):
            return ClassMaster.objects.all().order_by('class_name')
        return super().get_queryset()


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


class HouseMasterListCreateView(generics.ListCreateAPIView):
    serializer_class = HouseMasterSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = HouseMaster.objects.all()


class HouseMasterDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = HouseMasterSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = HouseMaster.objects.all()


class HouseMasterToggleStatusView(APIView):
    permission_classes = [IsSchoolAdmin]

    def post(self, request, pk):
        try:
            house = HouseMaster.objects.get(pk=pk)
            house.status = not house.status
            house.save()
            return Response({
                'id': house.id,
                'status': house.status,
                'message': f'House {"activated" if house.status else "deactivated"} successfully'
            })
        except HouseMaster.DoesNotExist:
            return Response({'detail': 'House not found.'}, status=status.HTTP_404_NOT_FOUND)


class BloodGroupMasterListCreateView(generics.ListCreateAPIView):
    serializer_class = BloodGroupMasterSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = BloodGroupMaster.objects.all()


class BloodGroupMasterDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BloodGroupMasterSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = BloodGroupMaster.objects.all()


class BloodGroupMasterToggleStatusView(APIView):
    permission_classes = [IsSchoolAdmin]

    def post(self, request, pk):
        try:
            blood_group = BloodGroupMaster.objects.get(pk=pk)
            blood_group.status = not blood_group.status
            blood_group.save()
            return Response({
                'id': blood_group.id,
                'status': blood_group.status,
                'message': f'Blood group {"activated" if blood_group.status else "deactivated"} successfully'
            })
        except BloodGroupMaster.DoesNotExist:
            return Response({'detail': 'Blood group not found.'}, status=status.HTTP_404_NOT_FOUND)


class SchoolMasterView(APIView):
    """Singleton school info record (id=1) — GET returns it (creating an
    empty one on first access), PATCH updates it. Never listed/deleted."""
    permission_classes = [IsSchoolAdmin]

    def get(self, request):
        school, _ = SchoolMaster.objects.get_or_create(id=1)
        return Response(SchoolMasterSerializer(school, context={'request': request}).data)

    def patch(self, request):
        school, _ = SchoolMaster.objects.get_or_create(id=1)
        serializer = SchoolMasterSerializer(school, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class CategoryMasterListCreateView(generics.ListCreateAPIView):
    serializer_class = CategoryMasterSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = CategoryMaster.objects.all()


class CategoryMasterDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CategoryMasterSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = CategoryMaster.objects.all()


class CategoryMasterToggleStatusView(APIView):
    permission_classes = [IsSchoolAdmin]

    def post(self, request, pk):
        try:
            obj = CategoryMaster.objects.get(pk=pk)
            obj.status = not obj.status
            obj.save()
            return Response({
                'id': obj.id,
                'status': obj.status,
                'message': f'Category {"activated" if obj.status else "deactivated"} successfully'
            })
        except CategoryMaster.DoesNotExist:
            return Response({'detail': 'Category not found.'}, status=status.HTTP_404_NOT_FOUND)


class ReligionMasterListCreateView(generics.ListCreateAPIView):
    serializer_class = ReligionMasterSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = ReligionMaster.objects.all()


class ReligionMasterDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ReligionMasterSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = ReligionMaster.objects.all()


class ReligionMasterToggleStatusView(APIView):
    permission_classes = [IsSchoolAdmin]

    def post(self, request, pk):
        try:
            obj = ReligionMaster.objects.get(pk=pk)
            obj.status = not obj.status
            obj.save()
            return Response({
                'id': obj.id,
                'status': obj.status,
                'message': f'Religion {"activated" if obj.status else "deactivated"} successfully'
            })
        except ReligionMaster.DoesNotExist:
            return Response({'detail': 'Religion not found.'}, status=status.HTTP_404_NOT_FOUND)


class CasteMasterListCreateView(generics.ListCreateAPIView):
    serializer_class = CasteMasterSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = CasteMaster.objects.all()


class CasteMasterDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CasteMasterSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = CasteMaster.objects.all()


class CasteMasterToggleStatusView(APIView):
    permission_classes = [IsSchoolAdmin]

    def post(self, request, pk):
        try:
            obj = CasteMaster.objects.get(pk=pk)
            obj.status = not obj.status
            obj.save()
            return Response({
                'id': obj.id,
                'status': obj.status,
                'message': f'Caste {"activated" if obj.status else "deactivated"} successfully'
            })
        except CasteMaster.DoesNotExist:
            return Response({'detail': 'Caste not found.'}, status=status.HTTP_404_NOT_FOUND)


class AttendanceMasterListCreateView(generics.ListCreateAPIView):
    serializer_class = AttendanceMasterSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = AttendanceMaster.objects.all()


class AttendanceMasterDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AttendanceMasterSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = AttendanceMaster.objects.all()


class AttendanceMasterToggleStatusView(APIView):
    permission_classes = [IsSchoolAdmin]

    def post(self, request, pk):
        try:
            obj = AttendanceMaster.objects.get(pk=pk)
            obj.status = not obj.status
            obj.save()
            return Response({
                'id': obj.id,
                'status': obj.status,
                'message': f'Attendance status {"activated" if obj.status else "deactivated"} successfully'
            })
        except AttendanceMaster.DoesNotExist:
            return Response({'detail': 'Attendance status not found.'}, status=status.HTTP_404_NOT_FOUND)


class CertificateMasterListCreateView(generics.ListCreateAPIView):
    serializer_class = CertificateMasterSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = CertificateMaster.objects.all()


class CertificateMasterDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CertificateMasterSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = CertificateMaster.objects.all()


class CertificateMasterToggleStatusView(APIView):
    permission_classes = [IsSchoolAdmin]

    def post(self, request, pk):
        try:
            obj = CertificateMaster.objects.get(pk=pk)
            obj.status = not obj.status
            obj.save()
            return Response({
                'id': obj.id,
                'status': obj.status,
                'message': f'Certificate {"activated" if obj.status else "deactivated"} successfully'
            })
        except CertificateMaster.DoesNotExist:
            return Response({'detail': 'Certificate not found.'}, status=status.HTTP_404_NOT_FOUND)

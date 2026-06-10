from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import connection
from .models import School, AcademicSession
from .serializers import SchoolSerializer, SchoolCreateSerializer, AcademicSessionSerializer
from utils.permissions import IsSuperAdmin, IsSchoolAdmin
from utils.tenant import register_school_database, get_school_db_alias


class SchoolListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsSuperAdmin]
    queryset = School.objects.all()

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return SchoolCreateSerializer
        return SchoolSerializer

    def perform_create(self, serializer):
        validated_data = serializer.validated_data
        admin_email = validated_data.pop('admin_email')
        admin_password = validated_data.pop('admin_password')
        admin_first_name = validated_data.pop('admin_first_name')
        admin_last_name = validated_data.pop('admin_last_name')

        school_code = validated_data['code'].lower()
        db_name = f'school_erp_{school_code}'
        school = serializer.save(db_name=db_name)

        self._create_school_database(school, db_name)

        from apps.accounts.models import User
        User.objects.create_user(
            email=admin_email,
            password=admin_password,
            first_name=admin_first_name,
            last_name=admin_last_name,
            role='school_admin',
            school_id=school.id,
        )

    def _create_school_database(self, school, db_name):
        alias = register_school_database(school.id, db_name)
        with connection.cursor() as cursor:
            cursor.execute(f"SELECT 1 FROM pg_database WHERE datname = %s", [db_name])
            if not cursor.fetchone():
                cursor.execute(f'CREATE DATABASE "{db_name}"')

        from django.core.management import call_command
        call_command('migrate', '--database', alias, '--run-syncdb', verbosity=0)


class SchoolDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsSuperAdmin]
    queryset = School.objects.all()
    serializer_class = SchoolSerializer


class ToggleSchoolStatusView(APIView):
    permission_classes = [IsSuperAdmin]

    def post(self, request, pk):
        try:
            school = School.objects.get(pk=pk)
            school.status = 'inactive' if school.status == 'active' else 'active'
            school.save()
            return Response({'status': school.status, 'detail': f'School {school.status}.'})
        except School.DoesNotExist:
            return Response({'detail': 'School not found.'}, status=status.HTTP_404_NOT_FOUND)


class AcademicSessionListCreateView(generics.ListCreateAPIView):
    serializer_class = AcademicSessionSerializer
    permission_classes = [IsSchoolAdmin]

    def get_queryset(self):
        school_id = self.kwargs.get('school_id') or self.request.user.school_id
        return AcademicSession.objects.filter(school_id=school_id)


class SchoolDashboardView(APIView):
    permission_classes = [IsSchoolAdmin]

    def get(self, request):
        from apps.students.models import Student
        from apps.staff.models import Staff
        from django.utils import timezone

        today = timezone.now().date()
        data = {
            'total_students': Student.objects.count(),
            'total_staff': Staff.objects.count(),
            'today': str(today),
        }
        return Response(data)

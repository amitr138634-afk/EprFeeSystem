from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import connection, transaction, IntegrityError
from .models import School, AcademicSession
from .serializers import SchoolSerializer, SchoolCreateSerializer, AcademicSessionSerializer
from utils.permissions import IsSuperAdmin, IsSchoolAdmin
from utils.tenant import register_school_database


class SchoolListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsSuperAdmin]
    queryset = School.objects.all().order_by('-created_at')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return SchoolCreateSerializer
        return SchoolSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        admin_email = data.pop('admin_email')
        admin_password = data.pop('admin_password')
        admin_first_name = data.pop('admin_first_name')
        admin_last_name = data.pop('admin_last_name')

        school_code = data['code'].lower().replace('-', '_')
        db_name = f'school_erp_{school_code}'

        # Step 1 — create the PostgreSQL database (autocommit, outside transaction)
        try:
            self._create_postgres_database(db_name)
        except Exception as e:
            return Response(
                {'detail': f'Could not create school database: {e}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Step 2 — central DB writes inside a transaction
        try:
            with transaction.atomic():
                school = School.objects.create(db_name=db_name, **data)

                from apps.accounts.models import User
                if User.objects.filter(email=admin_email).exists():
                    raise IntegrityError(f'User with email {admin_email} already exists.')

                User.objects.create_user(
                    email=admin_email,
                    password=admin_password,
                    first_name=admin_first_name,
                    last_name=admin_last_name,
                    role='school_admin',
                    school_id=school.id,
                )
        except IntegrityError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'detail': f'Unexpected error: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Step 3 — run migrations on the new tenant DB
        try:
            self._migrate_tenant(school.id, db_name)
        except Exception as e:
            # Tenant DB exists but migrations failed — return warning, not fatal
            return Response(
                {
                    'school': SchoolSerializer(school).data,
                    'warning': f'School created but tenant migration failed: {e}. '
                               f'Run: python manage.py migrate --database=school_{school.id}',
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(SchoolSerializer(school).data, status=status.HTTP_201_CREATED)

    @staticmethod
    def _create_postgres_database(db_name):
        # Use autocommit because CREATE DATABASE cannot run inside a transaction
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", [db_name])
            if cursor.fetchone():
                return
            connection.set_autocommit(True)
            try:
                cursor.execute(f'CREATE DATABASE "{db_name}"')
            finally:
                connection.set_autocommit(False)

    @staticmethod
    def _migrate_tenant(school_id, db_name):
        alias = register_school_database(school_id, db_name)
        from django.core.management import call_command
        call_command('migrate', '--database', alias, '--run-syncdb', verbosity=0, interactive=False)


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
        # When called as super_admin (no tenant context), counts may be 0 — that's fine.
        try:
            total_students = Student.objects.count()
        except Exception:
            total_students = 0
        try:
            total_staff = Staff.objects.count()
        except Exception:
            total_staff = 0

        data = {
            'total_students': total_students,
            'total_staff': total_staff,
            'today': str(today),
        }
        return Response(data)

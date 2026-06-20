from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count, Q
from .models import Student, ClassMaster, ClassSectionMaster
from .serializers import (
    StudentSerializer, StudentListSerializer,
    ClassStrengthSerializer,
    ClassMasterSerializer, ClassSectionMasterSerializer
)
from utils.permissions import IsSchoolAdmin, IsSchoolStaff
from utils.session import SessionScopedMixin, current_session_year


# ClassMaster views (from fee-backend tables)
class ClassMasterListView(SessionScopedMixin, generics.ListAPIView):
    """List classes from class_master table (fee-backend)"""
    serializer_class = ClassMasterSerializer
    permission_classes = [IsSchoolStaff]
    queryset = ClassMaster.objects.prefetch_related('sections').filter(status=True)


class ClassSectionMasterListView(SessionScopedMixin, generics.ListAPIView):
    """List sections from class_section_master table (fee-backend)"""
    serializer_class = ClassSectionMasterSerializer
    permission_classes = [IsSchoolStaff]
    queryset = ClassSectionMaster.objects.select_related('class_master').filter(status=True)

    def get_queryset(self):
        qs = super().get_queryset()
        class_id = self.request.query_params.get('class_id')
        if class_id:
            qs = qs.filter(class_master_id=class_id)
        return qs


class StudentListCreateView(SessionScopedMixin, generics.ListCreateAPIView):
    """List and create students (from fee-backend students table)"""
    permission_classes = [IsSchoolStaff]
    queryset = Student.objects.all()

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return StudentSerializer
        return StudentListSerializer

    def get_queryset(self):
        try:
            qs = super().get_queryset()
            params = self.request.query_params

            if params.get('class_id'):
                qs = qs.filter(class_id=params['class_id'])
            if params.get('status'):
                qs = qs.filter(status=params['status'])
            if params.get('search'):
                q = params['search']
                qs = qs.filter(
                    Q(student_name__icontains=q) |
                    Q(admission_no__icontains=q) |
                    Q(father_name__icontains=q) |
                    Q(father_mobile__icontains=q)
                )

            return qs.order_by('-admission_date')
        except Exception as e:
            print(f"ERROR in StudentListCreateView: {str(e)}")
            import traceback
            traceback.print_exc()
            raise


class StudentDetailView(SessionScopedMixin, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = StudentSerializer
    permission_classes = [IsSchoolStaff]
    queryset = Student.objects.all()


class StudentStrengthView(APIView):
    """Get class-wise student strength statistics"""
    permission_classes = [IsSchoolStaff]

    def get(self, request):
        session = request.query_params.get('session') or current_session_year() or ''

        qs = Student.objects.all()
        if session:
            qs = qs.filter(session=session)

        data = (
            qs
            .values('class_name')
            .annotate(
                total=Count('id'),
                boys=Count('id', filter=Q(gender='M')),
                girls=Count('id', filter=Q(gender='F')),
                active=Count('id', filter=Q(status='active')),
                inactive=Count('id', filter=~Q(status='active')),
            )
            .order_by('class_name')
        )

        # `class_name` above is the raw ClassMaster id grouped from the Student
        # table — resolve each to its display name via ClassMaster.
        classes = ClassMaster.objects.filter(session=session) if session else ClassMaster.objects.all()
        class_names = {str(c.id): c.class_name for c in classes}

        results = []
        for row in data:
            raw = row['class_name']
            row['class_name'] = class_names.get(str(raw), raw)
            results.append(row)
        results.sort(key=lambda r: r['class_name'])

        return Response({'results': results})

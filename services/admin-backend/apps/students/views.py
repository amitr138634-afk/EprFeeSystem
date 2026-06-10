from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count, Q
from .models import Student, Class, Section
from .serializers import (
    StudentSerializer, StudentListSerializer, ClassSerializer,
    SectionSerializer, ClassStrengthSerializer
)
from utils.permissions import IsSchoolAdmin, IsSchoolStaff


class ClassListCreateView(generics.ListCreateAPIView):
    serializer_class = ClassSerializer
    permission_classes = [IsSchoolStaff]
    queryset = Class.objects.all()


class SectionListCreateView(generics.ListCreateAPIView):
    serializer_class = SectionSerializer
    permission_classes = [IsSchoolStaff]

    def get_queryset(self):
        qs = Section.objects.all()
        class_id = self.request.query_params.get('class_id')
        if class_id:
            qs = qs.filter(class_ref_id=class_id)
        return qs


class StudentListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsSchoolStaff]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return StudentSerializer
        return StudentListSerializer

    def get_queryset(self):
        qs = Student.objects.select_related('class_ref', 'section')
        params = self.request.query_params

        if params.get('class_id'):
            qs = qs.filter(class_ref_id=params['class_id'])
        if params.get('section_id'):
            qs = qs.filter(section_id=params['section_id'])
        if params.get('status'):
            qs = qs.filter(status=params['status'])
        if params.get('search'):
            q = params['search']
            qs = qs.filter(
                Q(first_name__icontains=q) |
                Q(last_name__icontains=q) |
                Q(admission_no__icontains=q) |
                Q(father_name__icontains=q) |
                Q(father_phone__icontains=q)
            )
        return qs


class StudentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = StudentSerializer
    permission_classes = [IsSchoolStaff]
    queryset = Student.objects.all()


class StudentStrengthView(APIView):
    permission_classes = [IsSchoolStaff]

    def get(self, request):
        data = (
            Student.objects
            .filter(status='active')
            .values('class_ref__name', 'section__name')
            .annotate(
                total=Count('id'),
                boys=Count('id', filter=Q(gender='M')),
                girls=Count('id', filter=Q(gender='F')),
            )
            .order_by('class_ref__order', 'section__name')
        )
        result = [
            {
                'class_name': row['class_ref__name'],
                'section_name': row['section__name'],
                'total': row['total'],
                'boys': row['boys'],
                'girls': row['girls'],
            }
            for row in data
        ]
        return Response(result)


class ChangeSectionView(APIView):
    permission_classes = [IsSchoolAdmin]

    def post(self, request, pk):
        try:
            student = Student.objects.get(pk=pk)
            section_id = request.data.get('section_id')
            class_id = request.data.get('class_id')
            if section_id:
                student.section_id = section_id
            if class_id:
                student.class_ref_id = class_id
            student.save()
            return Response(StudentSerializer(student).data)
        except Student.DoesNotExist:
            return Response({'detail': 'Student not found.'}, status=status.HTTP_404_NOT_FOUND)

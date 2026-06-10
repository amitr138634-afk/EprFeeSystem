from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import ExamType, SubjectAllocation, StudentSubject, Marks, RemarkMaster, SignatureMaster
from .serializers import (
    ExamTypeSerializer, SubjectAllocationSerializer, StudentSubjectSerializer,
    MarksSerializer, RemarkMasterSerializer, SignatureMasterSerializer
)
from utils.permissions import IsSchoolStaff, IsSchoolAdmin


class ExamTypeListCreateView(generics.ListCreateAPIView):
    serializer_class = ExamTypeSerializer
    permission_classes = [IsSchoolAdmin]

    def get_queryset(self):
        qs = ExamType.objects.all()
        if self.request.query_params.get('session_year'):
            qs = qs.filter(session_year=self.request.query_params['session_year'])
        return qs


class SubjectAllocationListCreateView(generics.ListCreateAPIView):
    serializer_class = SubjectAllocationSerializer
    permission_classes = [IsSchoolStaff]

    def get_queryset(self):
        qs = SubjectAllocation.objects.select_related('class_ref', 'section', 'subject', 'teacher')
        params = self.request.query_params
        if params.get('class_id'):
            qs = qs.filter(class_ref_id=params['class_id'])
        if params.get('section_id'):
            qs = qs.filter(section_id=params['section_id'])
        if params.get('session_year'):
            qs = qs.filter(session_year=params['session_year'])
        return qs


class MarksListCreateView(generics.ListCreateAPIView):
    serializer_class = MarksSerializer
    permission_classes = [IsSchoolStaff]

    def get_queryset(self):
        qs = Marks.objects.select_related('student', 'subject', 'exam_type')
        params = self.request.query_params
        if params.get('exam_type_id'):
            qs = qs.filter(exam_type_id=params['exam_type_id'])
        if params.get('class_id'):
            qs = qs.filter(student__class_ref_id=params['class_id'])
        if params.get('section_id'):
            qs = qs.filter(student__section_id=params['section_id'])
        if params.get('student_id'):
            qs = qs.filter(student_id=params['student_id'])
        return qs


class BulkMarksView(APIView):
    permission_classes = [IsSchoolStaff]

    def post(self, request):
        marks_data = request.data.get('marks', [])
        results = []
        for item in marks_data:
            obj, _ = Marks.objects.update_or_create(
                student_id=item['student_id'],
                subject_id=item['subject_id'],
                exam_type_id=item['exam_type_id'],
                defaults={
                    'marks_obtained': item.get('marks_obtained'),
                    'grade': item.get('grade', ''),
                    'remarks': item.get('remarks', ''),
                    'is_absent': item.get('is_absent', False),
                    'entered_by': request.user.id,
                }
            )
            results.append(obj)
        return Response({'detail': f'{len(results)} marks records saved.'})


class RemarkMasterListCreateView(generics.ListCreateAPIView):
    serializer_class = RemarkMasterSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = RemarkMaster.objects.all()


class SignatureMasterListCreateView(generics.ListCreateAPIView):
    serializer_class = SignatureMasterSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = SignatureMaster.objects.all()


class ExamTypeDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ExamTypeSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = ExamType.objects.all()


class SubjectAllocationDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SubjectAllocationSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = SubjectAllocation.objects.all()


class RemarkMasterDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = RemarkMasterSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = RemarkMaster.objects.all()


class StudentSubjectView(generics.ListCreateAPIView):
    serializer_class = StudentSubjectSerializer
    permission_classes = [IsSchoolStaff]

    def get_queryset(self):
        qs = StudentSubject.objects.select_related('subject')
        params = self.request.query_params
        if params.get('student_id'):
            qs = qs.filter(student_id=params['student_id'])
        if params.get('session_year'):
            qs = qs.filter(session_year=params['session_year'])
        return qs

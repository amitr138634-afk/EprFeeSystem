from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Subject, Period, Timetable, SubstituteTeacher
from .serializers import (
    SubjectSerializer, PeriodSerializer, TimetableSerializer, SubstituteTeacherSerializer
)
from utils.permissions import IsSchoolStaff, IsSchoolAdmin
from utils.session import SessionScopedMixin, current_session_year


class SubjectListCreateView(generics.ListCreateAPIView):
    serializer_class = SubjectSerializer
    permission_classes = [IsSchoolStaff]
    queryset = Subject.objects.all()


class PeriodListCreateView(generics.ListCreateAPIView):
    serializer_class = PeriodSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = Period.objects.all()


class TimetableListCreateView(SessionScopedMixin, generics.ListCreateAPIView):
    serializer_class = TimetableSerializer
    permission_classes = [IsSchoolStaff]
    queryset = Timetable.objects.select_related('class_ref', 'subject', 'teacher', 'period').prefetch_related('sections')

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        if params.get('class_id'):
            qs = qs.filter(class_ref_id=params['class_id'])
        if params.get('section_id'):
            qs = qs.filter(sections__id=params['section_id'])
        if params.get('teacher_id'):
            qs = qs.filter(teacher_id=params['teacher_id'])
        if params.get('day'):
            qs = qs.filter(day=params['day'])
        return qs.distinct()  # distinct() because ManyToMany can create duplicates


class TimetableDetailView(SessionScopedMixin, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TimetableSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = Timetable.objects.all()


class TeacherTimetableView(APIView):
    permission_classes = [IsSchoolStaff]

    def get(self, request, teacher_id):
        timetable = Timetable.objects.filter(teacher_id=teacher_id)
        session_year = current_session_year()
        if session_year:
            timetable = timetable.filter(session_year=session_year)
        timetable = timetable.select_related('class_ref', 'section', 'subject', 'period').order_by('day', 'period__order')
        serializer = TimetableSerializer(timetable, many=True)
        return Response(serializer.data)


class SubjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SubjectSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = Subject.objects.all()


class PeriodDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PeriodSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = Period.objects.all()


class SubstituteTeacherListCreateView(generics.ListCreateAPIView):
    serializer_class = SubstituteTeacherSerializer
    permission_classes = [IsSchoolAdmin]

    def get_queryset(self):
        qs = SubstituteTeacher.objects.select_related(
            'original_teacher', 
            'substitute_teacher', 
            'timetable',
            'timetable__class_ref',
            'timetable__period',
            'timetable__subject'
        )
        params = self.request.query_params
        if params.get('date'):
            qs = qs.filter(date=params['date'])
        if params.get('month') and params.get('year'):
            qs = qs.filter(date__month=params['month'], date__year=params['year'])
        return qs.order_by('-date')

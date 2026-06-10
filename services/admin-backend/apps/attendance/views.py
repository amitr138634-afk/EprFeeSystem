from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count, Q
from django.utils import timezone
from .models import StudentAttendance, StaffAttendance, Holiday
from .serializers import (
    StudentAttendanceSerializer, BulkAttendanceSerializer,
    StaffAttendanceSerializer, HolidaySerializer
)
from apps.students.models import Student
from utils.permissions import IsSchoolStaff, IsSchoolAdmin


class StudentAttendanceListView(generics.ListAPIView):
    serializer_class = StudentAttendanceSerializer
    permission_classes = [IsSchoolStaff]

    def get_queryset(self):
        qs = StudentAttendance.objects.select_related('student')
        params = self.request.query_params
        if params.get('date'):
            qs = qs.filter(date=params['date'])
        if params.get('student_id'):
            qs = qs.filter(student_id=params['student_id'])
        if params.get('class_id'):
            qs = qs.filter(student__class_ref_id=params['class_id'])
        if params.get('section_id'):
            qs = qs.filter(student__section_id=params['section_id'])
        return qs


class BulkStudentAttendanceView(APIView):
    permission_classes = [IsSchoolStaff]

    def post(self, request):
        serializer = BulkAttendanceSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        date = data['date']
        records = []
        for att in data['attendances']:
            obj, _ = StudentAttendance.objects.update_or_create(
                student_id=att['student_id'],
                date=date,
                defaults={
                    'status': att.get('status', 'present'),
                    'remarks': att.get('remarks', ''),
                    'marked_by': request.user.id,
                }
            )
            records.append(obj)
        return Response({'detail': f'{len(records)} attendance records saved.'})


class AttendanceRegisterView(APIView):
    permission_classes = [IsSchoolStaff]

    def get(self, request):
        params = request.query_params
        class_id = params.get('class_id')
        section_id = params.get('section_id')
        month = params.get('month')
        year = params.get('year')

        students = Student.objects.filter(
            class_ref_id=class_id, section_id=section_id, status='active'
        )
        attendance_qs = StudentAttendance.objects.filter(
            student__class_ref_id=class_id,
            student__section_id=section_id,
            date__month=month,
            date__year=year,
        )
        attendance_map = {}
        for att in attendance_qs:
            key = (att.student_id, str(att.date))
            attendance_map[key] = att.status

        result = []
        for student in students:
            student_data = {
                'student_id': student.id,
                'name': student.full_name,
                'admission_no': student.admission_no,
                'attendance': attendance_map,
            }
            result.append(student_data)
        return Response(result)


class AbsentLogView(generics.ListAPIView):
    serializer_class = StudentAttendanceSerializer
    permission_classes = [IsSchoolStaff]

    def get_queryset(self):
        return StudentAttendance.objects.filter(
            status='absent'
        ).select_related('student').order_by('-date')


class AttendanceSummaryView(APIView):
    permission_classes = [IsSchoolStaff]

    def get(self, request):
        date = request.query_params.get('date', str(timezone.now().date()))
        summary = (
            StudentAttendance.objects
            .filter(date=date)
            .values('student__class_ref__name', 'student__section__name')
            .annotate(
                total=Count('id'),
                present=Count('id', filter=Q(status='present')),
                absent=Count('id', filter=Q(status='absent')),
                late=Count('id', filter=Q(status='late')),
            )
            .order_by('student__class_ref__order')
        )
        return Response(list(summary))


class StaffAttendanceListCreateView(generics.ListCreateAPIView):
    serializer_class = StaffAttendanceSerializer
    permission_classes = [IsSchoolStaff]

    def get_queryset(self):
        qs = StaffAttendance.objects.select_related('staff')
        params = self.request.query_params
        if params.get('date'):
            qs = qs.filter(date=params['date'])
        if params.get('staff_id'):
            qs = qs.filter(staff_id=params['staff_id'])
        if params.get('month') and params.get('year'):
            qs = qs.filter(date__month=params['month'], date__year=params['year'])
        return qs


class HolidayListCreateView(generics.ListCreateAPIView):
    serializer_class = HolidaySerializer
    permission_classes = [IsSchoolAdmin]

    def get_queryset(self):
        qs = Holiday.objects.all()
        year = self.request.query_params.get('year')
        if year:
            qs = qs.filter(date__year=year)
        return qs

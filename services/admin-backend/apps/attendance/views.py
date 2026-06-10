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


class HolidayDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = HolidaySerializer
    permission_classes = [IsSchoolAdmin]
    queryset = Holiday.objects.all()


class DashboardStatsView(APIView):
    permission_classes = [IsSchoolStaff]

    def get(self, request):
        from apps.students.models import Student, Section
        from apps.staff.models import Staff, LeaveRequest

        today = timezone.now().date()

        total_students = Student.objects.filter(status='active').count()
        total_staff = Staff.objects.filter(status='active').count()

        present_students = StudentAttendance.objects.filter(
            date=today, status='present'
        ).count()
        absent_students = StudentAttendance.objects.filter(
            date=today, status='absent'
        ).count()
        present_staff = StaffAttendance.objects.filter(
            date=today, status='present'
        ).count()

        class_attendance = (
            StudentAttendance.objects
            .filter(date=today)
            .values('student__class_ref__name', 'student__class_ref__order')
            .annotate(
                total=Count('id'),
                present=Count('id', filter=Q(status='present')),
                absent=Count('id', filter=Q(status='absent')),
            )
            .order_by('student__class_ref__order')
        )

        # --- Absent staff today ---
        absent_staff = [
            {
                'name': sa.staff.full_name,
                'designation': sa.staff.designation.name if sa.staff.designation else '',
            }
            for sa in StaffAttendance.objects
                .filter(date=today, status__in=['absent', 'leave'])
                .select_related('staff', 'staff__designation')
        ]

        # --- Today's pending leave requests (overlapping today) ---
        today_leave_requests = [
            {
                'staff_name': lr.staff.full_name,
                'leave_type': lr.leave_type.name if lr.leave_type else '',
                'from_date': lr.from_date,
                'to_date': lr.to_date,
            }
            for lr in LeaveRequest.objects
                .filter(status='pending', from_date__lte=today, to_date__gte=today)
                .select_related('staff', 'leave_type')
        ]

        # --- Birthdays today ---
        student_birthdays = [
            {
                'name': s.full_name,
                'class_section': (
                    f"{s.class_ref.name}-{s.section.name}" if s.class_ref and s.section
                    else (s.class_ref.name if s.class_ref else '')
                ),
            }
            for s in Student.objects
                .filter(status='active', date_of_birth__month=today.month, date_of_birth__day=today.day)
                .select_related('class_ref', 'section')
        ]
        staff_birthdays = [
            {
                'name': st.full_name,
                'designation': st.designation.name if st.designation else '',
            }
            for st in Staff.objects
                .filter(status='active', date_of_birth__month=today.month, date_of_birth__day=today.day)
                .select_related('designation')
        ]

        # --- Absent / leave students today ---
        absent_students_list = [
            {
                'name': att.student.full_name,
                'class_section': (
                    f"{att.student.class_ref.name}-{att.student.section.name}"
                    if att.student.class_ref and att.student.section else ''
                ),
                'type': att.get_status_display(),
            }
            for att in StudentAttendance.objects
                .filter(date=today, status__in=['absent', 'leave'])
                .select_related('student', 'student__class_ref', 'student__section')
        ]

        # --- Per-section grids (attendance + homework status) ---
        sec_counts = {}
        for row in (
            StudentAttendance.objects.filter(date=today)
            .values('student__section')
            .annotate(total=Count('id'), present=Count('id', filter=Q(status='present')))
        ):
            sec_counts[row['student__section']] = row

        class_attendance_status = []
        class_hw_status = []
        for sec in Section.objects.select_related('class_ref').order_by('class_ref__order', 'name'):
            label = f"{sec.class_ref.name}-{sec.name}"
            row = sec_counts.get(sec.id)
            class_attendance_status.append({
                'label': label,
                'marked': bool(row),
                'total': row['total'] if row else 0,
                'present': row['present'] if row else 0,
            })
            # No homework module yet — grid renders as "not marked"
            class_hw_status.append({'label': label, 'marked': False})

        return Response({
            'total_students': total_students,
            'total_staff': total_staff,
            'present_today': present_students,
            'absent_today': absent_students,
            'present_staff_today': present_staff,
            'class_attendance': list(class_attendance),
            'absent_staff': absent_staff,
            'today_leave_requests': today_leave_requests,
            'student_birthdays': student_birthdays,
            'staff_birthdays': staff_birthdays,
            'absent_students': absent_students_list,
            'class_attendance_status': class_attendance_status,
            'class_hw_status': class_hw_status,
        })

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count, Q
from django.utils import timezone
from .models import StudentAttendance, StaffAttendance, Holiday
from .serializers import (
    StudentAttendanceSerializer, BulkAttendanceSerializer,
    StaffAttendanceSerializer, BulkStaffAttendanceSerializer, HolidaySerializer
)
from apps.students.models import Student
from apps.students.utils import class_name_lookup_map, section_name_lookup_map
from apps.staff.models import Staff
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
            # Filter by class_name from students table
            from apps.students.models import ClassMaster
            try:
                class_obj = ClassMaster.objects.get(id=params['class_id'])
                qs = qs.filter(student__class_name=class_obj.class_name)
            except ClassMaster.DoesNotExist:
                pass
        if params.get('section'):
            qs = qs.filter(student__section=params['section'])
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
        for att in data['attendance']:
            obj, _ = StudentAttendance.objects.update_or_create(
                student_id=att['student'],
                date=date,
                defaults={
                    'status': att.get('status', 'present'),
                    'remarks': att.get('remarks', ''),
                    'marked_by': request.user.id,
                }
            )
            records.append(obj)
        return Response({
            'detail': f'{len(records)} attendance records saved.',
            'count': len(records)
        })


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


def _filtered_staff(params):
    """Active staff queryset with the common department/designation/type/search filters."""
    qs = Staff.objects.filter(status='active').select_related('department', 'designation')
    if params.get('department_id'):
        qs = qs.filter(department_id=params['department_id'])
    if params.get('designation_id'):
        qs = qs.filter(designation_id=params['designation_id'])
    if params.get('staff_type'):
        qs = qs.filter(staff_type=params['staff_type'])
    if params.get('search'):
        q = params['search']
        qs = qs.filter(
            Q(first_name__icontains=q) | Q(last_name__icontains=q) |
            Q(employee_id__icontains=q)
        )
    return qs


class StaffAttendanceRosterView(APIView):
    """Full active-staff roster for a date, merged with any saved attendance.

    Powers both the marking page (pre-loads existing marks) and the date-wise
    summary (unmarked staff surface as marked=False)."""
    permission_classes = [IsSchoolStaff]

    def get(self, request):
        params = request.query_params
        date = params.get('date', str(timezone.now().date()))
        staff_qs = _filtered_staff(params)

        records = {
            r.staff_id: r
            for r in StaffAttendance.objects.filter(
                date=date, staff__in=staff_qs
            )
        }

        result = []
        for s in staff_qs:
            rec = records.get(s.id)
            result.append({
                'staff_id': s.id,
                'employee_id': s.employee_id,
                'staff_name': s.full_name,
                'designation': s.designation.name if s.designation else '',
                'department': s.department.name if s.department else '',
                'staff_type': s.staff_type,
                'marked': rec is not None,
                'status': rec.status if rec else None,
                'check_in': rec.check_in if rec else None,
                'check_out': rec.check_out if rec else None,
                'remarks': rec.remarks if rec else '',
            })
        return Response(result)


class BulkStaffAttendanceView(APIView):
    """Bulk upsert of staff attendance for a single date."""
    permission_classes = [IsSchoolStaff]

    def post(self, request):
        serializer = BulkStaffAttendanceSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        date = data['date']
        count = 0
        for att in data['attendance']:
            staff_id = att.get('staff') or att.get('staff_id')
            if not staff_id:
                continue
            StaffAttendance.objects.update_or_create(
                staff_id=staff_id,
                date=date,
                defaults={
                    'status': att.get('status', 'present'),
                    'check_in': att.get('check_in') or None,
                    'check_out': att.get('check_out') or None,
                    'remarks': att.get('remarks', ''),
                },
            )
            count += 1
        return Response({'detail': f'{count} attendance records saved.', 'count': count})


class StaffMonthlyReportView(APIView):
    """Per-staff monthly attendance aggregation with a day-by-day grid."""
    permission_classes = [IsSchoolStaff]

    def get(self, request):
        params = request.query_params
        today = timezone.now().date()
        month = int(params.get('month', today.month))
        year = int(params.get('year', today.year))
        staff_qs = _filtered_staff(params)

        # Bucket each staff member's marks for the month: staff_id -> {day: status}
        by_staff = {}
        for r in StaffAttendance.objects.filter(
            date__month=month, date__year=year, staff__in=staff_qs
        ):
            by_staff.setdefault(r.staff_id, {})[r.date.day] = r.status

        CODE = {
            'present': 'P', 'absent': 'A', 'late': 'L',
            'half_day': 'H', 'leave': 'LE', 'holiday': 'HO',
        }

        result = []
        for s in staff_qs:
            days_map = by_staff.get(s.id, {})
            present = absent = late = half = leave = holiday = 0
            grid = {}
            for day, st in days_map.items():
                grid[day] = CODE.get(st, '?')
                if st == 'present':
                    present += 1
                elif st == 'absent':
                    absent += 1
                elif st == 'late':
                    late += 1
                elif st == 'half_day':
                    half += 1
                elif st == 'leave':
                    leave += 1
                elif st == 'holiday':
                    holiday += 1

            counted = present + absent + late + half
            effective = present + late + (0.5 * half)
            pct = round((effective / counted) * 100, 1) if counted else None

            result.append({
                'staff_id': s.id,
                'employee_id': s.employee_id,
                'staff_name': s.full_name,
                'designation': s.designation.name if s.designation else '',
                'department': s.department.name if s.department else '',
                'present_days': present,
                'absent_days': absent,
                'late_days': late,
                'half_days': half,
                'leave_days': leave,
                'holiday_days': holiday,
                'total_marked': counted,
                'attendance_percentage': pct,
                'days': grid,
            })
        return Response(result)


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
        from apps.staff.models import Staff, LeaveRequest

        today = timezone.now().date()
        class_names = class_name_lookup_map()
        section_names = section_name_lookup_map()

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
            .values('student__class_name')
            .annotate(
                total=Count('id'),
                present=Count('id', filter=Q(status='present')),
                absent=Count('id', filter=Q(status='absent')),
            )
            .order_by('student__class_name')
        )
        class_attendance = [
            {**row, 'student__class_name': class_names.get(str(row['student__class_name']), row['student__class_name'])}
            for row in class_attendance
        ]

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
                'name': s.student_name,
                'class_section': (
                    f"{class_names.get(str(s.class_name), s.class_name)}-{section_names.get(str(s.section), s.section)}"
                    if s.class_name else ''
                ),
            }
            for s in Student.objects
                .filter(status='active', date_of_birth__month=today.month, date_of_birth__day=today.day)
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
                'name': att.student.student_name,
                'class_section': (
                    f"{class_names.get(str(att.student.class_name), att.student.class_name)}"
                    f"-{section_names.get(str(att.student.section), att.student.section)}"
                    if att.student.class_name else ''
                ),
                'type': att.get_status_display(),
            }
            for att in StudentAttendance.objects
                .filter(date=today, status__in=['absent', 'leave'])
                .select_related('student')
        ]

        # --- Per-section grids (attendance + homework status) ---
        sec_counts = {}
        for row in (
            StudentAttendance.objects.filter(date=today)
            .values('student__class_name', 'student__section')
            .annotate(total=Count('id'), present=Count('id', filter=Q(status='present')))
        ):
            sec_counts[(row['student__class_name'], row['student__section'])] = row

        class_attendance_status = []
        class_hw_status = []
        distinct_sections = (
            Student.objects.filter(status='active')
            .values('class_name', 'section')
            .distinct()
            .order_by('class_name', 'section')
        )
        for cs in distinct_sections:
            label = (
                f"{class_names.get(str(cs['class_name']), cs['class_name'])}"
                f"-{section_names.get(str(cs['section']), cs['section'])}"
            )
            row = sec_counts.get((cs['class_name'], cs['section']))
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

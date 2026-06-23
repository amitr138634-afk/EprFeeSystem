from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count
from .models import Vehicle, Route, Stop, StudentTransport, TransportAttendance, VehiclePart, VehicleMake, VehicleModel
from .serializers import (
    VehicleSerializer, RouteSerializer, StopSerializer, StudentTransportSerializer,
    TransportAttendanceSerializer, VehiclePartSerializer, VehicleMakeSerializer, VehicleModelSerializer
)
from utils.permissions import IsSchoolAdmin, IsSchoolStaff
from utils.session import SessionScopedMixin, current_session_year


class VehicleMakeListCreateView(generics.ListCreateAPIView):
    serializer_class = VehicleMakeSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = VehicleMake.objects.all()


class VehicleModelListCreateView(generics.ListCreateAPIView):
    serializer_class = VehicleModelSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = VehicleModel.objects.all()


class VehicleListCreateView(SessionScopedMixin, generics.ListCreateAPIView):
    serializer_class = VehicleSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = Vehicle.objects.all()


class VehicleDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = VehicleSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = Vehicle.objects.all()


class RouteListCreateView(SessionScopedMixin, generics.ListCreateAPIView):
    serializer_class = RouteSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = Route.objects.prefetch_related('stops').filter(is_active=True)


class StopListCreateView(generics.ListCreateAPIView):
    """Scoped via its route's session (Stop has no session column of its
    own — see model docstring)."""
    serializer_class = StopSerializer
    permission_classes = [IsSchoolAdmin]

    def get_queryset(self):
        qs = Stop.objects.select_related('route')
        if self.request.query_params.get('route_id'):
            qs = qs.filter(route_id=self.request.query_params['route_id'])
        else:
            session_year = current_session_year()
            if session_year:
                qs = qs.filter(route__session=session_year)
        return qs


class StudentTransportListCreateView(SessionScopedMixin, generics.ListCreateAPIView):
    serializer_class = StudentTransportSerializer
    permission_classes = [IsSchoolStaff]
    queryset = StudentTransport.objects.select_related('route', 'stop')

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        if params.get('route_id'):
            qs = qs.filter(route_id=params['route_id'])
        if params.get('status'):
            qs = qs.filter(status=params['status'])
        return qs


class TransportAttendanceView(generics.ListCreateAPIView):
    serializer_class = TransportAttendanceSerializer
    permission_classes = [IsSchoolStaff]

    def get_queryset(self):
        qs = TransportAttendance.objects.select_related('route')
        params = self.request.query_params
        if params.get('date'):
            qs = qs.filter(date=params['date'])
        if params.get('route_id'):
            qs = qs.filter(route_id=params['route_id'])
        return qs


class RouteAttendanceView(APIView):
    """Route-wise transport attendance register.

    GET  ?route_id=&trip_type=morning|evening&date=YYYY-MM-DD
         -> every active student on that route, with their attendance
            status_id for that date+trip (defaults to the 'Present' row's
            id if not yet marked). status_id references
            masters.AttendanceMaster.id (Present, Absent, Leave, etc. —
            admin-defined).
    POST {route_id, trip_type, date, records: [{student_id, status_id}]}
         -> bulk upsert (one row per student per date+trip_type)."""
    permission_classes = [IsSchoolStaff]

    def get(self, request):
        from apps.masters.models import Student, AttendanceMaster
        from django.utils import timezone

        params = request.query_params
        route_id = params.get('route_id')
        trip_type = params.get('trip_type', 'morning')
        date = params.get('date') or str(timezone.now().date())
        if not route_id:
            return Response({'detail': 'route_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        default_status = AttendanceMaster.objects.filter(status_name__iexact='present').first() \
            or AttendanceMaster.objects.filter(status=True).order_by('id').first()
        default_status_id = default_status.id if default_status else None

        transports = StudentTransport.objects.filter(route_id=route_id, status='active').select_related('stop')
        students = {s.id: s for s in Student.objects.filter(id__in=[t.student_id for t in transports])}

        existing = {
            a.student_id: a.status_id
            for a in TransportAttendance.objects.filter(route_id=route_id, trip_type=trip_type, date=date)
        }

        rows = []
        for t in transports:
            student = students.get(t.student_id)
            if not student:
                continue
            rows.append({
                'student_id': t.student_id,
                'student_name': student.student_name,
                'admission_no': student.admission_no,
                'stop_name': t.stop.name,
                'status_id': existing.get(t.student_id, default_status_id),
            })
        rows.sort(key=lambda r: r['student_name'])

        return Response({'route_id': int(route_id), 'trip_type': trip_type, 'date': date, 'students': rows})

    def post(self, request):
        from apps.masters.models import Student, AttendanceMaster

        route_id = request.data.get('route_id')
        trip_type = request.data.get('trip_type')
        date = request.data.get('date')
        records = request.data.get('records') or []

        if not route_id or not trip_type or not date:
            return Response({'detail': 'route_id, trip_type, and date are required.'}, status=status.HTTP_400_BAD_REQUEST)

        valid_status_ids = set(AttendanceMaster.objects.filter(status=True).values_list('id', flat=True))
        students = {s.id: s for s in Student.objects.filter(id__in=[r.get('student_id') for r in records])}

        saved = 0
        for r in records:
            student_id = r.get('student_id')
            try:
                status_id = int(r.get('status_id'))
            except (TypeError, ValueError):
                continue
            if status_id not in valid_status_ids:
                continue
            student = students.get(student_id)
            TransportAttendance.objects.update_or_create(
                student_id=student_id, date=date, trip_type=trip_type,
                defaults={
                    'route_id': route_id,
                    'status_id': status_id,
                    'student_name': student.student_name if student else '',
                    'marked_by': request.user.id,
                },
            )
            saved += 1

        return Response({'detail': f'Attendance saved for {saved} student(s).', 'saved': saved})


class BuswiseStudentCountView(APIView):
    permission_classes = [IsSchoolStaff]

    def get(self, request):
        session_year = request.query_params.get('session_year') or current_session_year() or ''
        data = (
            StudentTransport.objects
            .filter(status='active', session_year=session_year)
            .values('route__vehicle__bus_no', 'route__name')
            .annotate(student_count=Count('id'))
        )
        return Response(list(data))


class VehiclePartListCreateView(generics.ListCreateAPIView):
    serializer_class = VehiclePartSerializer
    permission_classes = [IsSchoolAdmin]

    def get_queryset(self):
        qs = VehiclePart.objects.select_related('vehicle')
        if self.request.query_params.get('vehicle_id'):
            qs = qs.filter(vehicle_id=self.request.query_params['vehicle_id'])
        return qs


class RouteDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = RouteSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = Route.objects.all()


class StopDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = StopSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = Stop.objects.all()


class StudentTransportDetailView(SessionScopedMixin, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = StudentTransportSerializer
    permission_classes = [IsSchoolStaff]
    queryset = StudentTransport.objects.all()


class VehiclePartDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = VehiclePartSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = VehiclePart.objects.all()


class TransportDashboardView(APIView):
    permission_classes = [IsSchoolStaff]

    def get(self, request):
        session_year = request.query_params.get('session_year') or current_session_year() or ''
        total_using = StudentTransport.objects.filter(status='active', session_year=session_year).count()
        total_vehicles = Vehicle.objects.filter(status='active').count()
        total_routes = Route.objects.filter(is_active=True).count()
        return Response({
            'total_students_using_transport': total_using,
            'active_vehicles': total_vehicles,
            'active_routes': total_routes,
        })


class ApplyTransportView(APIView):
    """Toggle transport for a student from their profile.

    apply=False -> deactivates any active StudentTransport record and zeroes
    out all tp_{month} columns (no more transport dues going forward).
    apply=True  -> requires stop_id + effective_month. Creates/updates the
    StudentTransport record (route auto-derived from the stop) AND writes the
    stop's monthly_fee into the student's dedicated tp_{month} columns
    (StudentFeeDetail) from effective_month through March — same split
    convention as a class change. These columns are independent of the
    class's regular fee heads, so no 'Transport' FeeAmount entry is needed.
    """
    permission_classes = [IsSchoolStaff]

    def post(self, request):
        from apps.masters.models import Student
        from apps.fees.views import MONTH_COLUMNS
        from apps.fees.models import StudentFeeDetail

        student_id = request.data.get('student_id')
        if not student_id:
            return Response({'detail': 'student_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            student = Student.objects.get(id=student_id)
        except Student.DoesNotExist:
            return Response({'detail': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)

        apply_transport = bool(request.data.get('apply'))

        if not apply_transport:
            StudentTransport.objects.filter(
                student_id=student.id, session_year=student.session, status='active'
            ).update(status='inactive')
            detail = StudentFeeDetail.objects.filter(stu_id=student.id, session=student.session).first()
            if detail:
                for m in MONTH_COLUMNS:
                    setattr(detail, f'tp_{m}', 0)
                detail.save()
            return Response({'detail': 'Transport removed for this student.', 'applied': False})

        stop_id = request.data.get('stop_id')
        effective_month = request.data.get('effective_month')
        if not stop_id or not effective_month:
            return Response({'detail': 'stop_id and effective_month are required.'}, status=status.HTTP_400_BAD_REQUEST)
        if effective_month not in MONTH_COLUMNS:
            return Response({'detail': 'Invalid effective_month.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            stop = Stop.objects.select_related('route').get(id=stop_id)
        except Stop.DoesNotExist:
            return Response({'detail': 'Stop not found'}, status=status.HTTP_404_NOT_FOUND)

        # Deactivate any prior assignment, then record the new one.
        StudentTransport.objects.filter(
            student_id=student.id, session_year=student.session, status='active'
        ).update(status='inactive')

        start_idx = MONTH_COLUMNS.index(effective_month)
        start_date_year_offset = 0 if start_idx < 9 else 1  # Apr=0..Dec=8 same calendar year; Jan-Mar next year
        from datetime import date
        session_start_year = int(student.session.split('-')[0])
        start_date = date(session_start_year + start_date_year_offset, [4,5,6,7,8,9,10,11,12,1,2,3][start_idx], 1)

        transport = StudentTransport.objects.create(
            student_id=student.id, student_name=student.student_name,
            route=stop.route, stop=stop, session_year=student.session,
            start_date=start_date, status='active',
        )

        detail, _ = StudentFeeDetail.objects.get_or_create(stu_id=student.id, session=student.session)
        for m in MONTH_COLUMNS[:start_idx]:
            setattr(detail, f'tp_{m}', 0)
        for m in MONTH_COLUMNS[start_idx:]:
            setattr(detail, f'tp_{m}', stop.monthly_fee)
        detail.save()

        return Response({
            'detail': f'Transport applied — Route {stop.route.name}, Stop {stop.name}.',
            'applied': True,
            'transport': StudentTransportSerializer(transport).data,
            'monthly_fee': float(stop.monthly_fee),
        }, status=status.HTTP_201_CREATED)


class TransportStudentListView(APIView):
    """Students currently using transport. Supports optional filters for
    vehicle (bus), route, stop, class, and section — this one endpoint
    powers the 'Using Transport', 'Bus-wise List', 'Route-wise List', and
    'Stop-wise List' report pages (same data, just a different primary
    filter emphasized on each page)."""
    permission_classes = [IsSchoolStaff]

    def get(self, request):
        from apps.masters.models import Student
        from apps.fees.views import resolve_student_class_section

        params = request.query_params
        session = params.get('session') or current_session_year()

        qs = StudentTransport.objects.filter(status='active').select_related('route', 'route__vehicle', 'stop')
        if session:
            qs = qs.filter(session_year=session)
        if params.get('vehicle_id'):
            qs = qs.filter(route__vehicle_id=params['vehicle_id'])
        if params.get('route_id'):
            qs = qs.filter(route_id=params['route_id'])
        if params.get('stop_id'):
            qs = qs.filter(stop_id=params['stop_id'])

        students_qs = Student.objects.filter(status='active')
        if session:
            students_qs = students_qs.filter(session=session)
        if params.get('class_name'):
            students_qs = students_qs.filter(class_name=params['class_name'])
        if params.get('section'):
            students_qs = students_qs.filter(section=params['section'])
        students = {s.id: s for s in students_qs}

        rows = []
        for t in qs.order_by('student_name'):
            student = students.get(t.student_id)
            if not student:
                continue
            resolved_class, resolved_section = resolve_student_class_section(student)
            rows.append({
                'student_id': student.id,
                'admission_no': student.admission_no,
                'student_name': student.student_name,
                'class_name': resolved_class,
                'section': resolved_section,
                'route_id': t.route_id,
                'route_name': t.route.name,
                'bus_no': t.route.vehicle.bus_no if t.route.vehicle_id else None,
                'stop_id': t.stop_id,
                'stop_name': t.stop.name,
                'monthly_fee': float(t.stop.monthly_fee),
                'start_date': t.start_date,
            })
        return Response(rows)


class StudentsNotUsingTransportView(APIView):
    """Active students with no active StudentTransport record this session
    — filterable by class and section."""
    permission_classes = [IsSchoolStaff]

    def get(self, request):
        from apps.masters.models import Student
        from apps.fees.views import resolve_student_class_section

        params = request.query_params
        session = params.get('session') or current_session_year()

        students_qs = Student.objects.filter(status='active')
        if session:
            students_qs = students_qs.filter(session=session)
        if params.get('class_name'):
            students_qs = students_qs.filter(class_name=params['class_name'])
        if params.get('section'):
            students_qs = students_qs.filter(section=params['section'])

        using_qs = StudentTransport.objects.filter(status='active')
        if session:
            using_qs = using_qs.filter(session_year=session)
        using_ids = set(using_qs.values_list('student_id', flat=True))

        rows = []
        for student in students_qs.order_by('student_name')[:1000]:
            if student.id in using_ids:
                continue
            resolved_class, resolved_section = resolve_student_class_section(student)
            rows.append({
                'student_id': student.id,
                'admission_no': student.admission_no,
                'student_name': student.student_name,
                'class_name': resolved_class,
                'section': resolved_section,
                'father_mobile': student.father_mobile,
            })
        return Response(rows)


def next_session_string(session_year):
    """'2026-2027' -> '2027-2028'. Used by Promote Student to compute the
    upcoming session without requiring it to be picked manually."""
    if not session_year or '-' not in session_year:
        return None
    try:
        start, end = session_year.split('-')
        return f'{int(start) + 1}-{int(end) + 1}'
    except ValueError:
        return None


class PromoteTransportView(APIView):
    """Transport tab of Promote Student — compares the current session's
    Vehicles/Routes/Stops against the next session's, and clones them
    forward on demand. Vehicle/Route are session-scoped; Stop has no
    session column of its own, so it's read/cloned via its route."""
    permission_classes = [IsSchoolAdmin]

    def get(self, request):
        current_session = current_session_year()
        next_session = next_session_string(current_session)
        if not current_session or not next_session:
            return Response({'detail': 'No active session.'}, status=status.HTTP_400_BAD_REQUEST)

        def serialize(session):
            vehicles = Vehicle.objects.filter(session=session)
            routes = Route.objects.filter(session=session).select_related('vehicle')
            stops = Stop.objects.filter(route__session=session).select_related('route')
            return {
                'vehicles': [
                    {'id': v.id, 'bus_no': v.bus_no, 'registration_no': v.registration_no, 'capacity': v.capacity, 'status': v.status}
                    for v in vehicles
                ],
                'routes': [
                    {'id': r.id, 'name': r.name, 'code': r.code, 'bus_no': r.vehicle.bus_no if r.vehicle_id else None}
                    for r in routes
                ],
                'stops': [
                    {'id': s.id, 'name': s.name, 'route_name': s.route.name, 'monthly_fee': float(s.monthly_fee)}
                    for s in stops
                ],
            }

        return Response({
            'current_session': current_session,
            'next_session': next_session,
            'current': serialize(current_session),
            'next': serialize(next_session),
        })

    def post(self, request):
        current_session = current_session_year()
        next_session = next_session_string(current_session)
        if not current_session or not next_session:
            return Response({'detail': 'No active session.'}, status=status.HTTP_400_BAD_REQUEST)

        if Vehicle.objects.filter(session=next_session).exists() or Route.objects.filter(session=next_session).exists():
            return Response(
                {'detail': f'Transport setup already exists for {next_session}. Remove it first if you want to re-clone.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        vehicle_map = {}
        for v in Vehicle.objects.filter(session=current_session):
            clone = Vehicle.objects.create(
                bus_no=v.bus_no, registration_no=v.registration_no,
                vehicle_make_id=v.vehicle_make_id, vehicle_model_id=v.vehicle_model_id,
                capacity=v.capacity, driver_name=v.driver_name, driver_phone=v.driver_phone,
                conductor_name=v.conductor_name, conductor_phone=v.conductor_phone,
                fitness_expiry=v.fitness_expiry, insurance_expiry=v.insurance_expiry,
                status=v.status, session=next_session,
            )
            vehicle_map[v.id] = clone.id

        route_map = {}
        for r in Route.objects.filter(session=current_session):
            clone = Route.objects.create(
                name=r.name, code=r.code,
                vehicle_id=vehicle_map.get(r.vehicle_id), is_active=r.is_active, session=next_session,
            )
            route_map[r.id] = clone.id

        stop_count = 0
        for s in Stop.objects.filter(route__session=current_session):
            new_route_id = route_map.get(s.route_id)
            if not new_route_id:
                continue
            Stop.objects.create(
                name=s.name, route_id=new_route_id, order=s.order,
                monthly_fee=s.monthly_fee, pickup_time=s.pickup_time, drop_time=s.drop_time,
            )
            stop_count += 1

        return Response({
            'detail': f'Transport setup cloned from {current_session} to {next_session}.',
            'vehicles_cloned': len(vehicle_map),
            'routes_cloned': len(route_map),
            'stops_cloned': stop_count,
        })

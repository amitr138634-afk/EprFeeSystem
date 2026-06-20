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


class VehicleListCreateView(generics.ListCreateAPIView):
    serializer_class = VehicleSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = Vehicle.objects.all()


class VehicleDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = VehicleSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = Vehicle.objects.all()


class RouteListCreateView(generics.ListCreateAPIView):
    serializer_class = RouteSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = Route.objects.prefetch_related('stops').filter(is_active=True)


class StopListCreateView(generics.ListCreateAPIView):
    serializer_class = StopSerializer
    permission_classes = [IsSchoolAdmin]

    def get_queryset(self):
        qs = Stop.objects.select_related('route')
        if self.request.query_params.get('route_id'):
            qs = qs.filter(route_id=self.request.query_params['route_id'])
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

    apply=False -> deactivates any active StudentTransport record.
    apply=True  -> requires stop_id + effective_month. Creates/updates the
    StudentTransport record (route auto-derived from the stop) AND writes the
    stop's monthly_fee into the student's 'Transport' fee head (StudentFeeDetail)
    from effective_month through March — same split convention as a class
    change. Requires a FeeAmount row named 'Transport' for the student's
    class+session (reserves the head_number slot); if missing, the request
    fails with a clear message rather than guessing a slot.
    """
    permission_classes = [IsSchoolStaff]

    def post(self, request):
        from apps.masters.models import Student
        from apps.fees.views import (
            get_class_master_for_student, get_class_fee_amounts,
            find_transport_head_number, MONTH_COLUMNS, MONTH_FULL_FIELD,
        )
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

        class_master = get_class_master_for_student(student)
        head_number = find_transport_head_number(class_master, student.session)
        if not head_number:
            return Response(
                {'detail': "No 'Transport' fee head is configured for this student's class. "
                           "Define a Fee Amount entry named 'Transport' for this class first."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Deactivate any prior assignment, then record the new one.
        StudentTransport.objects.filter(
            student_id=student.id, session_year=student.session, status='active'
        ).update(status='inactive')

        start_idx = MONTH_COLUMNS.index(effective_month)
        start_date_year_offset = 0 if start_idx < 9 else 1  # Apr=0..Dec=8 same calendar year; Jan-Mar next year
        from datetime import date
        from utils.session import current_session_year
        session_start_year = int(student.session.split('-')[0])
        start_date = date(session_start_year + start_date_year_offset, [4,5,6,7,8,9,10,11,12,1,2,3][start_idx], 1)

        transport = StudentTransport.objects.create(
            student_id=student.id, student_name=student.student_name,
            route=stop.route, stop=stop, session_year=student.session,
            start_date=start_date, status='active',
        )

        detail, _ = StudentFeeDetail.objects.get_or_create(stu_id=student.id, session=student.session)
        for m in MONTH_COLUMNS[start_idx:]:
            setattr(detail, f'head{head_number}_{m}', stop.monthly_fee)
        detail.save()

        return Response({
            'detail': f'Transport applied — Route {stop.route.name}, Stop {stop.name}.',
            'applied': True,
            'transport': StudentTransportSerializer(transport).data,
            'monthly_fee': float(stop.monthly_fee),
            'head_number': head_number,
        }, status=status.HTTP_201_CREATED)

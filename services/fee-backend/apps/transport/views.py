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

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Staff, Department, Designation, Shift, LeaveType, LeaveRequest
from .serializers import (
    StaffSerializer, StaffListSerializer, DepartmentSerializer,
    DesignationSerializer, ShiftSerializer, LeaveTypeSerializer, LeaveRequestSerializer
)
from utils.permissions import IsSchoolAdmin, IsSchoolStaff


class DepartmentListCreateView(generics.ListCreateAPIView):
    serializer_class = DepartmentSerializer
    permission_classes = [IsSchoolStaff]
    queryset = Department.objects.all()


class DesignationListCreateView(generics.ListCreateAPIView):
    serializer_class = DesignationSerializer
    permission_classes = [IsSchoolStaff]

    def get_queryset(self):
        qs = Designation.objects.all()
        dept_id = self.request.query_params.get('department_id')
        if dept_id:
            qs = qs.filter(department_id=dept_id)
        return qs


class StaffListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsSchoolStaff]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return StaffSerializer
        return StaffListSerializer

    def get_queryset(self):
        qs = Staff.objects.select_related('department', 'designation')
        params = self.request.query_params
        if params.get('department_id'):
            qs = qs.filter(department_id=params['department_id'])
        if params.get('staff_type'):
            qs = qs.filter(staff_type=params['staff_type'])
        if params.get('status'):
            qs = qs.filter(status=params['status'])
        if params.get('search'):
            from django.db.models import Q
            q = params['search']
            qs = qs.filter(
                Q(first_name__icontains=q) | Q(last_name__icontains=q) |
                Q(employee_id__icontains=q) | Q(email__icontains=q)
            )
        return qs


class StaffDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = StaffSerializer
    permission_classes = [IsSchoolStaff]
    queryset = Staff.objects.all()


class ShiftListCreateView(generics.ListCreateAPIView):
    serializer_class = ShiftSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = Shift.objects.all()


class LeaveTypeListCreateView(generics.ListCreateAPIView):
    serializer_class = LeaveTypeSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = LeaveType.objects.all()


class LeaveRequestListCreateView(generics.ListCreateAPIView):
    serializer_class = LeaveRequestSerializer
    permission_classes = [IsSchoolStaff]

    def get_queryset(self):
        qs = LeaveRequest.objects.select_related('staff', 'leave_type')
        params = self.request.query_params
        if params.get('staff_id'):
            qs = qs.filter(staff_id=params['staff_id'])
        if params.get('status'):
            qs = qs.filter(status=params['status'])
        return qs


class LeaveRequestApproveView(APIView):
    permission_classes = [IsSchoolAdmin]

    def post(self, request, pk):
        try:
            leave = LeaveRequest.objects.get(pk=pk)
            action = request.data.get('action')
            if action in ('approve', 'reject'):
                leave.status = 'approved' if action == 'approve' else 'rejected'
                leave.save()
                return Response(LeaveRequestSerializer(leave).data)
            return Response({'detail': 'Invalid action.'}, status=status.HTTP_400_BAD_REQUEST)
        except LeaveRequest.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Visitor, ShortLeave, Feedback, AuthorisedPerson, HRMLetter
from .serializers import (
    VisitorSerializer, ShortLeaveSerializer, FeedbackSerializer,
    AuthorisedPersonSerializer, HRMLetterSerializer
)
from utils.permissions import IsSchoolStaff, IsSchoolAdmin


class VisitorListCreateView(generics.ListCreateAPIView):
    serializer_class = VisitorSerializer
    permission_classes = [IsSchoolStaff]

    def get_queryset(self):
        qs = Visitor.objects.all()
        params = self.request.query_params
        if params.get('date'):
            qs = qs.filter(visit_date=params['date'])
        if params.get('search'):
            from django.db.models import Q
            q = params['search']
            qs = qs.filter(Q(name__icontains=q) | Q(phone__icontains=q))
        return qs


class VisitorDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = VisitorSerializer
    permission_classes = [IsSchoolStaff]
    queryset = Visitor.objects.all()


class ShortLeaveListCreateView(generics.ListCreateAPIView):
    serializer_class = ShortLeaveSerializer
    permission_classes = [IsSchoolStaff]

    def get_queryset(self):
        qs = ShortLeave.objects.all()
        params = self.request.query_params
        if params.get('date'):
            qs = qs.filter(leave_date=params['date'])
        if params.get('student_id'):
            qs = qs.filter(student_id=params['student_id'])
        return qs


class ShortLeaveApproveView(APIView):
    permission_classes = [IsSchoolAdmin]

    def post(self, request, pk):
        try:
            leave = ShortLeave.objects.get(pk=pk)
            action = request.data.get('action')
            if action in ('approve', 'reject'):
                leave.status = 'approved' if action == 'approve' else 'rejected'
                leave.authorized_by = request.user.full_name
                leave.save()
                return Response(ShortLeaveSerializer(leave).data)
            return Response({'detail': 'Invalid action.'}, status=status.HTTP_400_BAD_REQUEST)
        except ShortLeave.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)


class FeedbackListCreateView(generics.ListCreateAPIView):
    serializer_class = FeedbackSerializer
    permission_classes = [IsSchoolStaff]

    def get_queryset(self):
        qs = Feedback.objects.all()
        if self.request.query_params.get('status'):
            qs = qs.filter(status=self.request.query_params['status'])
        return qs


class FeedbackDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = FeedbackSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = Feedback.objects.all()


class AuthorisedPersonListCreateView(generics.ListCreateAPIView):
    serializer_class = AuthorisedPersonSerializer
    permission_classes = [IsSchoolStaff]

    def get_queryset(self):
        qs = AuthorisedPerson.objects.filter(is_active=True)
        if self.request.query_params.get('student_id'):
            qs = qs.filter(student_id=self.request.query_params['student_id'])
        return qs


class HRMLetterListCreateView(generics.ListCreateAPIView):
    serializer_class = HRMLetterSerializer
    permission_classes = [IsSchoolAdmin]

    def get_queryset(self):
        qs = HRMLetter.objects.all()
        if self.request.query_params.get('staff_id'):
            qs = qs.filter(staff_id=self.request.query_params['staff_id'])
        return qs

    def perform_create(self, serializer):
        serializer.save(issued_by=self.request.user.id)

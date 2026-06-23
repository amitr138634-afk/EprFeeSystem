from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Visitor, ShortLeave, Feedback, AuthorisedPerson, HRMLetter, HRMCandidate
from .serializers import (
    VisitorSerializer, ShortLeaveSerializer, FeedbackSerializer,
    AuthorisedPersonSerializer, HRMLetterSerializer, HRMCandidateSerializer
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


class AuthorisedPersonDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AuthorisedPersonSerializer
    permission_classes = [IsSchoolStaff]
    queryset = AuthorisedPerson.objects.all()


class HRMLetterDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = HRMLetterSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = HRMLetter.objects.all()


class HRMCandidateListCreateView(generics.ListCreateAPIView):
    """List HRM / Add HRM. ?interview_status=scheduled narrows the list to
    candidates with an interview scheduled — used by the Add Letter page."""
    serializer_class = HRMCandidateSerializer
    permission_classes = [IsSchoolStaff]

    def get_queryset(self):
        qs = HRMCandidate.objects.all()
        params = self.request.query_params
        if params.get('interview_status'):
            qs = qs.filter(interview_status=params['interview_status'])
        if params.get('search'):
            from django.db.models import Q
            q = params['search']
            qs = qs.filter(Q(full_name__icontains=q) | Q(mobile__icontains=q))
        return qs


class HRMCandidateDetailView(generics.RetrieveUpdateDestroyAPIView):
    """PATCH is used both by List HRM (interview_status) and Add Letter
    (decision) to update just that one field per row."""
    serializer_class = HRMCandidateSerializer
    permission_classes = [IsSchoolStaff]
    queryset = HRMCandidate.objects.all()


class ShortLeaveDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ShortLeaveSerializer
    permission_classes = [IsSchoolStaff]
    queryset = ShortLeave.objects.all()


class EnquiryDashboardView(APIView):
    permission_classes = [IsSchoolStaff]

    def get(self, request):
        from apps.students.models import NewAdmission
        from django.db.models import Count

        counts = NewAdmission.objects.values('status').annotate(count=Count('id'))
        result = {row['status']: row['count'] for row in counts}
        total = sum(result.values())
        return Response({
            'total': total,
            'enquiry': result.get('enquiry', 0),
            'applied': result.get('applied', 0),
            'admitted': result.get('admitted', 0),
            'cancelled': result.get('cancelled', 0),
        })

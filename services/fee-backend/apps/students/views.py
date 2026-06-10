from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from .models import NewAdmission, EnquiryFollowUp, PromotionRecord
from .serializers import NewAdmissionSerializer, EnquiryFollowUpSerializer, PromotionRecordSerializer
from utils.permissions import IsSchoolAdmin, IsSchoolStaff


class NewAdmissionListCreateView(generics.ListCreateAPIView):
    serializer_class = NewAdmissionSerializer
    permission_classes = [IsSchoolStaff]

    def get_queryset(self):
        qs = NewAdmission.objects.all().order_by('-enquiry_date')
        params = self.request.query_params
        if params.get('status'):
            qs = qs.filter(status=params['status'])
        if params.get('session_year'):
            qs = qs.filter(session_year=params['session_year'])
        if params.get('search'):
            q = params['search']
            qs = qs.filter(
                Q(first_name__icontains=q) | Q(last_name__icontains=q) |
                Q(father_name__icontains=q) | Q(phone__icontains=q)
            )
        return qs


class NewAdmissionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = NewAdmissionSerializer
    permission_classes = [IsSchoolStaff]
    queryset = NewAdmission.objects.all()


class EnquiryFollowUpView(generics.ListCreateAPIView):
    serializer_class = EnquiryFollowUpSerializer
    permission_classes = [IsSchoolStaff]

    def get_queryset(self):
        qs = EnquiryFollowUp.objects.all()
        if self.request.query_params.get('admission_id'):
            qs = qs.filter(admission_id=self.request.query_params['admission_id'])
        return qs


class PromotionView(APIView):
    permission_classes = [IsSchoolAdmin]

    def post(self, request):
        records = request.data.get('students', [])
        created = []
        for r in records:
            record = PromotionRecord.objects.create(
                student_id=r['student_id'],
                from_class=r['from_class'],
                from_section=r['from_section'],
                to_class=r['to_class'],
                to_section=r['to_section'],
                from_session=r['from_session'],
                to_session=r['to_session'],
                status=r.get('status', 'promoted'),
                promoted_by=request.user.id,
            )
            created.append(record)
        return Response({'detail': f'{len(created)} students processed.'})

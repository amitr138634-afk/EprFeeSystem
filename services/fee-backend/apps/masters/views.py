from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import ClassMaster, ClassSectionMaster
from .serializers import ClassMasterSerializer, ClassSectionMasterSerializer
from utils.permissions import IsSchoolAdmin


class ClassMasterListCreateView(generics.ListCreateAPIView):
    serializer_class = ClassMasterSerializer
    permission_classes = [IsSchoolAdmin]

    def get_queryset(self):
        qs = ClassMaster.objects.all()
        session = self.request.query_params.get('session')
        if session:
            qs = qs.filter(session=session)
        return qs


class ClassMasterDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ClassMasterSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = ClassMaster.objects.all()


class ClassMasterToggleStatusView(APIView):
    permission_classes = [IsSchoolAdmin]

    def post(self, request, pk):
        try:
            class_obj = ClassMaster.objects.get(pk=pk)
            class_obj.status = not class_obj.status
            class_obj.save()
            return Response({
                'id': class_obj.id,
                'status': class_obj.status,
                'message': f'Class {"activated" if class_obj.status else "deactivated"} successfully'
            })
        except ClassMaster.DoesNotExist:
            return Response({'detail': 'Class not found.'}, status=status.HTTP_404_NOT_FOUND)


class ClassSectionMasterListCreateView(generics.ListCreateAPIView):
    serializer_class = ClassSectionMasterSerializer
    permission_classes = [IsSchoolAdmin]

    def get_queryset(self):
        qs = ClassSectionMaster.objects.select_related('class_master')
        class_id = self.request.query_params.get('class_id')
        session = self.request.query_params.get('session')
        if class_id:
            qs = qs.filter(class_master_id=class_id)
        if session:
            qs = qs.filter(session=session)
        return qs


class ClassSectionMasterDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ClassSectionMasterSerializer
    permission_classes = [IsSchoolAdmin]
    queryset = ClassSectionMaster.objects.all()


class ClassSectionMasterToggleStatusView(APIView):
    permission_classes = [IsSchoolAdmin]

    def post(self, request, pk):
        try:
            section_obj = ClassSectionMaster.objects.get(pk=pk)
            section_obj.status = not section_obj.status
            section_obj.save()
            return Response({
                'id': section_obj.id,
                'status': section_obj.status,
                'message': f'Section {"activated" if section_obj.status else "deactivated"} successfully'
            })
        except ClassSectionMaster.DoesNotExist:
            return Response({'detail': 'Section not found.'}, status=status.HTTP_404_NOT_FOUND)

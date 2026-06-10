from rest_framework import serializers
from .models import NewAdmission, EnquiryFollowUp, PromotionRecord


class NewAdmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewAdmission
        fields = '__all__'
        read_only_fields = ['id', 'enquiry_date']


class EnquiryFollowUpSerializer(serializers.ModelSerializer):
    class Meta:
        model = EnquiryFollowUp
        fields = '__all__'
        read_only_fields = ['id', 'created_at']


class PromotionRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromotionRecord
        fields = '__all__'
        read_only_fields = ['id', 'promoted_at']

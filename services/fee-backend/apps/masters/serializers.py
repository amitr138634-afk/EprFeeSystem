from rest_framework import serializers
from .models import (
    ClassMaster, ClassSectionMaster, SectionMaster, SessionMaster, Student,
    HouseMaster, BloodGroupMaster, SchoolMaster,
    CategoryMaster, ReligionMaster, CasteMaster, AttendanceMaster,
    CertificateMaster, StudentCertificate,
)


class ClassMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassMaster
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class SectionMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = SectionMaster
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class ClassSectionMasterSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='class_master.class_name', read_only=True)
    section_name = serializers.CharField(source='section_master.section', read_only=True)

    class Meta:
        model = ClassSectionMaster
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class SessionMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = SessionMaster
        fields = ['id', 'session_year', 'status', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_session_year(self, value):
        # Validate format: YYYY-YYYY
        if len(value) != 9 or value[4] != '-':
            raise serializers.ValidationError('Session year format should be YYYY-YYYY (e.g., 2024-2025)')

        try:
            start_year = int(value[:4])
            end_year = int(value[5:])
            if end_year != start_year + 1:
                raise serializers.ValidationError('End year should be start year + 1')
        except ValueError:
            raise serializers.ValidationError('Invalid year format')

        return value


class HouseMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = HouseMaster
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class BloodGroupMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = BloodGroupMaster
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class SchoolMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = SchoolMaster
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class CategoryMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoryMaster
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class ReligionMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReligionMaster
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class CasteMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = CasteMaster
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class AttendanceMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceMaster
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class CertificateMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = CertificateMaster
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class StudentCertificateSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentCertificate
        fields = '__all__'
        read_only_fields = ['id', 'uploaded_at']


class StudentDetailSerializer(serializers.ModelSerializer):
    """Full editable Student record — backs the 'Complete Detail' form.
    `class_name` changes are detected by the view (StudentDetailUpdateView),
    which requires an `effective_month` and splits the fee structure
    accordingly; this serializer just persists the field values."""

    class Meta:
        model = Student
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


from rest_framework import serializers
from .models import ClassMaster, ClassSectionMaster, SectionMaster, SessionMaster


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


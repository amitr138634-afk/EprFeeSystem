from rest_framework import serializers
from .models import Student, ClassMaster, ClassSectionMaster, SessionMaster


class ClassSectionMasterSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='class_master.class_name', read_only=True)

    class Meta:
        model = ClassSectionMaster
        fields = ['id', 'class_master', 'class_name', 'section_name', 'status', 'session']


class ClassMasterSerializer(serializers.ModelSerializer):
    sections = ClassSectionMasterSerializer(many=True, read_only=True)

    class Meta:
        model = ClassMaster
        fields = ['id', 'class_name', 'status', 'session', 'sections']


class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class StudentListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = [
            'id', 'admission_no', 'student_name', 'class_name', 'section',
            'gender', 'father_name', 'father_mobile', 'status', 'admission_date', 'session', 'type'
        ]


class ClassStrengthSerializer(serializers.Serializer):
    class_name = serializers.CharField()
    total = serializers.IntegerField()
    boys = serializers.IntegerField()
    girls = serializers.IntegerField()


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


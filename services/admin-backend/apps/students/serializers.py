from rest_framework import serializers
from .models import Student, ClassMaster, ClassSectionMaster, SessionMaster
from .utils import resolve_student_class_section


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
    # class_name/section remain raw ClassMaster/SectionMaster ids (writable, used by edit forms).
    # These extra fields expose the resolved display names alongside them.
    class_display_name = serializers.SerializerMethodField()
    section_display_name = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_class_display_name(self, obj):
        return resolve_student_class_section(obj)[0]

    def get_section_display_name(self, obj):
        return resolve_student_class_section(obj)[1]


class StudentListSerializer(serializers.ModelSerializer):
    # Read-only listing — class_name/section show resolved display names, not raw ids.
    class_name = serializers.SerializerMethodField()
    section = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            'id', 'admission_no', 'student_name', 'class_name', 'section',
            'gender', 'father_name', 'father_mobile', 'status', 'admission_date', 'session', 'type'
        ]

    def get_class_name(self, obj):
        return resolve_student_class_section(obj)[0]

    def get_section(self, obj):
        return resolve_student_class_section(obj)[1]


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


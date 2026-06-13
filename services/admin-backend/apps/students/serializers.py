from rest_framework import serializers
from .models import Student, Class, Section, ClassMaster, ClassSectionMaster


class SectionSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='class_ref.name', read_only=True)

    class Meta:
        model = Section
        fields = '__all__'


class ClassSerializer(serializers.ModelSerializer):
    sections = SectionSerializer(many=True, read_only=True)

    class Meta:
        model = Class
        fields = ['id', 'name', 'order', 'sections']


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
    full_name = serializers.ReadOnlyField()
    class_name = serializers.CharField(source='class_ref.name', read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True)

    class Meta:
        model = Student
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class StudentListSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    class_name = serializers.CharField(source='class_ref.name', read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True)

    class Meta:
        model = Student
        fields = [
            'id', 'admission_no', 'roll_no', 'full_name', 'first_name', 'last_name',
            'class_name', 'section_name', 'gender', 'father_name', 'father_phone',
            'photo', 'status', 'admission_date'
        ]


class ClassStrengthSerializer(serializers.Serializer):
    class_name = serializers.CharField()
    section_name = serializers.CharField()
    total = serializers.IntegerField()
    boys = serializers.IntegerField()
    girls = serializers.IntegerField()

from rest_framework import serializers
from .models import Subject, Period, Timetable, SubstituteTeacher


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = '__all__'


class PeriodSerializer(serializers.ModelSerializer):
    class Meta:
        model = Period
        fields = '__all__'


class TimetableSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.full_name', read_only=True)
    period_name = serializers.CharField(source='period.name', read_only=True)
    period_time = serializers.SerializerMethodField()
    class_name = serializers.CharField(source='class_ref.name', read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True)

    class Meta:
        model = Timetable
        fields = '__all__'

    def get_period_time(self, obj):
        return f'{obj.period.start_time} - {obj.period.end_time}'


class SubstituteTeacherSerializer(serializers.ModelSerializer):
    original_teacher_name = serializers.CharField(source='original_teacher.full_name', read_only=True)
    substitute_teacher_name = serializers.CharField(source='substitute_teacher.full_name', read_only=True)

    class Meta:
        model = SubstituteTeacher
        fields = '__all__'
        read_only_fields = ['id', 'created_at']

from rest_framework import serializers
from .models import Subject, Period, Timetable, SubstituteTeacher
from apps.students.models import ClassSectionMaster


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ['id', 'name', 'status', 'session', 'created_at', 'updated_at']
        read_only_fields = ['id', 'session', 'created_at', 'updated_at']


class PeriodSerializer(serializers.ModelSerializer):
    duration_minutes = serializers.ReadOnlyField()
    
    class Meta:
        model = Period
        fields = ['id', 'name', 'start_time', 'end_time', 'period_order', 'is_break', 'status', 'duration_minutes', 'created_at', 'updated_at']
        read_only_fields = ['id', 'duration_minutes', 'created_at', 'updated_at']


class TimetableSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.full_name', read_only=True)
    period_name = serializers.CharField(source='period.name', read_only=True)
    period_time = serializers.SerializerMethodField()
    class_name = serializers.CharField(source='class_ref.class_name', read_only=True)
    section_names = serializers.SerializerMethodField()
    sections_list = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=ClassSectionMaster.objects.all(),
        source='sections',
        write_only=True,
        required=False
    )

    class Meta:
        model = Timetable
        fields = ['id', 'class_ref', 'sections', 'sections_list', 'day', 'period', 'subject', 'teacher', 
                  'room', 'session_year', 'subject_name', 'teacher_name', 'period_name', 
                  'period_time', 'class_name', 'section_names']
        read_only_fields = ['id']

    def get_period_time(self, obj):
        return f'{obj.period.start_time} - {obj.period.end_time}'
    
    def get_section_names(self, obj):
        return [s.section_name for s in obj.sections.all()]
    
    def create(self, validated_data):
        sections = validated_data.pop('sections', [])
        timetable = Timetable.objects.create(**validated_data)
        if sections:
            timetable.sections.set(sections)
        return timetable
    
    def update(self, instance, validated_data):
        sections = validated_data.pop('sections', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if sections is not None:
            instance.sections.set(sections)
        return instance


class SubstituteTeacherSerializer(serializers.ModelSerializer):
    original_teacher_name = serializers.CharField(source='original_teacher.full_name', read_only=True)
    substitute_teacher_name = serializers.CharField(source='substitute_teacher.full_name', read_only=True)
    timetable_details = serializers.SerializerMethodField()

    class Meta:
        model = SubstituteTeacher
        fields = '__all__'
        read_only_fields = ['id', 'created_at']
    
    def get_timetable_details(self, obj):
        """Get class, period, subject details from timetable"""
        if obj.timetable:
            return {
                'class_name': obj.timetable.class_ref.class_name,
                'period_name': obj.timetable.period.name,
                'period_time': f"{obj.timetable.period.start_time} - {obj.timetable.period.end_time}",
                'subject_name': obj.timetable.subject.name if obj.timetable.subject else '-',
                'day': obj.timetable.get_day_display()
            }
        return None

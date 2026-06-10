from rest_framework import serializers
from .models import ExamType, SubjectAllocation, StudentSubject, Marks, RemarkMaster, SignatureMaster, GradeScale


class ExamTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamType
        fields = '__all__'


class SubjectAllocationSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.full_name', read_only=True)
    class_name = serializers.CharField(source='class_ref.name', read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True)

    class Meta:
        model = SubjectAllocation
        fields = '__all__'


class StudentSubjectSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)

    class Meta:
        model = StudentSubject
        fields = '__all__'


class MarksSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    exam_type_name = serializers.CharField(source='exam_type.name', read_only=True)
    max_marks = serializers.DecimalField(source='exam_type.max_marks', max_digits=5, decimal_places=2, read_only=True)

    class Meta:
        model = Marks
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class RemarkMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = RemarkMaster
        fields = '__all__'


class SignatureMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = SignatureMaster
        fields = '__all__'


class GradeScaleSerializer(serializers.ModelSerializer):
    class Meta:
        model = GradeScale
        fields = '__all__'

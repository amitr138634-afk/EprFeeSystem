from rest_framework import serializers
from .models import (
    ExamType, StudentSubject, Marks, RemarkMaster, SignatureMaster, GradeScale,
    Grade, Test, CoScholasticSubject,
)


class ExamTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamType
        fields = '__all__'


# NOTE: SubjectAllocationSerializer temporarily disabled - needs redesign
# class SubjectAllocationSerializer(serializers.ModelSerializer):
#     subject_name = serializers.CharField(source='subject.name', read_only=True)
#     teacher_name = serializers.CharField(source='teacher.full_name', read_only=True)
#     class_name = serializers.CharField(source='class_ref.name', read_only=True)
#     section_name = serializers.CharField(source='section.name', read_only=True)
#
#     class Meta:
#         model = SubjectAllocation
#         fields = '__all__'


class StudentSubjectSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)

    class Meta:
        model = StudentSubject
        fields = '__all__'


class MarksSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.student_name', read_only=True)
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


class GradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grade
        fields = '__all__'
        read_only_fields = ['id', 'session']

    def validate(self, data):
        grade_type = data.get('grade_type', getattr(self.instance, 'grade_type', 'marks_based'))
        min_marks = data.get('min_marks', getattr(self.instance, 'min_marks', None))
        max_marks = data.get('max_marks', getattr(self.instance, 'max_marks', None))

        if grade_type == 'marks_based':
            if min_marks is None or max_marks is None:
                raise serializers.ValidationError('Marks Based grades require both min and max marks.')
            if min_marks > max_marks:
                raise serializers.ValidationError('Min marks cannot be greater than max marks.')
        else:  # direct grade — marks must be null
            data['min_marks'] = None
            data['max_marks'] = None
        return data


class TestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Test
        fields = '__all__'
        read_only_fields = ['id', 'session']


class CoScholasticSubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoScholasticSubject
        fields = '__all__'
        read_only_fields = ['id', 'session']

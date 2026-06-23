from rest_framework import serializers
from .models import (
    ExamType, StudentSubject, Marks, Remark, SignatureMaster, GradeScale,
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


class RemarkSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='class_ref.class_name', read_only=True)
    # Read as a list of ints (parsed from the comma-separated section_ids
    # column) for the frontend's convenience; writes are handled in the view
    # since the underlying model field is a plain CharField, not a relation.
    section_ids = serializers.SerializerMethodField()
    sections = serializers.SerializerMethodField()

    class Meta:
        model = Remark
        fields = [
            'id', 'text', 'class_ref', 'class_name', 'sections', 'section_ids',
            'is_active', 'display_order', 'session',
        ]
        read_only_fields = ['id', 'session']

    def get_section_ids(self, obj):
        return obj.section_id_list()

    def get_sections(self, obj):
        from apps.students.models import ClassSectionMaster
        secs = ClassSectionMaster.objects.filter(id__in=obj.section_id_list()).select_related('section_master')
        return [{'id': s.id, 'section_name': s.section_name} for s in secs]


def class_teacher_for(class_id, section_id):
    """The Staff member assigned as class teacher for a class+section, or
    None. Resolved live (not stored) so a reassignment is reflected
    immediately wherever it's used."""
    from apps.staff.models import Staff
    if not (class_id and section_id):
        return None
    return (
        Staff.objects
        .filter(class_assigned_id=class_id, section_assigned_id=section_id, status='active')
        .order_by('id')
        .first()
    )


class SignatureMasterSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='class_ref.class_name', read_only=True)
    section_name = serializers.CharField(source='section.section_name', read_only=True)
    person_name = serializers.SerializerMethodField()

    class Meta:
        model = SignatureMaster
        fields = [
            'id', 'designation', 'class_ref', 'class_name', 'section', 'section_name',
            'person_name', 'original_image', 'processed_image', 'is_active', 'session',
        ]
        read_only_fields = ['id', 'session']

    def get_person_name(self, obj):
        if obj.designation != 'class_teacher':
            return None
        staff = class_teacher_for(obj.class_ref_id, obj.section_id)
        return staff.full_name if staff else None


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

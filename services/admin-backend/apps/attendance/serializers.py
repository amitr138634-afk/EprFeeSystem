from rest_framework import serializers
from .models import StudentAttendance, StaffAttendance, Holiday


class StudentAttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    admission_no = serializers.CharField(source='student.admission_no', read_only=True)

    class Meta:
        model = StudentAttendance
        fields = '__all__'
        read_only_fields = ['id', 'created_at']


class BulkAttendanceSerializer(serializers.Serializer):
    date = serializers.DateField()
    class_id = serializers.IntegerField(required=False)
    section = serializers.CharField(required=False)
    attendance = serializers.ListField(
        child=serializers.DictField()
    )


class StaffAttendanceSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source='staff.full_name', read_only=True)
    employee_id = serializers.CharField(source='staff.employee_id', read_only=True)
    designation = serializers.CharField(source='staff.designation.name', read_only=True)
    department = serializers.CharField(source='staff.department.name', read_only=True)
    staff_type = serializers.CharField(source='staff.staff_type', read_only=True)

    class Meta:
        model = StaffAttendance
        fields = '__all__'
        read_only_fields = ['id', 'created_at']


class BulkStaffAttendanceSerializer(serializers.Serializer):
    date = serializers.DateField()
    attendance = serializers.ListField(child=serializers.DictField())


class HolidaySerializer(serializers.ModelSerializer):
    class Meta:
        model = Holiday
        fields = '__all__'

from rest_framework import serializers
from .models import Staff, Department, Designation, DepartmentDesignation, Shift, LeaveType, LeaveRequest


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'


class DesignationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Designation
        fields = '__all__'


class DepartmentDesignationSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    designation_names = serializers.SerializerMethodField()
    designation_count = serializers.SerializerMethodField()
    
    class Meta:
        model = DepartmentDesignation
        fields = '__all__'
    
    def get_designation_names(self, obj):
        return [d.name for d in obj.designations.filter(status='active')]
    
    def get_designation_count(self, obj):
        return obj.designations.count()


class StaffSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    department_name = serializers.CharField(source='department.name', read_only=True)
    designation_name = serializers.CharField(source='designation.name', read_only=True)
    class_name = serializers.CharField(source='class_assigned.name', read_only=True)
    section_name = serializers.CharField(source='section_assigned.name', read_only=True)

    class Meta:
        model = Staff
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class StaffListSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    department_name = serializers.CharField(source='department.name', read_only=True)
    designation_name = serializers.CharField(source='designation.name', read_only=True)
    class_name = serializers.CharField(source='class_assigned.name', read_only=True)
    section_name = serializers.CharField(source='section_assigned.name', read_only=True)

    class Meta:
        model = Staff
        fields = [
            'id', 'employee_id', 'full_name', 'first_name', 'last_name',
            'email', 'phone', 'department_name', 'designation_name',
            'class_name', 'section_name', 'staff_type', 'photo', 'status', 'joining_date'
        ]


class ShiftSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shift
        fields = '__all__'


class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = '__all__'


class LeaveRequestSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source='staff.full_name', read_only=True)
    leave_type_name = serializers.CharField(source='leave_type.name', read_only=True)

    class Meta:
        model = LeaveRequest
        fields = '__all__'
        read_only_fields = ['id', 'created_at']

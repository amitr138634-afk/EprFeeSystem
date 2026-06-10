from rest_framework import serializers
from .models import School, AcademicSession


class SchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = '__all__'
        read_only_fields = ['id', 'db_name', 'created_at', 'updated_at']


class SchoolCreateSerializer(serializers.ModelSerializer):
    admin_email = serializers.EmailField(write_only=True)
    admin_password = serializers.CharField(write_only=True, min_length=8)
    admin_first_name = serializers.CharField(write_only=True)
    admin_last_name = serializers.CharField(write_only=True)
    admin_username = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = School
        fields = [
            'name', 'code', 'email', 'phone', 'address', 'city', 'state', 'pincode',
            'subscription_start', 'subscription_end', 'max_students',
            'admin_email', 'admin_password', 'admin_first_name', 'admin_last_name', 'admin_username'
        ]


class AcademicSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicSession
        fields = '__all__'
        read_only_fields = ['id', 'created_at']

from rest_framework import serializers
from .models import ClassMaster, ClassSectionMaster


class ClassMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassMaster
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class ClassSectionMasterSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='class_master.class_name', read_only=True)

    class Meta:
        model = ClassSectionMaster
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

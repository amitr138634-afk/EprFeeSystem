from rest_framework import serializers
from .models import Visitor, ShortLeave, Feedback, AuthorisedPerson, HRMLetter


class VisitorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Visitor
        fields = '__all__'
        read_only_fields = ['id', 'visit_date', 'in_time']


class ShortLeaveSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShortLeave
        fields = '__all__'
        read_only_fields = ['id', 'created_at']


class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = '__all__'
        read_only_fields = ['id', 'created_at']


class AuthorisedPersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuthorisedPerson
        fields = '__all__'


class HRMLetterSerializer(serializers.ModelSerializer):
    class Meta:
        model = HRMLetter
        fields = '__all__'
        read_only_fields = ['id', 'created_at']

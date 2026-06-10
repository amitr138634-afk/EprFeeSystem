from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['username'] = user.username or ''
        token['role'] = user.role
        token['full_name'] = user.full_name
        if user.school_id:
            token['school_id'] = user.school_id
            try:
                from apps.schools.models import School
                school = School.objects.get(pk=user.school_id)
                token['school_name'] = school.name
            except Exception:
                token['school_name'] = ''
        return token

    def validate(self, attrs):
        # Allow login by username (no @) or email
        login_id = attrs.get('email', '')
        if login_id and '@' not in login_id:
            try:
                user_obj = User.objects.get(username=login_id)
                attrs['email'] = user_obj.email
            except User.DoesNotExist:
                pass

        data = super().validate(attrs)
        if not self.user.is_active:
            raise serializers.ValidationError({'detail': 'Account is inactive.'})
        school_name = ''
        if self.user.school_id:
            try:
                from apps.schools.models import School
                school_name = School.objects.get(pk=self.user.school_id).name
            except Exception:
                pass
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'username': self.user.username or '',
            'full_name': self.user.full_name,
            'role': self.user.role,
            'school_id': self.user.school_id,
            'school_name': school_name,
        }
        return data


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 'full_name',
                  'role', 'school_id', 'phone', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class CreateUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'role', 'school_id', 'phone', 'password']

    def validate_role(self, value):
        # Don't allow assigning super_admin via the generic endpoint
        if value == 'super_admin':
            raise serializers.ValidationError('Cannot assign super_admin role via this endpoint.')
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class CreateSchoolAdminSerializer(serializers.ModelSerializer):
    """Super Admin uses this to create a school_admin user attached to an existing school."""
    password = serializers.CharField(write_only=True, min_length=8)
    school_id = serializers.IntegerField(required=True)

    class Meta:
        model = User
        fields = ['email', 'username', 'first_name', 'last_name', 'phone', 'school_id', 'password']

    def validate_school_id(self, value):
        from apps.schools.models import School
        if not School.objects.filter(pk=value).exists():
            raise serializers.ValidationError('School does not exist.')
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Email already in use.')
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        validated_data['role'] = 'school_admin'
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)

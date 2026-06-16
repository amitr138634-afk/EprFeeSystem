from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User


def get_school_name(school_id):
    """Resolve a school's display name from the shared central `schools` table."""
    if not school_id:
        return ''
    try:
        from django.db import connections
        with connections['default'].cursor() as cur:
            cur.execute('SELECT name FROM schools WHERE id = %s', [school_id])
            row = cur.fetchone()
            return row[0] if row else ''
    except Exception:
        return ''


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
            token['school_name'] = get_school_name(user.school_id)
        return token

    def validate(self, attrs):
        # Resolve the supplied identifier (username OR email) to a real account
        # so we can give a precise reason when sign-in fails.
        login_id = (attrs.get('email') or '').strip()
        password = attrs.get('password') or ''

        user_obj = None
        if login_id:
            if '@' in login_id:
                user_obj = User.objects.filter(email__iexact=login_id).first()
            else:
                user_obj = User.objects.filter(username=login_id).first()
            if user_obj:
                attrs['email'] = user_obj.email

        if user_obj is None:
            raise serializers.ValidationError(
                {'detail': 'No account found with this username or email.', 'code': 'user_not_found'}
            )
        if not user_obj.is_active:
            raise serializers.ValidationError(
                {'detail': 'This account is inactive. Please contact your administrator.', 'code': 'inactive'}
            )
        if not user_obj.check_password(password):
            raise serializers.ValidationError(
                {'detail': 'Incorrect password. Please try again.', 'code': 'wrong_password'}
            )

        data = super().validate(attrs)
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'username': self.user.username or '',
            'full_name': self.user.full_name,
            'role': self.user.role,
            'school_id': self.user.school_id,
            'school_name': get_school_name(self.user.school_id),
        }
        return data


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 'full_name', 'role', 'school_id', 'phone', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class CreateUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'role', 'school_id', 'phone', 'password']

    def validate_role(self, value):
        if value == 'super_admin':
            raise serializers.ValidationError('Cannot assign super_admin role via this endpoint.')
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)

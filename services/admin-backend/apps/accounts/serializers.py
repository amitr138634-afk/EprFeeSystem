from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User


def session_db_alias(user):
    """Resolve the tenant DB alias for a user's school.

    Needed at LOGIN time: there is no JWT yet, so TenantMiddleware hasn't set the
    tenant context and SessionMaster queries would otherwise hit the central DB
    (which has no session_master table). Authenticated requests don't need this —
    the router already routes to the active tenant.
    """
    if not getattr(user, 'school_id', None):
        return None
    try:
        from utils.tenant import register_school_database
        return register_school_database(user.school_id)
    except Exception:
        return None


def active_sessions_qs(using=None):
    """All active sessions, latest year first (optionally from a specific DB)."""
    from apps.students.models import SessionMaster
    qs = SessionMaster.objects.filter(status=True).order_by('-session_year')
    return qs.using(using) if using else qs


def resolve_session(session_id=None, using=None):
    """Return the requested active SessionMaster, or the latest active one as default."""
    qs = active_sessions_qs(using)
    session = None
    if session_id:
        session = qs.filter(id=session_id).first()
    if session is None:
        session = qs.first()
    return session


def build_session_tokens(user, session):
    """Mint a fresh refresh/access pair carrying the standard + active-session claims."""
    refresh = CustomTokenObtainPairSerializer.get_token(user)
    if session is not None:
        refresh['session_id'] = session.id
        refresh['current_session'] = session.session_year
    return {'refresh': str(refresh), 'access': str(refresh.access_token)}


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    session_id = serializers.IntegerField(required=False, allow_null=True, write_only=True)
    
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

        # Get session_id from request
        session_id = attrs.pop('session_id', None)

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
        
        # Embed the selected (or default latest) active session into the tokens.
        # Route to the user's tenant DB explicitly — no tenant context exists yet
        # during login.
        try:
            alias = session_db_alias(self.user)
            session = resolve_session(session_id, using=alias)
            if session is not None:
                tokens = build_session_tokens(self.user, session)
                data['access'] = tokens['access']
                data['refresh'] = tokens['refresh']
                data['current_session'] = {'id': session.id, 'session_year': session.session_year}
            else:
                data['current_session'] = None

            data['available_sessions'] = [
                {'id': s.id, 'session_year': s.session_year} for s in active_sessions_qs(using=alias)
            ]
        except Exception:
            data['current_session'] = None
            data['available_sessions'] = []

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

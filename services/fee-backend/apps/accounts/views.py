from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User
from .serializers import (
    CustomTokenObtainPairSerializer, UserSerializer,
    CreateUserSerializer, ChangePasswordSerializer
)
from utils.permissions import IsSuperAdmin, IsSchoolAdmin


class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = CustomTokenObtainPairSerializer


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response({'detail': 'refresh token is required.'}, status=status.HTTP_400_BAD_REQUEST)
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'detail': 'Successfully logged out.'})
        except Exception as e:
            return Response({'detail': f'Invalid token: {e}'}, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.validated_data['old_password']):
                return Response({'old_password': 'Wrong password.'}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({'detail': 'Password changed successfully.'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsSchoolAdmin]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateUserSerializer
        return UserSerializer

    def get_queryset(self):
        if self.request.user.role == 'super_admin':
            return User.objects.all().order_by('-created_at')
        return User.objects.filter(school_id=self.request.user.school_id).order_by('-created_at')

    def perform_create(self, serializer):
        if self.request.user.role == 'school_admin':
            requested_role = serializer.validated_data.get('role', 'staff')
            if requested_role == 'super_admin':
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied('Cannot create super admin.')
            serializer.save(school_id=self.request.user.school_id)
        else:
            serializer.save()


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsSchoolAdmin]

    def get_queryset(self):
        if self.request.user.role == 'super_admin':
            return User.objects.all()
        return User.objects.filter(school_id=self.request.user.school_id)


# ---------- Active-session management ----------

class SessionListView(APIView):
    """List all active sessions (for the header/footer session switcher)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .serializers import active_sessions_qs
        data = [{'id': s.id, 'session_year': s.session_year} for s in active_sessions_qs()]
        return Response(data)


class ChangeSessionView(APIView):
    """Switch the active session without logging out (re-issues the JWT)."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        session_id = request.data.get('session_id')
        if not session_id:
            return Response({'detail': 'session_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        from .serializers import resolve_session, build_session_tokens
        session = resolve_session(session_id)
        if session is None or str(session.id) != str(session_id):
            return Response({'detail': 'Session not found or inactive'}, status=status.HTTP_404_NOT_FOUND)

        tokens = build_session_tokens(request.user, session)
        return Response({
            'access': tokens['access'],
            'refresh': tokens['refresh'],
            'current_session': {'id': session.id, 'session_year': session.session_year},
        })


class GetSchoolCodeView(APIView):
    """Resolve a user's school code from their username/email (login-page dropdown)."""
    permission_classes = [AllowAny]

    def post(self, request):
        from django.db.models import Q
        identifier = request.data.get('email') or request.data.get('username')
        if not identifier:
            return Response({'detail': 'email or username is required'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(Q(email__iexact=identifier) | Q(username=identifier)).first()
        if not user or not user.school_id:
            return Response({'detail': 'User not found or no school assigned'}, status=status.HTTP_404_NOT_FOUND)

        from django.db import connections
        with connections['default'].cursor() as cur:
            cur.execute('SELECT code, name FROM schools WHERE id = %s', [user.school_id])
            row = cur.fetchone()
        if not row:
            return Response({'detail': 'School not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'school_code': row[0], 'school_name': row[1]})

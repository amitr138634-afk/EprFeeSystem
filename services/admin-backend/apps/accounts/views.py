from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User
from .serializers import (
    CustomTokenObtainPairSerializer, UserSerializer,
    CreateUserSerializer, ChangePasswordSerializer, CreateSchoolAdminSerializer
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
    """Generic user CRUD (used by school admin to manage staff/teacher accounts in their school)."""
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
        # School admin cannot create super_admin or assign to a different school
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


# ---------- Super Admin: School-Admin management ----------

class SchoolAdminListCreateView(generics.ListCreateAPIView):
    """Super Admin only: list all school admins or create a new school admin for an existing school."""
    permission_classes = [IsSuperAdmin]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateSchoolAdminSerializer
        return UserSerializer

    def get_queryset(self):
        qs = User.objects.filter(role='school_admin').order_by('-created_at')
        school_id = self.request.query_params.get('school_id')
        if school_id:
            qs = qs.filter(school_id=school_id)
        return qs


class SchoolAdminDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsSuperAdmin]
    queryset = User.objects.filter(role='school_admin')


class ResetSchoolAdminPasswordView(APIView):
    """Super Admin resets a school admin's password directly (no old password needed)."""
    permission_classes = [IsSuperAdmin]

    def post(self, request, pk):
        new_password = request.data.get('new_password', '')
        if len(new_password) < 8:
            return Response({'detail': 'Password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(pk=pk, role='school_admin')
        except User.DoesNotExist:
            return Response({'detail': 'School admin not found.'}, status=status.HTTP_404_NOT_FOUND)
        user.set_password(new_password)
        user.save()
        return Response({'detail': 'Password updated successfully.'})

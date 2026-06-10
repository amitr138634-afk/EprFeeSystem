from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change-password'),

    # Generic users (school admin uses this to manage staff users inside the school)
    path('users/', views.UserListCreateView.as_view(), name='user-list-create'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user-detail'),

    # Super Admin: create / list school admins
    path('school-admins/', views.SchoolAdminListCreateView.as_view(), name='school-admin-list-create'),
    path('school-admins/<int:pk>/', views.SchoolAdminDetailView.as_view(), name='school-admin-detail'),
]

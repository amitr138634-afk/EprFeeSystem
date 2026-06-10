from django.urls import path
from . import views

urlpatterns = [
    path('', views.SchoolListCreateView.as_view(), name='school-list-create'),
    path('<int:pk>/', views.SchoolDetailView.as_view(), name='school-detail'),
    path('<int:pk>/toggle-status/', views.ToggleSchoolStatusView.as_view(), name='school-toggle-status'),
    path('<int:school_id>/sessions/', views.AcademicSessionListCreateView.as_view(), name='school-sessions'),
    path('dashboard/', views.SchoolDashboardView.as_view(), name='school-dashboard'),
]

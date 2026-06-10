from django.urls import path
from . import views

urlpatterns = [
    path('makes/', views.VehicleMakeListCreateView.as_view(), name='vehicle-make-list'),
    path('models/', views.VehicleModelListCreateView.as_view(), name='vehicle-model-list'),
    path('vehicles/', views.VehicleListCreateView.as_view(), name='vehicle-list'),
    path('vehicles/<int:pk>/', views.VehicleDetailView.as_view(), name='vehicle-detail'),
    path('routes/', views.RouteListCreateView.as_view(), name='route-list'),
    path('routes/<int:pk>/', views.RouteDetailView.as_view(), name='route-detail'),
    path('stops/', views.StopListCreateView.as_view(), name='stop-list'),
    path('stops/<int:pk>/', views.StopDetailView.as_view(), name='stop-detail'),
    path('students/', views.StudentTransportListCreateView.as_view(), name='transport-student-list'),
    path('students/<int:pk>/', views.StudentTransportDetailView.as_view(), name='transport-student-detail'),
    path('attendance/', views.TransportAttendanceView.as_view(), name='transport-attendance'),
    path('buswise-count/', views.BuswiseStudentCountView.as_view(), name='buswise-count'),
    path('parts/', views.VehiclePartListCreateView.as_view(), name='vehicle-part-list'),
    path('parts/<int:pk>/', views.VehiclePartDetailView.as_view(), name='vehicle-part-detail'),
    path('dashboard/', views.TransportDashboardView.as_view(), name='transport-dashboard'),
]

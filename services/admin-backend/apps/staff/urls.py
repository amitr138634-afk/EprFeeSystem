from django.urls import path
from . import views

urlpatterns = [
    path('departments/', views.DepartmentListCreateView.as_view(), name='department-list'),
    path('departments/<int:pk>/', views.DepartmentDetailView.as_view(), name='department-detail'),
    path('designations/', views.DesignationListCreateView.as_view(), name='designation-list'),
    path('designations/<int:pk>/', views.DesignationDetailView.as_view(), name='designation-detail'),
    path('department-designations/', views.DepartmentDesignationListCreateView.as_view(), name='department-designation-list'),
    path('department-designations/<int:pk>/', views.DepartmentDesignationDetailView.as_view(), name='department-designation-detail'),
    path('', views.StaffListCreateView.as_view(), name='staff-list-create'),
    path('<int:pk>/', views.StaffDetailView.as_view(), name='staff-detail'),
    path('shifts/', views.ShiftListCreateView.as_view(), name='shift-list'),
    path('shifts/<int:pk>/', views.ShiftDetailView.as_view(), name='shift-detail'),
    path('leave-types/', views.LeaveTypeListCreateView.as_view(), name='leave-type-list'),
    path('leave-types/<int:pk>/', views.LeaveTypeDetailView.as_view(), name='leave-type-detail'),
    path('leave-requests/', views.LeaveRequestListCreateView.as_view(), name='leave-request-list'),
    path('leave-requests/<int:pk>/action/', views.LeaveRequestApproveView.as_view(), name='leave-request-action'),
    path('leave-balance/', views.LeaveBalanceView.as_view(), name='leave-balance'),
]

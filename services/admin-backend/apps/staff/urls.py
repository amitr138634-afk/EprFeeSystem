from django.urls import path
from . import views

urlpatterns = [
    path('departments/', views.DepartmentListCreateView.as_view(), name='department-list'),
    path('designations/', views.DesignationListCreateView.as_view(), name='designation-list'),
    path('', views.StaffListCreateView.as_view(), name='staff-list-create'),
    path('<int:pk>/', views.StaffDetailView.as_view(), name='staff-detail'),
    path('shifts/', views.ShiftListCreateView.as_view(), name='shift-list'),
    path('leave-types/', views.LeaveTypeListCreateView.as_view(), name='leave-type-list'),
    path('leave-requests/', views.LeaveRequestListCreateView.as_view(), name='leave-request-list'),
    path('leave-requests/<int:pk>/action/', views.LeaveRequestApproveView.as_view(), name='leave-request-action'),
]

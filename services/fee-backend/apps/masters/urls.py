from django.urls import path
from . import views

urlpatterns = [
    # Class Master
    path('classes/', views.ClassMasterListCreateView.as_view(), name='class-master-list'),
    path('classes/<int:pk>/', views.ClassMasterDetailView.as_view(), name='class-master-detail'),
    path('classes/<int:pk>/toggle-status/', views.ClassMasterToggleStatusView.as_view(), name='class-toggle-status'),
    
    # Class Section Master
    path('sections/', views.ClassSectionMasterListCreateView.as_view(), name='section-master-list'),
    path('sections/<int:pk>/', views.ClassSectionMasterDetailView.as_view(), name='section-master-detail'),
    path('sections/<int:pk>/toggle-status/', views.ClassSectionMasterToggleStatusView.as_view(), name='section-toggle-status'),
]

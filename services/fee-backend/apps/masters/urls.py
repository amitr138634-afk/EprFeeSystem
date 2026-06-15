from django.urls import path
from . import views

urlpatterns = [
    # Class Master
    path('classes/', views.ClassMasterListCreateView.as_view(), name='class-master-list'),
    path('classes/<int:pk>/', views.ClassMasterDetailView.as_view(), name='class-master-detail'),
    path('classes/<int:pk>/toggle-status/', views.ClassMasterToggleStatusView.as_view(), name='class-toggle-status'),
    
    # Section Master (Independent)
    path('section-master/', views.SectionMasterListCreateView.as_view(), name='section-master-list'),
    path('section-master/<int:pk>/', views.SectionMasterDetailView.as_view(), name='section-master-detail'),
    path('section-master/<int:pk>/toggle-status/', views.SectionMasterToggleStatusView.as_view(), name='section-master-toggle-status'),
    
    # Class Section Master (with class relationship)
    path('sections/', views.ClassSectionMasterListCreateView.as_view(), name='class-section-master-list'),
    path('sections/<int:pk>/', views.ClassSectionMasterDetailView.as_view(), name='class-section-master-detail'),
    path('sections/<int:pk>/toggle-status/', views.ClassSectionMasterToggleStatusView.as_view(), name='class-section-toggle-status'),
]

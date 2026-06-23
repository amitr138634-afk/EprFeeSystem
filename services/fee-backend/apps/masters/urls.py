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
    
    # Session Master
    path('sessions/', views.SessionMasterListCreateView.as_view(), name='session-master-list'),
    path('sessions/<int:pk>/', views.SessionMasterDetailView.as_view(), name='session-master-detail'),

    # House Master
    path('houses/', views.HouseMasterListCreateView.as_view(), name='house-master-list'),
    path('houses/<int:pk>/', views.HouseMasterDetailView.as_view(), name='house-master-detail'),
    path('houses/<int:pk>/toggle-status/', views.HouseMasterToggleStatusView.as_view(), name='house-master-toggle-status'),

    # Blood Group Master
    path('blood-groups/', views.BloodGroupMasterListCreateView.as_view(), name='blood-group-master-list'),
    path('blood-groups/<int:pk>/', views.BloodGroupMasterDetailView.as_view(), name='blood-group-master-detail'),
    path('blood-groups/<int:pk>/toggle-status/', views.BloodGroupMasterToggleStatusView.as_view(), name='blood-group-master-toggle-status'),

    # School Info Master (singleton)
    path('school-info/', views.SchoolMasterView.as_view(), name='school-master'),

    # Category Master
    path('categories/', views.CategoryMasterListCreateView.as_view(), name='category-master-list'),
    path('categories/<int:pk>/', views.CategoryMasterDetailView.as_view(), name='category-master-detail'),
    path('categories/<int:pk>/toggle-status/', views.CategoryMasterToggleStatusView.as_view(), name='category-master-toggle-status'),

    # Religion Master
    path('religions/', views.ReligionMasterListCreateView.as_view(), name='religion-master-list'),
    path('religions/<int:pk>/', views.ReligionMasterDetailView.as_view(), name='religion-master-detail'),
    path('religions/<int:pk>/toggle-status/', views.ReligionMasterToggleStatusView.as_view(), name='religion-master-toggle-status'),

    # Caste Master
    path('castes/', views.CasteMasterListCreateView.as_view(), name='caste-master-list'),
    path('castes/<int:pk>/', views.CasteMasterDetailView.as_view(), name='caste-master-detail'),
    path('castes/<int:pk>/toggle-status/', views.CasteMasterToggleStatusView.as_view(), name='caste-master-toggle-status'),

    # Attendance Master (Present/Absent/Leave, etc.)
    path('attendance-status/', views.AttendanceMasterListCreateView.as_view(), name='attendance-master-list'),
    path('attendance-status/<int:pk>/', views.AttendanceMasterDetailView.as_view(), name='attendance-master-detail'),
    path('attendance-status/<int:pk>/toggle-status/', views.AttendanceMasterToggleStatusView.as_view(), name='attendance-master-toggle-status'),

    # Certificate Master
    path('certificates/', views.CertificateMasterListCreateView.as_view(), name='certificate-master-list'),
    path('certificates/<int:pk>/', views.CertificateMasterDetailView.as_view(), name='certificate-master-detail'),
    path('certificates/<int:pk>/toggle-status/', views.CertificateMasterToggleStatusView.as_view(), name='certificate-master-toggle-status'),
]

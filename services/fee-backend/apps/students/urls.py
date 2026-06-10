from django.urls import path
from . import views

urlpatterns = [
    path('admissions/', views.NewAdmissionListCreateView.as_view(), name='admission-list'),
    path('admissions/<int:pk>/', views.NewAdmissionDetailView.as_view(), name='admission-detail'),
    path('follow-ups/', views.EnquiryFollowUpView.as_view(), name='follow-up-list'),
    path('promote/', views.PromotionView.as_view(), name='promote-students'),
]

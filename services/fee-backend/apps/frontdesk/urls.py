from django.urls import path
from . import views

urlpatterns = [
    path('visitors/', views.VisitorListCreateView.as_view(), name='visitor-list'),
    path('visitors/<int:pk>/', views.VisitorDetailView.as_view(), name='visitor-detail'),
    path('short-leaves/', views.ShortLeaveListCreateView.as_view(), name='short-leave-list'),
    path('short-leaves/<int:pk>/', views.ShortLeaveDetailView.as_view(), name='short-leave-detail'),
    path('short-leaves/<int:pk>/action/', views.ShortLeaveApproveView.as_view(), name='short-leave-action'),
    path('feedbacks/', views.FeedbackListCreateView.as_view(), name='feedback-list'),
    path('feedbacks/<int:pk>/', views.FeedbackDetailView.as_view(), name='feedback-detail'),
    path('authorised-persons/', views.AuthorisedPersonListCreateView.as_view(), name='authorised-person-list'),
    path('authorised-persons/<int:pk>/', views.AuthorisedPersonDetailView.as_view(), name='authorised-person-detail'),
    path('hrm-letters/', views.HRMLetterListCreateView.as_view(), name='hrm-letter-list'),
    path('hrm-letters/<int:pk>/', views.HRMLetterDetailView.as_view(), name='hrm-letter-detail'),
    path('enquiry-dashboard/', views.EnquiryDashboardView.as_view(), name='enquiry-dashboard'),
]

from django.urls import path
from . import views

urlpatterns = [
    path('heads/', views.FeeHeadListCreateView.as_view(), name='fee-head-list'),
    path('heads/<int:pk>/', views.FeeHeadDetailView.as_view(), name='fee-head-detail'),
    path('heads/promote/', views.PromoteFeeHeadsView.as_view(), name='fee-heads-promote'),
    path('amounts/', views.FeeAmountListCreateView.as_view(), name='fee-amount-list'),
    path('amounts/<int:pk>/', views.FeeAmountDetailView.as_view(), name='fee-amount-detail'),
    path('amounts/bulk-update/', views.FeeAmountBulkUpdateView.as_view(), name='fee-amount-bulk-update'),
    path('structures/', views.FeeStructureListCreateView.as_view(), name='fee-structure-list'),
    path('structures/<int:pk>/', views.FeeStructureDetailView.as_view(), name='fee-structure-detail'),
    path('discounts/heads/', views.DiscountHeadListCreateView.as_view(), name='discount-head-list'),
    path('discounts/heads/<int:pk>/', views.DiscountHeadDetailView.as_view(), name='discount-head-detail'),
    path('discounts/students/', views.StudentFeeDiscountView.as_view(), name='student-discount-list'),
    path('pay/', views.PayFeeView.as_view(), name='pay-fee'),
    path('receipts/', views.FeeReceiptListView.as_view(), name='receipt-list'),
    path('receipts/<int:pk>/', views.FeeReceiptDetailView.as_view(), name='receipt-detail'),
    path('receipts/<int:pk>/cancel/', views.CancelReceiptView.as_view(), name='receipt-cancel'),
    path('reports/daily/', views.DailyCollectionReportView.as_view(), name='daily-collection'),
    path('reports/monthly/', views.MonthlyCollectionReportView.as_view(), name='monthly-collection'),
    path('reports/classwise/', views.ClasswiseCollectionReportView.as_view(), name='classwise-collection'),
    path('defaulters/', views.FeeDefaulterView.as_view(), name='fee-defaulters'),
    path('books/sets/', views.BookSetListCreateView.as_view(), name='book-set-list'),
    path('books/sets/<int:pk>/', views.BookSetDetailView.as_view(), name='book-set-detail'),
    path('books/', views.BookListCreateView.as_view(), name='book-list'),
    path('books/<int:pk>/', views.BookDetailView.as_view(), name='book-detail'),
    path('books/sell/', views.BookSaleView.as_view(), name='book-sale'),
    path('uniforms/', views.UniformItemListCreateView.as_view(), name='uniform-list'),
    path('uniforms/<int:pk>/', views.UniformItemDetailView.as_view(), name='uniform-detail'),
    path('uniforms/sell/', views.UniformSaleView.as_view(), name='uniform-sale'),
    path('deposits/', views.DepositFeeListCreateView.as_view(), name='deposit-list'),
    path('deposits/<int:pk>/', views.DepositFeeDetailView.as_view(), name='deposit-detail'),
    path('additional/', views.AdditionalFeeListCreateView.as_view(), name='additional-fee-list'),
    path('additional/<int:pk>/', views.AdditionalFeeDetailView.as_view(), name='additional-fee-detail'),
    
    # Admission Queries
    path('admission-queries/', views.AdmissionQueryListCreateView.as_view(), name='admission-query-list'),
    path('admission-queries/<int:pk>/', views.AdmissionQueryDetailView.as_view(), name='admission-query-detail'),
    path('admission-queries/<int:pk>/status/', views.AdmissionQueryStatusUpdateView.as_view(), name='admission-query-status'),
    path('admission-queries/pay-registration/', views.PayRegistrationFeeView.as_view(), name='pay-registration-fee'),
    path('admission-queries/<int:pk>/receipt/', views.RegistrationReceiptView.as_view(), name='registration-receipt'),
    path('admission-queries/<int:pk>/approve/', views.ApproveAdmissionView.as_view(), name='approve-admission'),
    path('admission-queries/<int:pk>/unapprove/', views.UnapproveAdmissionView.as_view(), name='unapprove-admission'),
    
    # Student Management
    path('students/change-admission-no/', views.ChangeAdmissionNoView.as_view(), name='change-admission-no'),
    path('students/search/', views.StudentSearchView.as_view(), name='student-search'),
    path('students/search-by-name/', views.StudentNameSearchView.as_view(), name='student-search-by-name'),
    path('students/strength/', views.ClasswiseStrengthView.as_view(), name='student-strength'),
    path('students/list/', views.StudentListReportView.as_view(), name='student-list-report'),
    path('students/<int:student_id>/profile/', views.StudentProfileView.as_view(), name='student-profile'),
    path('students/by-class/', views.StudentsByClassView.as_view(), name='students-by-class'),
    path('students/promote-class/', views.PromoteStudentsView.as_view(), name='promote-students'),
    path('students/<int:student_id>/pay/', views.PayStudentFeeView.as_view(), name='student-pay-fee'),
    path('students/<int:student_id>/detail/', views.StudentDetailUpdateView.as_view(), name='student-detail-update'),
    path('students/<int:student_id>/certificates/', views.StudentCertificateView.as_view(), name='student-certificates'),

    # Per-head, per-month discounts
    path('discounts/monthly/', views.StudentFeeHeadMonthDiscountView.as_view(), name='student-monthly-discount'),

    # Fee Management — Summary & Transactions
    path('summary/', views.FeeSummaryView.as_view(), name='fee-summary'),
    path('summary/head-names/', views.FeeHeadNamesView.as_view(), name='fee-summary-head-names'),
    path('transactions/', views.FeeTransactionView.as_view(), name='fee-transactions'),
    path('defaulters/period/', views.PeriodDefaulterView.as_view(), name='fee-defaulters-period'),
    path('dashboard/', views.FeeDashboardView.as_view(), name='fee-dashboard'),
]

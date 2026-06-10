from django.urls import path
from . import views

urlpatterns = [
    path('heads/', views.FeeHeadListCreateView.as_view(), name='fee-head-list'),
    path('heads/<int:pk>/', views.FeeHeadDetailView.as_view(), name='fee-head-detail'),
    path('structures/', views.FeeStructureListCreateView.as_view(), name='fee-structure-list'),
    path('discounts/heads/', views.DiscountHeadListCreateView.as_view(), name='discount-head-list'),
    path('discounts/students/', views.StudentFeeDiscountView.as_view(), name='student-discount-list'),
    path('pay/', views.PayFeeView.as_view(), name='pay-fee'),
    path('receipts/', views.FeeReceiptListView.as_view(), name='receipt-list'),
    path('receipts/<int:pk>/', views.FeeReceiptDetailView.as_view(), name='receipt-detail'),
    path('reports/daily/', views.DailyCollectionReportView.as_view(), name='daily-collection'),
    path('reports/classwise/', views.ClasswiseCollectionReportView.as_view(), name='classwise-collection'),
    path('defaulters/', views.FeeDefaulterView.as_view(), name='fee-defaulters'),
    path('books/sets/', views.BookSetListCreateView.as_view(), name='book-set-list'),
    path('books/', views.BookListCreateView.as_view(), name='book-list'),
    path('books/sell/', views.BookSaleView.as_view(), name='book-sale'),
    path('uniforms/', views.UniformItemListCreateView.as_view(), name='uniform-list'),
    path('uniforms/sell/', views.UniformSaleView.as_view(), name='uniform-sale'),
    path('deposits/', views.DepositFeeListCreateView.as_view(), name='deposit-list'),
    path('additional/', views.AdditionalFeeListCreateView.as_view(), name='additional-fee-list'),
]

from django.urls import path
from .views import CreateOrderView, OrderDetailView

urlpatterns = [
    path('',           CreateOrderView.as_view(), name='create-order'),
    path('<str:order_id>/', OrderDetailView.as_view(),  name='order-detail'),
]
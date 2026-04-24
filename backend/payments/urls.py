from django.urls import path
from . import views
from .views import CreatePaymentIntentView
urlpatterns = [
    path('create-payment-intent/', CreatePaymentIntentView.as_view(), name='create_payment_intent'),
    path('confirm-payment/', views.ConfirmPaymentView.as_view(), name='confirm_payment'),
]
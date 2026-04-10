from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    ProfileView,
    ChangePasswordView,
    VerifyCodeView,
    RequestPasswordResetView,
    ConfirmPasswordResetView,
    ResendVerificationCodeView,      # ← Nueva vista para reenviar código
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('verify-code/', VerifyCodeView.as_view(), name='verify-code'),
    path('request-password-reset/', RequestPasswordResetView.as_view(), name='request-password-reset'),
    path('confirm-password-reset/', ConfirmPasswordResetView.as_view(), name='confirm-password-reset'),
    path('resend-verification/', ResendVerificationCodeView.as_view(), name='resend-verification'),
]
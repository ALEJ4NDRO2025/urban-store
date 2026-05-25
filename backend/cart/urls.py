from django.urls import path
from .views import CartView, CartSyncView   # Asegúrate de importar CartSyncView

urlpatterns = [
    path('', CartView.as_view(), name='cart'),
    path('sync/', CartSyncView.as_view(), name='cart_sync'),   # ← esta es la clave
]
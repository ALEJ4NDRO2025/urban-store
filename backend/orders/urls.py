from django.urls import path
from .views import (
    CreateOrderView,
    OrderDetailView,
    UserOrdersView,          # ← nueva
    AllOrdersView,           # ← nueva
    UpdateOrderStatusView    # ← nueva
)

urlpatterns = [
    # Rutas fijas primero para evitar conflictos con <str:order_id>
    path('my-orders/', UserOrdersView.as_view(), name='user-orders'),
    path('all/', AllOrdersView.as_view(), name='all-orders'),

    # Ruta con parámetro dinámico específico (status)
    path('<str:order_id>/status/', UpdateOrderStatusView.as_view(), name='update-order-status'),

    # Ruta con parámetro dinámico genérico (detalle de orden)
    path('<str:order_id>/', OrderDetailView.as_view(), name='order-detail'),

    # Ruta base (crear orden)
    path('', CreateOrderView.as_view(), name='create-order'),
]
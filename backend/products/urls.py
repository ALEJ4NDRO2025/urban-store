from django.urls import path
from .views import ProductListView, ProductDetailView

urlpatterns = [
    # Lista de productos + crear nuevo
    path('', ProductListView.as_view(), name='product-list'),

    # Ver, editar o borrar un producto por su slug
    path('<slug:slug>/', ProductDetailView.as_view(), name='product-detail'),
]

# backend/recomendaciones/utils.py

from collections import Counter
from django.utils import timezone
from datetime import timedelta
from analytics.models import Event
from orders.models import Order
from products.models import Product

def get_popular_products(limit=20):
    """
    Retorna lista de slugs de productos más populares.
    Peso 2 a ventas (de la colección Order)
    Peso 1 a vistas (eventos 'product_view' últimos 30 días)
    Si no hay datos, retorna lista vacía.
    """
    # Productos más vendidos (de órdenes)
    orders = Order.objects.all()
    sold_counter = Counter()
    for order in orders:
        for item in order.items:
            if item.product_slug:
                sold_counter[item.product_slug] += item.quantity

    # Productos más vistos (últimos 30 días)
    last_30 = timezone.now() - timedelta(days=30)
    views = Event.objects.filter(event_type='product_view', created_at__gte=last_30)
    view_counter = Counter()
    for ev in views:
        if ev.product_slug:
            view_counter[ev.product_slug] += 1

    # Combinar puntuaciones (venta pesa el doble)
    score = {}
    for slug, count in sold_counter.items():
        score[slug] = score.get(slug, 0) + count * 2
    for slug, count in view_counter.items():
        score[slug] = score.get(slug, 0) + count

    # Ordenar de mayor a menor
    sorted_slugs = sorted(score.items(), key=lambda x: x[1], reverse=True)
    return [slug for slug, _ in sorted_slugs[:limit]]


def get_popular_products_excluding(exclude_slugs, limit=20):
    """
    Retorna productos populares, excluyendo los que están en exclude_slugs.
    Útil para recomendar a un usuario (o sesión) productos que aún no ha visto.
    """
    # Obtener más productos del popular para poder filtrar
    popular = get_popular_products(limit=limit * 2)
    # Filtrar
    filtered = [slug for slug in popular if slug not in exclude_slugs]
    return filtered[:limit]
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from .models import Order, OrderItem, ShippingAddress
from cart.models import Cart
import jwt

def get_user_id(request):
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return None
    try:
        payload = jwt.decode(auth.split(' ')[1], settings.SECRET_KEY, algorithms=['HS256'])
        return payload.get('email')
    except:
        return None

def order_to_dict(order):
    return {
        'id':           str(order.id),
        'order_number': order.order_number,
        'user_id':      order.user_id,
        'items': [{
            'product_slug': i.product_slug,
            'product_name': i.product_name,
            'quantity':     i.quantity,
            'size':         i.size,
            'color':        i.color,
            'price_paid':   i.price_paid,
            'subtotal':     i.subtotal,
        } for i in order.items],
        'subtotal':  order.subtotal,
        'tax':       order.tax,
        'shipping':  order.shipping,
        'total':     order.total,
        'status':    order.status,
        'shipping_address': {
            'email':      order.shipping_address.email,
            'name':       order.shipping_address.name,
            'phone':      order.shipping_address.phone,
            'address':    order.shipping_address.address,
            'city':       order.shipping_address.city,
            'department': order.shipping_address.department,  # ← AQUÍ SE DEVUELVE AL FRONTEND
            'country':    order.shipping_address.country,
        },
        'notes':      order.notes,
        'created_at': order.created_at.isoformat(),
    }

class CreateOrderView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        """POST /api/orders/ — crea orden desde el carrito
        Body: { shipping_address: { email, name, phone, address, city, department }, notes }
        """
        user_id = get_user_id(request)
        if not user_id:
            return Response({'error': 'Token inválido'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            cart = Cart.objects.get(user_id=user_id)
        except Cart.DoesNotExist:
            return Response({'error': 'Carrito vacío'}, status=status.HTTP_400_BAD_REQUEST)

        if not cart.items:
            return Response({'error': 'El carrito está vacío'}, status=status.HTTP_400_BAD_REQUEST)

        addr = request.data.get('shipping_address')
        if not addr:
            return Response({'error': 'Dirección de envío requerida'}, status=status.HTTP_400_BAD_REQUEST)

        order = Order(
            user_id=user_id,
            order_number=Order.generate_order_number(),
            items=[OrderItem(
                product_slug=i.product_slug,
                product_name=i.product_name,
                quantity=i.quantity,
                size=i.selected_size,
                color=i.selected_color,
                price_paid=i.price_at_time,
                subtotal=i.price_at_time * i.quantity,
            ) for i in cart.items],
            subtotal=cart.total,
            total=cart.total,
            shipping_address=ShippingAddress(
                email=addr.get('email', user_id),
                name=addr.get('name', ''),
                phone=addr.get('phone', ''),
                address=addr.get('address', ''),
                city=addr.get('city', ''),
                department=addr.get('department', ''),   # ← CORRECCIÓN: GUARDAR DEPARTMENT
                country=addr.get('country', 'Colombia'),
            ),
            notes=request.data.get('notes', ''),
        )
        order.save()

        # Vacía el carrito
        cart.items = []
        cart.calculate_totals()
        cart.save()

        return Response(order_to_dict(order), status=status.HTTP_201_CREATED)


class OrderDetailView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request, order_id):
        """GET /api/orders/<order_id>/ — detalle de una orden"""
        user_id = get_user_id(request)
        if not user_id:
            return Response({'error': 'Token inválido'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            order = Order.objects.get(id=order_id, user_id=user_id)
        except Order.DoesNotExist:
            return Response({'error': 'Orden no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        return Response(order_to_dict(order))
    
    # ──────────────────────────────────────────────────────────────────────────────
# NUEVAS VISTAS PARA PERFIL DE USUARIO Y ADMIN
# ──────────────────────────────────────────────────────────────────────────────

from datetime import datetime

def is_admin(request):
    """Devuelve True si el token JWT pertenece a un administrador."""
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return False
    try:
        payload = jwt.decode(auth.split(' ')[1], settings.SECRET_KEY, algorithms=['HS256'])
        return payload.get('is_admin', False)
    except:
        return False


class UserOrdersView(APIView):
    """GET /api/orders/my-orders/ — Lista de pedidos del usuario autenticado."""
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        user_id = get_user_id(request)
        if not user_id:
            return Response({'error': 'Token inválido'}, status=status.HTTP_401_UNAUTHORIZED)

        orders = Order.objects.filter(user_id=user_id).order_by('-created_at')
        return Response([order_to_dict(o) for o in orders], status=status.HTTP_200_OK)


class AllOrdersView(APIView):
    """GET /api/orders/all/ — Todos los pedidos (solo admin)."""
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        if not is_admin(request):
            return Response({'error': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)

        orders = Order.objects.all().order_by('-created_at')
        return Response([order_to_dict(o) for o in orders], status=status.HTTP_200_OK)


class UpdateOrderStatusView(APIView):
    """PATCH /api/orders/<order_id>/status/ — Cambiar estado de un pedido (solo admin)."""
    authentication_classes = []
    permission_classes = []

    def patch(self, request, order_id):
        if not is_admin(request):
            return Response({'error': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)

        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response({'error': 'Orden no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        if new_status not in ['pending', 'paid', 'shipped']:
            return Response({'error': 'Estado inválido'}, status=status.HTTP_400_BAD_REQUEST)

        order.status = new_status
        if new_status == 'paid' and not order.paid_at:
            order.paid_at = datetime.utcnow()
        order.updated_at = datetime.utcnow()
        order.save()

        return Response(order_to_dict(order), status=status.HTTP_200_OK)
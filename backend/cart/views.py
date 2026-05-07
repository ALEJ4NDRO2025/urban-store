from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from .models import Cart, CartItem
import jwt

def get_user_id(request):
    """Extrae el email (user_id) del token JWT"""
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return None
    try:
        payload = jwt.decode(auth.split(' ')[1], settings.SECRET_KEY, algorithms=['HS256'])
        return payload.get('email')
    except:
        return None

def cart_to_dict(cart):
    return {
        'user_id':    cart.user_id,
        'items':      [{
            'product_slug':   i.product_slug,
            'product_name':   i.product_name,
            'quantity':       i.quantity,
            'selected_size':  i.selected_size,
            'selected_color': i.selected_color,
            'price_at_time':  i.price_at_time,
            'image':          i.image,
        } for i in cart.items],
        'total':      cart.total,
        'item_count': cart.item_count,
    }

class CartView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        user_id = get_user_id(request)
        if not user_id:
            return Response({'error': 'Token inválido'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            cart = Cart.objects.get(user_id=user_id)
        except Cart.DoesNotExist:
            cart = Cart(user_id=user_id)
            cart.save()
        return Response(cart_to_dict(cart))

    def post(self, request):
        user_id = get_user_id(request)
        if not user_id:
            return Response({'error': 'Token inválido'}, status=status.HTTP_401_UNAUTHORIZED)

        # Validar campos obligatorios
        slug = request.data.get('product_slug')
        if not slug:
            return Response({'error': 'product_slug es requerido'}, status=status.HTTP_400_BAD_REQUEST)

        price_raw = request.data.get('price_at_time')
        if price_raw is None:
            return Response({'error': 'price_at_time es requerido'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            price = float(price_raw)
        except (ValueError, TypeError):
            return Response({'error': 'price_at_time debe ser un número'}, status=status.HTTP_400_BAD_REQUEST)

        size = request.data.get('selected_size', '')
        color = request.data.get('selected_color', '')
        qty = int(request.data.get('quantity', 1))

        try:
            cart = Cart.objects.get(user_id=user_id)
        except Cart.DoesNotExist:
            cart = Cart(user_id=user_id)

        # Buscar si ya existe el mismo producto+talla+color
        for item in cart.items:
            if item.product_slug == slug and item.selected_size == size and item.selected_color == color:
                item.quantity += qty
                cart.calculate_totals()
                cart.save()
                return Response(cart_to_dict(cart), status=status.HTTP_200_OK)

        # Crear nuevo CartItem
        new_item = CartItem(
            product_slug=slug,
            product_name=request.data.get('product_name', ''),
            quantity=qty,
            selected_size=size,
            selected_color=color,
            price_at_time=price,
            image=request.data.get('image', ''),
        )
        cart.items.append(new_item)
        cart.calculate_totals()
        cart.save()
        return Response(cart_to_dict(cart), status=status.HTTP_201_CREATED)

    def put(self, request):
        user_id = get_user_id(request)
        if not user_id:
            return Response({'error': 'Token inválido'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            cart = Cart.objects.get(user_id=user_id)
        except Cart.DoesNotExist:
            return Response({'error': 'Carrito no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        slug = request.data.get('product_slug')
        size = request.data.get('selected_size')
        color = request.data.get('selected_color')
        qty = int(request.data.get('quantity', 1))

        if not slug or size is None or color is None:
            return Response({'error': 'Faltan datos para actualizar cantidad'}, status=400)

        for item in cart.items:
            if item.product_slug == slug and item.selected_size == size and item.selected_color == color:
                if qty <= 0:
                    cart.items.remove(item)
                else:
                    item.quantity = qty
                break

        cart.calculate_totals()
        cart.save()
        return Response(cart_to_dict(cart))

    def delete(self, request):
        user_id = get_user_id(request)
        if not user_id:
            return Response({'error': 'Token inválido'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            cart = Cart.objects.get(user_id=user_id)
        except Cart.DoesNotExist:
            return Response({'error': 'Carrito no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        slug = request.data.get('product_slug')
        size = request.data.get('selected_size')
        color = request.data.get('selected_color')

        if not slug or size is None or color is None:
            return Response({'error': 'Faltan datos para eliminar producto'}, status=400)

        # Filtrar items (eliminar el que coincida)
        cart.items = [i for i in cart.items if not (i.product_slug == slug and i.selected_size == size and i.selected_color == color)]
        cart.calculate_totals()
        cart.save()
        return Response(cart_to_dict(cart))
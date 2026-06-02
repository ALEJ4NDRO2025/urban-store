from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from django.core.mail import send_mail
from .models import Order, OrderItem, ShippingAddress
from cart.models import Cart
from products.models import Product          # ← Para descontar stock
import jwt
from datetime import datetime, timedelta
from django.utils import timezone


# ═══════════════════════════════════════════════════════════════════════════
# FUNCIONES AUXILIARES
# ═══════════════════════════════════════════════════════════════════════════

def get_user_id(request):
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return None
    try:
        payload = jwt.decode(auth.split(' ')[1], settings.SECRET_KEY, algorithms=['HS256'])
        return payload.get('email')
    except:
        return None


def is_admin(request):
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return False
    try:
        payload = jwt.decode(auth.split(' ')[1], settings.SECRET_KEY, algorithms=['HS256'])
        return payload.get('is_admin', False)
    except:
        return False


def order_to_dict(order):
    return {
        'id': str(order.id),
        'order_number': order.order_number,
        'user_id': order.user_id,
        'items': [{
            'product_slug': i.product_slug,
            'product_name': i.product_name,
            'quantity': i.quantity,
            'size': i.size,
            'color': i.color,
            'price_paid': i.price_paid,
            'subtotal': i.subtotal,
        } for i in order.items],
        'subtotal': order.subtotal,
        'tax': order.tax,
        'shipping': order.shipping,
        'total': order.total,
        'status': order.status,
        'shipping_address': {
            'email': order.shipping_address.email,
            'name': order.shipping_address.name,
            'phone': order.shipping_address.phone,
            'address': order.shipping_address.address,
            'city': order.shipping_address.city,
            'department': order.shipping_address.department,
            'country': order.shipping_address.country,
        },
        'notes': order.notes,
        'created_at': order.created_at.isoformat(),
        'expires_at': order.expires_at.isoformat() if order.expires_at else None,
        'paid_at': order.paid_at.isoformat() if order.paid_at else None
    }


# ═══════════════════════════════════════════════════════════════════════════
# VISTAS
# ═══════════════════════════════════════════════════════════════════════════

class CreateOrderView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        user_id = get_user_id(request)
        if not user_id:
            return Response({'error': 'Token inválido'}, status=status.HTTP_401_UNAUTHORIZED)

        # ─── 1. Intentar obtener items desde el body del frontend ───
        items_data = request.data.get('items', [])
        
        if items_data:
            order_items = [
                OrderItem(
                    product_slug=item.get('product_slug'),
                    product_name=item.get('product_name', ''),
                    quantity=item.get('quantity', 1),
                    size=item.get('selected_size', ''),
                    color=item.get('selected_color', ''),
                    price_paid=item.get('price_paid', 0),
                    subtotal=item.get('price_paid', 0) * item.get('quantity', 1),
                )
                for item in items_data
            ]
        else:
            # ─── 2. Si no, usar el carrito de la base de datos ───
            try:
                cart = Cart.objects.get(user_id=user_id)
            except Cart.DoesNotExist:
                return Response({'error': 'El carrito está vacío'}, status=status.HTTP_400_BAD_REQUEST)

            if not cart.items:
                return Response({'error': 'El carrito está vacío'}, status=status.HTTP_400_BAD_REQUEST)

            order_items = [
                OrderItem(
                    product_slug=i.product_slug,
                    product_name=i.product_name,
                    quantity=i.quantity,
                    size=i.selected_size,
                    color=i.selected_color,
                    price_paid=i.price_at_time,
                    subtotal=i.price_at_time * i.quantity,
                ) for i in cart.items
            ]

        addr = request.data.get('shipping_address')
        if not addr:
            return Response({'error': 'Dirección de envío requerida'}, status=status.HTTP_400_BAD_REQUEST)

        # Crear la orden
        order = Order(
            user_id=user_id,
            order_number=Order.generate_order_number(),
            items=order_items,
            subtotal=sum(item.subtotal for item in order_items),
            total=sum(item.subtotal for item in order_items),
            shipping_address=ShippingAddress(
                email=addr.get('email', user_id),
                name=addr.get('name', ''),
                phone=addr.get('phone', ''),
                address=addr.get('address', ''),
                city=addr.get('city', ''),
                department=addr.get('department', ''),
                country=addr.get('country', 'Colombia'),
            ),
            notes=request.data.get('notes', ''),
            expires_at=timezone.now() + timedelta(minutes=5)
        )
        order.save()

        # ─── DESCONTAR STOCK DE PRODUCTOS ───
        for item in order.items:
            product = Product.objects(slug=item.product_slug).first()
            if not product:
                continue

            variant_key = f"{item.size}|{item.color}"

            # Si existe stock_by_variant y la clave está presente, descontar ahí
            if product.stock_by_variant and variant_key in product.stock_by_variant:
                current = product.stock_by_variant[variant_key]
                new_qty = max(0, current - item.quantity)
                product.stock_by_variant[variant_key] = new_qty
                product.save()
            else:
                # Fallback: descontar del stock general
                new_stock = max(0, product.stock - item.quantity)
                product.update(stock=new_stock)

        # Vaciar el carrito en BD solo si se usó
        if not items_data:
            cart.items = []
            cart.calculate_totals()
            cart.save()

        # ─── ENVIAR CORREO DE CONFIRMACIÓN ───
        items_html = ""
        for item in order.items:
            items_html += f"""
            <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #333333;">
                    <span style="font-weight: 500;">{item.product_name}</span><br>
                    <span style="font-size: 13px; color: #C0C0C0;">
                        {item.size} · {item.color} · Cantidad: {item.quantity}
                    </span>
                </td>
                <td style="padding: 12px 0; border-bottom: 1px solid #333333; text-align: right; font-weight: 700; color: #B8860B;">
                    ${item.subtotal:,.0f}
                </td>
            </tr>
            """

        html_message = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {{ margin: 0; padding: 0; background-color: #0D0D0D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FFFFFF; }}
                .container {{ max-width: 600px; margin: 40px auto; background-color: #1A1A1A; border-radius: 16px; border: 1px solid #333333; box-shadow: 0 8px 24px rgba(0,0,0,0.5); overflow: hidden; }}
                .header {{ background: linear-gradient(135deg, #B8860B 0%, #D4A017 100%); padding: 30px 20px; text-align: center; }}
                .header h1 {{ margin: 0; color: #0D0D0D; font-size: 28px; font-weight: 800; letter-spacing: 2px; }}
                .header p {{ margin: 10px 0 0; color: #0D0D0D; font-size: 16px; font-weight: 500; }}
                .content {{ padding: 30px 25px; }}
                .greeting {{ font-size: 20px; margin-bottom: 10px; color: #C0C0C0; }}
                .message {{ font-size: 15px; color: #C0C0C0; margin-bottom: 25px; line-height: 1.6; }}
                .order-number {{ background-color: #262626; padding: 10px 15px; border-radius: 8px; text-align: center; margin-bottom: 25px; border: 1px solid #B8860B; }}
                .order-number span {{ color: #B8860B; font-weight: 700; font-size: 18px; }}
                table {{ width: 100%; border-collapse: collapse; margin-bottom: 25px; }}
                .shipping-box {{ background-color: #262626; padding: 18px; border-radius: 8px; margin-bottom: 25px; }}
                .shipping-box h3 {{ margin: 0 0 12px 0; color: #C0C0C0; font-size: 16px; }}
                .shipping-box p {{ margin: 5px 0; color: #C0C0C0; font-size: 14px; }}
                .total-row {{ font-size: 18px; font-weight: 700; color: #B8860B; }}
                .footer {{ background-color: #0D0D0D; padding: 20px; text-align: center; border-top: 1px solid #333333; color: #808080; font-size: 12px; }}
                .footer a {{ color: #B8860B; text-decoration: none; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>URBAN STORE</h1>
                    <p>¡Gracias por tu compra!</p>
                </div>
                <div class="content">
                    <div class="greeting">¡Hola, {order.shipping_address.name}!</div>
                    <div class="message">
                        Tu pedido ha sido confirmado y está siendo procesado.<br>
                        Te notificaremos cuando sea enviado.
                    </div>
                    <div class="order-number">
                        Número de pedido: <span>#{order.order_number}</span>
                    </div>
                    
                    <h3 style="margin-bottom: 15px; color: #C0C0C0;">Resumen del pedido</h3>
                    <table>
                        {items_html}
                    </table>
                    
                    <table style="margin-bottom: 25px;">
                        <tr><td style="padding: 5px 0; color: #C0C0C0;">Subtotal</td><td style="padding: 5px 0; text-align: right; color: #C0C0C0;">${order.subtotal:,.0f}</td></tr>
                        <tr><td style="padding: 5px 0; color: #C0C0C0;">Envío</td><td style="padding: 5px 0; text-align: right; color: #C0C0C0;">${order.shipping:,.0f}</td></tr>
                        <tr><td style="padding: 5px 0; color: #C0C0C0;">Impuestos</td><td style="padding: 5px 0; text-align: right; color: #C0C0C0;">${order.tax:,.0f}</td></tr>
                        <tr class="total-row"><td style="padding: 10px 0; border-top: 1px solid #333333;">TOTAL</td><td style="padding: 10px 0; border-top: 1px solid #333333; text-align: right;">${order.total:,.0f}</td></tr>
                    </table>
                    
                    <div class="shipping-box">
                        <h3>Dirección de envío</h3>
                        <p><strong>{order.shipping_address.name}</strong></p>
                        <p>{order.shipping_address.address}</p>
                        <p>{order.shipping_address.city}, {order.shipping_address.department}</p>
                        <p>{order.shipping_address.country}</p>
                        <p>📞 {order.shipping_address.phone}</p>
                        <p>✉️ {order.shipping_address.email}</p>
                    </div>
                    
                    {f'<p style="color: #808080; font-style: italic; margin-top: 20px;">Nota: {order.notes}</p>' if order.notes else ''}
                </div>
                <div class="footer">
                    © 2026 Urban Store. Todos los derechos reservados.<br>
                    <a href="#">goldenash04@gmail.com</a>
                </div>
            </div>
        </body>
        </html>
        """

        items_text = "\n".join([f"- {i.product_name} x{i.quantity}: ${i.subtotal:,.0f}" for i in order.items])
        text_message = f"""
¡Gracias por tu compra, {order.shipping_address.name}!

Tu pedido #{order.order_number} ha sido confirmado.

Resumen:
{items_text}

Total: ${order.total:,.0f}

Dirección de envío:
{order.shipping_address.name}
{order.shipping_address.address}
{order.shipping_address.city}, {order.shipping_address.department}
{order.shipping_address.country}
Tel: {order.shipping_address.phone}

Gracias por confiar en Urban Store.
"""

        send_mail(
            subject=f'Confirmación de pedido #{order.order_number} - Urban Store',
            message=text_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.shipping_address.email],
            html_message=html_message,
            fail_silently=False,
        )

        return Response(order_to_dict(order), status=status.HTTP_201_CREATED)


class OrderDetailView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request, order_id):
        user_id = get_user_id(request)
        if not user_id:
            return Response({'error': 'Token inválido'}, status=status.HTTP_401_UNAUTHORIZED)

        admin = is_admin(request)

        try:
            if admin:
                order = Order.objects.get(id=order_id)
            else:
                order = Order.objects.get(id=order_id, user_id=user_id)
        except Order.DoesNotExist:
            return Response({'error': 'Orden no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        return Response(order_to_dict(order), status=status.HTTP_200_OK)


class UserOrdersView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        user_id = get_user_id(request)
        if not user_id:
            return Response({'error': 'Token inválido'}, status=status.HTTP_401_UNAUTHORIZED)

        orders = Order.objects.filter(user_id=user_id).order_by('-created_at')
        return Response([order_to_dict(o) for o in orders], status=status.HTTP_200_OK)


class AllOrdersView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        if not is_admin(request):
            return Response({'error': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)

        orders = Order.objects.all().order_by('-created_at')
        return Response([order_to_dict(o) for o in orders], status=status.HTTP_200_OK)


class UpdateOrderStatusView(APIView):
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
            order.paid_at = timezone.now()
        order.updated_at = timezone.now()
        order.save()

        return Response(order_to_dict(order), status=status.HTTP_200_OK)
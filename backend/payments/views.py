# backend/payments/views.py
# ============================================================
# MÓDULO DE PAGOS CON STRIPE
# ============================================================

import stripe
from django.conf import settings
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from orders.models import Order
import jwt
from datetime import datetime  # ← AÑADIDO: para registrar paid_at
from django.utils import timezone

# Configurar la clave secreta de Stripe (modo test o live)
stripe.api_key = settings.STRIPE_SECRET_KEY

# ============================================================
# FUNCIÓN AUXILIAR: extraer email del token JWT manualmente
# ============================================================
def get_user_id(request):
    """
    Extrae el email del usuario desde el token JWT enviado en el header.
    No depende de DRF, solo de PyJWT.
    """
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return None
    try:
        # El token viene como "Bearer <token>"
        token = auth.split(' ')[1]
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        # El payload tiene el campo 'email' (verifica que exista en tu token)
        return payload.get('email')
    except Exception:
        return None

# ============================================================
# VISTA 1: CREAR PAYMENT INTENT (para iniciar el pago)
# ============================================================
class CreatePaymentIntentView(APIView):
    """
    Crea un PaymentIntent en Stripe para una orden específica.
    Requiere autenticación JWT (manual) y que la orden pertenezca al usuario.
    Devuelve client_secret que usará el frontend.
    """
    authentication_classes = []  # Deshabilitamos DRF auth
    permission_classes = []

    def post(self, request):
        # 1. Validar token
        user_id = get_user_id(request)
        if not user_id:
            return Response({'error': 'Token inválido'}, status=status.HTTP_401_UNAUTHORIZED)

        # 2. Validar que se envió order_id
        order_id = request.data.get('order_id')
        if not order_id:
            return Response({'error': 'order_id requerido'}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Buscar la orden y verificar que pertenezca al usuario
        try:
            order = Order.objects.get(id=order_id, user_id=user_id)
        except Order.DoesNotExist:
            return Response({'error': 'Orden no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        # 4. Verificar que la orden aún está pendiente (no pagada ni cancelada)
        if order.status != 'pending':
            return Response({'error': 'La orden ya fue procesada'}, status=status.HTTP_400_BAD_REQUEST)

        # 5. Crear PaymentIntent en Stripe
        try:
            intent = stripe.PaymentIntent.create(
                amount=int(order.total * 100),      # Stripe usa centavos
                currency='cop',                     # Moneda colombiana
                metadata={'order_id': str(order.id)} # Para identificar la orden en webhook
            )
            # Guardar el ID del PaymentIntent en la orden (útil para referencias futuras)
            order.payment_intent_id = intent.id
            order.save()
            # Devolver client_secret al frontend
            return Response({'client_secret': intent.client_secret})
        except stripe.error.StripeError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

# ============================================================
# VISTA 2: CONFIRMAR PAGO (se llama desde la página de éxito)
# ============================================================
class ConfirmPaymentView(APIView):
    """
    Verifica el estado de un PaymentIntent en Stripe y actualiza la orden.
    Se llama desde el frontend después de que Stripe redirige.
    """
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        # 1. Autenticación manual
        user_id = get_user_id(request)
        if not user_id:
            return Response({'error': 'Token inválido'}, status=status.HTTP_401_UNAUTHORIZED)

        # 2. Obtener parámetros del body
        order_id = request.data.get('order_id')
        payment_intent_id = request.data.get('payment_intent_id')
        if not order_id or not payment_intent_id:
            return Response(
                {'error': 'order_id y payment_intent_id requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3. Buscar la orden (debe pertenecer al usuario)
        try:
            order = Order.objects.get(id=order_id, user_id=user_id)
        except Order.DoesNotExist:
            return Response({'error': 'Orden no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        # 4. Consultar el estado del PaymentIntent en Stripe
        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        except stripe.error.StripeError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # 5. Si el pago fue exitoso, actualizar la orden a 'paid'
        if intent.status == 'succeeded':
            order.status = 'paid'
            # Añadimos la fecha de pago (opcional pero útil)
            order.paid_at = timezone.now()
            order.expires_at = None  # Si usas expiración, puedes manejarla aquí
            order.save()
            return Response({
                'status': 'paid',
                'message': 'Pago confirmado'
            }, status=status.HTTP_200_OK)
        else:
            # Cualquier otro estado (pending, requires_action, etc.)
            return Response({
                'status': intent.status,
                'message': f'Pago no completado. Estado actual: {intent.status}'
            }, status=status.HTTP_400_BAD_REQUEST)
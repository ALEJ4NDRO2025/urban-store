import stripe
from django.conf import settings
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from orders.models import Order
import jwt

stripe.api_key = settings.STRIPE_SECRET_KEY

def get_user_id(request):
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return None
    try:
        payload = jwt.decode(auth.split(' ')[1], settings.SECRET_KEY, algorithms=['HS256'])
        return payload.get('email')
    except:
        return None

class CreatePaymentIntentView(APIView):
    # Deshabilitar completamente la autenticación de DRF
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        user_id = get_user_id(request)
        if not user_id:
            return Response({'error': 'Token inválido'}, status=status.HTTP_401_UNAUTHORIZED)

        order_id = request.data.get('order_id')
        if not order_id:
            return Response({'error': 'order_id requerido'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            order = Order.objects.get(id=order_id, user_id=user_id)
        except Order.DoesNotExist:
            return Response({'error': 'Orden no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        if order.status != 'pending':
            return Response({'error': 'La orden ya fue procesada'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            intent = stripe.PaymentIntent.create(
                amount=int(order.total * 100),
                currency='cop',
                metadata={'order_id': str(order.id)},
            )
            order.payment_intent_id = intent.id
            order.save()
            return Response({'client_secret': intent.client_secret})
        except stripe.error.StripeError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
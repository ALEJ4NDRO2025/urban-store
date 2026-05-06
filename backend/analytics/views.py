# backend/analytics/views.py
import uuid
from datetime import timedelta

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.conf import settings
import jwt

from .models import Event

# ============================================================
# FUNCIONES AUXILIARES
# ============================================================

def get_user_id_from_token(request):
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return None
    try:
        token = auth.split(' ')[1]
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        return payload.get('email')
    except Exception:
        return None

def is_admin(request):
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return False
    try:
        token = auth.split(' ')[1]
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        return payload.get('is_admin', False)
    except Exception:
        return False

def get_session_id(request):
    session_id = request.headers.get('X-Session-ID')
    if not session_id:
        session_id = request.COOKIES.get('session_id')
    if not session_id:
        session_id = str(uuid.uuid4())
    return session_id

# ============================================================
# VISTA 1: REGISTRAR EVENTO (público)
# ============================================================
class TrackEventView(APIView):
    authentication_classes = []   # ← Deshabilitar autenticación DRF
    permission_classes = []

    def post(self, request):
        data = request.data
        user_id = get_user_id_from_token(request)  # puede ser None
        session_id = get_session_id(request)

        event = Event(
            user_id=user_id,
            session_id=session_id,
            event_type=data.get('event_type'),
            product_slug=data.get('product_slug'),
            product_name=data.get('product_name'),
            price=data.get('price'),
            metadata=data.get('metadata', {}),
        )
        event.save()
        return Response({'status': 'ok'}, status=status.HTTP_201_CREATED)

# ============================================================
# VISTA 2: ESTADÍSTICAS DASHBOARD (solo admin)
# ============================================================
class DashboardStatsView(APIView):
    authentication_classes = []   # ← Deshabilitar autenticación DRF
    permission_classes = []

    def get(self, request):
        if not is_admin(request):
            return Response({'error': 'No autorizado. Se requieren permisos de administrador.'},
                            status=status.HTTP_403_FORBIDDEN)

        end_date = timezone.now()
        start_date = end_date - timedelta(days=7)

        purchase_events = Event.objects(
            event_type='purchase',
            created_at__gte=start_date,
            created_at__lte=end_date
        )
        total_sales = purchase_events.count()

        # Top productos
        product_counts = {}
        for ev in purchase_events:
            slug = ev.product_slug
            qty = ev.metadata.get('quantity', 1) if ev.metadata else 1
            product_counts[slug] = product_counts.get(slug, 0) + qty
        top_products = [{'slug': k, 'count': v} for k, v in sorted(product_counts.items(), key=lambda x: x[1], reverse=True)[:5]]

        # Ventas por día
        sales_by_day = {}
        for ev in purchase_events:
            day_str = ev.created_at.strftime('%Y-%m-%d')
            sales_by_day[day_str] = sales_by_day.get(day_str, 0) + 1
        sales_by_day_list = [{'date': d, 'count': c} for d, c in sorted(sales_by_day.items())]

        # Tasa de abandono
        begin_sessions = set(Event.objects(event_type='begin_checkout', created_at__gte=start_date).scalar('session_id'))
        purchase_sessions = set(purchase_events.scalar('session_id'))
        abandoned = len(begin_sessions - purchase_sessions)
        abandonment_rate = round((abandoned / len(begin_sessions)) * 100, 1) if begin_sessions else 0

        event_counts = {
            'product_view': Event.objects(event_type='product_view', created_at__gte=start_date).count(),
            'add_to_cart': Event.objects(event_type='add_to_cart', created_at__gte=start_date).count(),
            'begin_checkout': len(begin_sessions),
            'purchase': total_sales,
        }

        return Response({
            'total_sales': total_sales,
            'top_products': top_products,
            'sales_by_day': sales_by_day_list,
            'abandonment_rate': abandonment_rate,
            'event_counts': event_counts,
        })
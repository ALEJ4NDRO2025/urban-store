import uuid
from datetime import datetime, timedelta
import hashlib
import time

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
    """Extrae el email del usuario desde el token JWT (si existe)."""
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
    """Verifica si el token JWT tiene el campo is_admin = True."""
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
    """Obtiene el session_id desde el header X-Session-ID, cookies o genera uno nuevo."""
    session_id = request.headers.get('X-Session-ID')
    if not session_id:
        session_id = request.COOKIES.get('session_id')
    if not session_id:
        session_id = str(uuid.uuid4())
    return session_id


def get_event_identifier(ev):
    """Devuelve user_id (si existe) o session_id, para agrupar eventos de un mismo usuario."""
    return ev.user_id if ev.user_id else ev.session_id


def get_unique_sessions(start_date, end_date, steps=None):
    """
    Calcula cuántas sesiones únicas (session_id) realizaron cada tipo de evento
    dentro del rango [start_date, end_date].

    Pasos por defecto: embudo de conversión estándar.
    Retorna lista de dicts: [{"step": "page_view", "count": 123}, ...]
    """
    if steps is None:
        steps = ['page_view', 'product_view', 'add_to_cart', 'begin_checkout', 'purchase']

    funnel = []
    for step in steps:
        pipeline = [
            {"$match": {
                "event_type": step,
                "created_at": {"$gte": start_date, "$lte": end_date},
                "session_id": {"$ne": None}
            }},
            {"$group": {"_id": "$session_id"}},
            {"$count": "count"}
        ]
        result = list(Event.objects.aggregate(*pipeline))
        count = result[0]['count'] if result else 0
        funnel.append({"step": step, "count": count})
    return funnel


# ============================================================
# VISTA 1: REGISTRAR EVENTO (público) – con idempotencia
# ============================================================
class TrackEventView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        data = request.data
        user_id = get_user_id_from_token(request)

        # Usar el session_id enviado por el frontend (estable en localStorage)
        session_id = data.get('session_id') or get_session_id(request)

        # Generar clave de idempotencia (si no viene) para evitar duplicados
        idempotency_key = data.get('idempotency_key')
        if not idempotency_key:
            raw = f"{session_id}|{data.get('event_type')}|{data.get('product_slug')}|{time.time()}"
            idempotency_key = hashlib.sha256(raw.encode()).hexdigest()

        # Verificar duplicado en ventana de 5 segundos
        recent_window = timezone.now() - timedelta(seconds=5)
        duplicate = Event.objects(
            idempotency_key=idempotency_key,
            created_at__gte=recent_window
        ).first()
        if duplicate:
            return Response(
                {'status': 'duplicate_ignored'},
                status=status.HTTP_200_OK
            )

        # Crear y guardar el evento con protección ante fallos del índice unique
        event = Event(
            user_id=user_id,
            session_id=session_id,
            event_type=data.get('event_type'),
            product_slug=data.get('product_slug'),
            product_name=data.get('product_name'),
            price=data.get('price'),
            metadata=data.get('metadata', {}),
            error_message=data.get('error_message'),
            idempotency_key=idempotency_key,
        )
        try:
            event.save()
        except Exception as e:
            print(f"Error guardando evento (ignorado): {e}")
        return Response({'status': 'ok'}, status=status.HTTP_201_CREATED)


# ============================================================
# VISTA 2: ESTADÍSTICAS DASHBOARD (solo admin)
# Ahora con soporte de métricas únicas por sesión (mode=unique),
# manteniendo unidades totales vendidas y con métricas de retención.
# ============================================================
class DashboardStatsView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        if not is_admin(request):
            return Response(
                {'error': 'No autorizado. Se requieren permisos de administrador.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Parámetro opcional: ?mode=unique → métricas por sesiones únicas
        mode = request.query_params.get('mode', 'total')

        end_date = timezone.now()
        start_date = end_date - timedelta(days=7)

        # ------------------------------------------------------------
        # 1. Eventos de compra (purchase)
        # ------------------------------------------------------------
        purchase_events = Event.objects(
            event_type='purchase',
            created_at__gte=start_date,
            created_at__lte=end_date
        )
        total_sales = purchase_events.count()  # unidades totales (no cambia)

        # ------------------------------------------------------------
        # 2. Ingresos totales y valor promedio de pedido
        # ------------------------------------------------------------
        total_revenue = 0
        for ev in purchase_events:
            try:
                price = float(ev.price) if ev.price else 0
            except (ValueError, TypeError):
                price = 0
            qty = ev.metadata.get('quantity', 1) if ev.metadata else 1
            total_revenue += price * qty
        average_order_value = round(total_revenue / total_sales, 2) if total_sales > 0 else 0

        # ------------------------------------------------------------
        # 3. Top productos más vendidos (por unidades totales)
        # ------------------------------------------------------------
        product_counts = {}
        for ev in purchase_events:
            slug = ev.product_slug
            qty = ev.metadata.get('quantity', 1) if ev.metadata else 1
            product_counts[slug] = product_counts.get(slug, 0) + qty
        top_products = [
            {'slug': k, 'count': v}
            for k, v in sorted(product_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        ]

        # ------------------------------------------------------------
        # 4. Top productos más vistos (según el modo)
        # ------------------------------------------------------------
        if mode == 'unique':
            # Vistas únicas: cuenta sesiones distintas que vieron cada producto
            pipeline = [
                {"$match": {"event_type": "product_view", "created_at": {"$gte": start_date, "$lte": end_date}}},
                {"$group": {"_id": {"product_slug": "$product_slug", "session_id": "$session_id"}}},
                {"$group": {"_id": "$_id.product_slug", "unique_views": {"$sum": 1}}},
                {"$sort": {"unique_views": -1}},
                {"$limit": 5}
            ]
            top_viewed_unique = list(Event.objects.aggregate(*pipeline))
            top_viewed = [{'slug': item['_id'], 'count': item['unique_views']} for item in top_viewed_unique]
        else:
            # Modo total: suma de todos los eventos product_view
            view_events = Event.objects(
                event_type='product_view',
                created_at__gte=start_date,
                created_at__lte=end_date
            )
            view_counts = {}
            for ev in view_events:
                slug = ev.product_slug
                view_counts[slug] = view_counts.get(slug, 0) + 1
            top_viewed = [
                {'slug': k, 'count': v}
                for k, v in sorted(view_counts.items(), key=lambda x: x[1], reverse=True)[:5]
            ]

        # ------------------------------------------------------------
        # 5. Ventas por día (total, sin cambios)
        # ------------------------------------------------------------
        sales_by_day = {}
        for ev in purchase_events:
            day_str = ev.created_at.strftime('%Y-%m-%d')
            sales_by_day[day_str] = sales_by_day.get(day_str, 0) + 1
        sales_by_day_list = [
            {'date': d, 'count': c}
            for d, c in sorted(sales_by_day.items())
        ]

        # ------------------------------------------------------------
        # 6. Tasa de abandono (begin_checkout vs purchase)
        # ------------------------------------------------------------
        begin_checkout_events = Event.objects(
            event_type='begin_checkout',
            created_at__gte=start_date,
            created_at__lte=end_date
        )
        checkout_identifiers = set()
        for ev in begin_checkout_events:
            checkout_identifiers.add(get_event_identifier(ev))

        purchase_identifiers = set()
        for ev in purchase_events:
            purchase_identifiers.add(get_event_identifier(ev))

        abandoned = len(checkout_identifiers - purchase_identifiers)
        abandonment_rate = round(
            (abandoned / len(checkout_identifiers)) * 100, 1
        ) if checkout_identifiers else 0

        # ------------------------------------------------------------
        # 7. Conteo de eventos por tipo (según el modo)
        # ------------------------------------------------------------
        if mode == 'unique':
            # Contar sesiones únicas para cada tipo
            product_views_unique = len(set(
                Event.objects(
                    event_type='product_view',
                    created_at__gte=start_date,
                    created_at__lte=end_date
                ).values_list('session_id')
            ))
            add_to_cart_unique = len(set(
                Event.objects(
                    event_type='add_to_cart',
                    created_at__gte=start_date,
                    created_at__lte=end_date
                ).values_list('session_id')
            ))
            begin_checkouts = len(checkout_identifiers)
            purchases = len(purchase_identifiers)

            event_counts = {
                'product_view': product_views_unique,
                'add_to_cart': add_to_cart_unique,
                'begin_checkout': begin_checkouts,
                'purchase': purchases,
            }
        else:
            # Modo total (original)
            add_to_cart_events = Event.objects(
                event_type='add_to_cart',
                created_at__gte=start_date,
                created_at__lte=end_date
            ).count()
            view_events = Event.objects(
                event_type='product_view',
                created_at__gte=start_date,
                created_at__lte=end_date
            )
            product_views = view_events.count()
            begin_checkouts = len(checkout_identifiers)
            purchases = total_sales

            event_counts = {
                'product_view': product_views,
                'add_to_cart': add_to_cart_events,
                'begin_checkout': begin_checkouts,
                'purchase': purchases,
            }

        # ------------------------------------------------------------
        # 8. Tasas de conversión del embudo básico
        # ------------------------------------------------------------
        conversion_rates = {
            'visit_to_cart': round(
                (event_counts['add_to_cart'] / event_counts['product_view']) * 100, 1
            ) if event_counts['product_view'] > 0 else 0,
            'cart_to_checkout': round(
                (event_counts['begin_checkout'] / event_counts['add_to_cart']) * 100, 1
            ) if event_counts['add_to_cart'] > 0 else 0,
            'checkout_to_purchase': round(
                (event_counts['purchase'] / event_counts['begin_checkout']) * 100, 1
            ) if event_counts['begin_checkout'] > 0 else 0,
        }

        # ============================================================
        # MÉTRICAS DEL EMBUDO DE PAGO DETALLADO (sin cambios)
        # ============================================================
        checkout_started_count = Event.objects(
            event_type='checkout_started',
            created_at__gte=start_date,
            created_at__lte=end_date
        ).count()

        payment_info_entered_count = Event.objects(
            event_type='payment_info_entered',
            created_at__gte=start_date,
            created_at__lte=end_date
        ).count()

        order_completed_count = Event.objects(
            event_type='order_completed',
            created_at__gte=start_date,
            created_at__lte=end_date
        ).count()

        conversion_checkout_to_payment = round(
            (payment_info_entered_count / checkout_started_count) * 100, 1
        ) if checkout_started_count > 0 else 0

        conversion_payment_to_order = round(
            (order_completed_count / payment_info_entered_count) * 100, 1
        ) if payment_info_entered_count > 0 else 0

        error_counts = {
            'payment_error': Event.objects(
                event_type='payment_error',
                created_at__gte=start_date,
                created_at__lte=end_date
            ).count(),
            'checkout_error': Event.objects(
                event_type='checkout_error',
                created_at__gte=start_date,
                created_at__lte=end_date
            ).count(),
            'payment_confirmation_error': Event.objects(
                event_type='payment_confirmation_error',
                created_at__gte=start_date,
                created_at__lte=end_date
            ).count(),
        }

        # ------------------------------------------------------------
        # 9. Eventos por día (línea de tiempo) – totales, sin cambios
        # ------------------------------------------------------------
        events_by_day = {}
        current = start_date.date()
        while current <= end_date.date():
            events_by_day[current.isoformat()] = {
                'date': current.isoformat(),
                'product_view': 0,
                'add_to_cart': 0,
                'begin_checkout': 0,
                'purchase': 0,
                'checkout_started': 0,
                'payment_info_entered': 0,
                'order_completed': 0,
            }
            current += timedelta(days=1)

        for ev in Event.objects(created_at__gte=start_date, created_at__lte=end_date):
            day_str = ev.created_at.date().isoformat()
            if day_str in events_by_day:
                if ev.event_type in events_by_day[day_str]:
                    events_by_day[day_str][ev.event_type] += 1
        events_timeline = list(events_by_day.values())

        # ============================================================
        # 10. RENDIMIENTO POR PRODUCTO (según el modo)
        # ============================================================
        product_performance = []
        if mode == 'unique':
            # --- Vistas únicas por producto ---
            pipeline_views = [
                {"$match": {"event_type": "product_view", "created_at": {"$gte": start_date, "$lte": end_date}}},
                {"$group": {"_id": {"product_slug": "$product_slug", "session_id": "$session_id"}}},
                {"$group": {"_id": "$_id.product_slug", "unique_views": {"$sum": 1}}}
            ]
            unique_view_counts = {
                item['_id']: item['unique_views']
                for item in Event.objects.aggregate(*pipeline_views)
            }

            # --- Add to cart únicos (sesiones) ---
            pipeline_cart = [
                {"$match": {"event_type": "add_to_cart", "created_at": {"$gte": start_date, "$lte": end_date}}},
                {"$group": {"_id": {"product_slug": "$product_slug", "session_id": "$session_id"}}},
                {"$group": {"_id": "$_id.product_slug", "unique_cart": {"$sum": 1}}}
            ]
            unique_cart_counts = {
                item['_id']: item['unique_cart']
                for item in Event.objects.aggregate(*pipeline_cart)
            }

            # --- Compras únicas (sesiones) y unidades totales ---
            pipeline_purchases = [
                {"$match": {"event_type": "purchase", "created_at": {"$gte": start_date, "$lte": end_date}}},
                {"$group": {
                    "_id": {"product_slug": "$product_slug", "session_id": "$session_id"},
                    "qty": {"$sum": {"$ifNull": ["$metadata.quantity", 1]}}
                }},
                {"$group": {
                    "_id": "$_id.product_slug",
                    "unique_purchases": {"$sum": 1},
                    "total_units": {"$sum": "$qty"}
                }}
            ]
            purchase_data = {
                item['_id']: {
                    'sessions': item['unique_purchases'],
                    'units': item['total_units']
                }
                for item in Event.objects.aggregate(*pipeline_purchases)
            }

            # Construir product_performance combinando los tres
            all_slugs = set(unique_view_counts.keys()) | set(unique_cart_counts.keys()) | set(purchase_data.keys())
            for slug in all_slugs:
                views = unique_view_counts.get(slug, 0)
                add_to_cart = unique_cart_counts.get(slug, 0)
                purchase_info = purchase_data.get(slug, {'sessions': 0, 'units': 0})
                purchases_sessions = purchase_info['sessions']
                purchases_units = purchase_info['units']

                # Tasa de conversión: sesiones que compraron / sesiones que vieron
                rate = round((purchases_sessions / views) * 100, 1) if views > 0 else 0

                # Nombre del producto
                name = slug
                if slug != 'sin-slug':
                    ev = Event.objects(product_slug=slug).first()
                    if ev:
                        name = ev.product_name or slug

                product_performance.append({
                    'slug': slug,
                    'name': name,
                    'views': views,
                    'add_to_cart': add_to_cart,
                    'purchases': purchases_sessions,       # Sesiones únicas que compraron
                    'purchases_units': purchases_units,    # Unidades totales vendidas
                    'conversion_rate': rate,
                })
        else:
            # Modo total (original)
            all_events = Event.objects(created_at__gte=start_date, created_at__lte=end_date)
            product_data = {}
            for ev in all_events:
                slug = ev.product_slug or 'sin-slug'
                if slug not in product_data:
                    product_data[slug] = {
                        'slug': slug,
                        'name': ev.product_name or slug,
                        'views': 0,
                        'add_to_cart': 0,
                        'purchases': 0,
                    }
                if ev.event_type == 'product_view':
                    product_data[slug]['views'] += 1
                elif ev.event_type == 'add_to_cart':
                    product_data[slug]['add_to_cart'] += 1
                elif ev.event_type == 'purchase':
                    qty = ev.metadata.get('quantity', 1) if ev.metadata else 1
                    product_data[slug]['purchases'] += qty

            for slug, data in product_data.items():
                views = data['views']
                purchases = data['purchases']
                rate = round((purchases / views) * 100, 1) if views > 0 else 0
                product_performance.append({
                    'slug': slug,
                    'name': data['name'],
                    'views': views,
                    'add_to_cart': data['add_to_cart'],
                    'purchases': purchases,            # Unidades totales
                    'conversion_rate': rate,
                })

        product_performance.sort(key=lambda x: x['views'], reverse=True)

        # ============================================================
        # 11. ERRORES POR DÍA (sin cambios)
        # ============================================================
        errors_by_day = {}
        current = start_date.date()
        end_d = end_date.date()
        while current <= end_d:
            errors_by_day[current.isoformat()] = {
                'date': current.isoformat(),
                'payment_error': 0,
                'checkout_error': 0,
                'payment_confirmation_error': 0,
                'address_error': 0,
            }
            current += timedelta(days=1)

        error_events = Event.objects(
            event_type__in=['payment_error', 'checkout_error',
                            'payment_confirmation_error', 'address_error'],
            created_at__gte=start_date,
            created_at__lte=end_date
        )
        for ev in error_events:
            day_str = ev.created_at.date().isoformat()
            if day_str in errors_by_day:
                if ev.event_type in errors_by_day[day_str]:
                    errors_by_day[day_str][ev.event_type] += 1

        errors_timeline = list(errors_by_day.values())

        # ============================================================
        # 12. ESTADÍSTICAS DE SESIÓN (sin cambios)
        # ============================================================
        pipeline = [
            {"$match": {"created_at": {"$gte": start_date, "$lte": end_date}}},
            {"$group": {
                "_id": "$session_id",
                "event_count": {"$sum": 1},
                "has_purchase": {"$max": {"$cond": [{"$eq": ["$event_type", "purchase"]}, 1, 0]}}
            }},
            {"$project": {
                "session_id": "$_id",
                "event_count": 1,
                "has_purchase": 1,
                "_id": 0
            }}
        ]
        session_stats_raw = list(Event.objects.aggregate(*pipeline))

        unique_sessions = len(session_stats_raw)
        avg_events_per_session = round(
            sum(s['event_count'] for s in session_stats_raw) / unique_sessions, 1
        ) if unique_sessions > 0 else 0
        sessions_with_purchase = sum(1 for s in session_stats_raw if s['has_purchase'] == 1)

        session_stats = {
            'unique_sessions': unique_sessions,
            'avg_events_per_session': avg_events_per_session,
            'sessions_with_purchase': sessions_with_purchase,
        }

        # ============================================================
        # 🆕 13. MÉTRICAS DE RETENCIÓN (Fase 2)
        # ============================================================
        retention_days = 90
        retention_start = end_date - timedelta(days=retention_days)

        # Tasa de recompra: clientes con más de una compra en el período
        pipeline_rebuy = [
            {"$match": {"event_type": "purchase", "created_at": {"$gte": retention_start, "$lte": end_date}}},
            {"$group": {"_id": "$user_id", "compras": {"$sum": 1}}},
            {"$match": {"compras": {"$gt": 1}}},
            {"$count": "recurrentes"}
        ]
        recurrent_customers_result = list(Event.objects.aggregate(*pipeline_rebuy))
        recurrent_count = recurrent_customers_result[0]['recurrentes'] if recurrent_customers_result else 0

        total_unique_buyers = len(set(
            Event.objects(
                event_type='purchase',
                created_at__gte=retention_start,
                created_at__lte=end_date
            ).values_list('user_id')
        ))
        repurchase_rate = round((recurrent_count / total_unique_buyers) * 100, 1) if total_unique_buyers > 0 else 0

        retention_metrics = {
            'repurchase_rate': repurchase_rate,
            'recurrent_customers': recurrent_count,
            'total_unique_buyers': total_unique_buyers,
            'period_days': retention_days,
        }

        # ============================================================
        # RESPUESTA FINAL ENRIQUECIDA
        # ============================================================
        return Response({
            'mode': mode,
            'total_sales': total_sales,
            'total_revenue': round(total_revenue, 2),
            'average_order_value': average_order_value,
            'top_products': top_products,
            'top_viewed_products': top_viewed,
            'sales_by_day': sales_by_day_list,
            'events_timeline': events_timeline,
            'abandonment_rate': abandonment_rate,
            'event_counts': event_counts,
            'conversion_rates': conversion_rates,

            'checkout_started_count': checkout_started_count,
            'payment_info_entered_count': payment_info_entered_count,
            'order_completed_count': order_completed_count,
            'conversion_checkout_to_payment': conversion_checkout_to_payment,
            'conversion_payment_to_order': conversion_payment_to_order,
            'error_counts': error_counts,

            'product_performance': product_performance[:10],
            'errors_timeline': errors_timeline,
            'session_stats': session_stats,

            'retention_metrics': retention_metrics,   # ← NUEVO
        })


# ============================================================
# 🆕 VISTA 3: ANÁLISIS RFM (Recency, Frequency, Monetary)
# ============================================================
class RFMView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        if not is_admin(request):
            return Response(
                {'error': 'No autorizado. Se requieren permisos de administrador.'},
                status=status.HTTP_403_FORBIDDEN
            )

        end_date = timezone.now()
        start_date = end_date - timedelta(days=90)  # Período de análisis RFM

        # Pipeline para agrupar compras por usuario
        pipeline = [
            {"$match": {"event_type": "purchase", "created_at": {"$gte": start_date, "$lte": end_date}}},
            {"$group": {
                "_id": "$user_id",
                "last_purchase": {"$max": "$created_at"},
                "frequency": {"$sum": 1},
                "monetary": {"$sum": {"$toDouble": "$price"}}
            }}
        ]
        rfm_data = list(Event.objects.aggregate(*pipeline))

        resultados = []
        for r in rfm_data:
            last_purchase = r['last_purchase']
            # ⚠️ CORRECCIÓN: Asegurar que last_purchase tenga zona horaria (UTC)
            if timezone.is_naive(last_purchase):
                last_purchase = timezone.make_aware(last_purchase, timezone.utc)

            recency = (end_date - last_purchase).days
            freq = r['frequency']
            money = r['monetary']

            # Clasificación simple basada en umbrales (ajustables)
            if recency <= 7 and freq >= 2 and money >= 100000:
                segmento = 'VIP'
            elif recency <= 30 and freq >= 1:
                segmento = 'Leal'
            elif recency <= 60:
                segmento = 'En riesgo'
            else:
                segmento = 'Perdido'

            resultados.append({
                'user_id': r['_id'],
                'recency': recency,
                'frequency': freq,
                'monetary': money,
                'segmento': segmento
            })

        # Ordenar por recency ascendente (clientes más recientes primero)
        resultados.sort(key=lambda x: x['recency'])

        return Response({
            'rfm': resultados,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
        })


# ============================================================
# VISTA 4: EMBUDO DE CONVERSIÓN (solo admin)
# ============================================================
class FunnelView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        if not is_admin(request):
            return Response(
                {'error': 'No autorizado. Se requieren permisos de administrador.'},
                status=status.HTTP_403_FORBIDDEN
            )

        end_date = timezone.now()
        start_date = end_date - timedelta(days=30)

        start_str = request.query_params.get('start')
        end_str = request.query_params.get('end')
        if start_str:
            try:
                start_date = datetime.fromisoformat(start_str)
            except ValueError:
                return Response({'error': 'Formato de fecha inválido para start (use YYYY-MM-DD)'}, status=400)
        if end_str:
            try:
                end_date = datetime.fromisoformat(end_str)
            except ValueError:
                return Response({'error': 'Formato de fecha inválido para end (use YYYY-MM-DD)'}, status=400)

        funnel_data = get_unique_sessions(start_date, end_date)

        return Response({
            'funnel': funnel_data,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
        })
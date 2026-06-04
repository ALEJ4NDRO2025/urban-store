from mongoengine import Document, EmbeddedDocument, ListField, StringField, IntField, FloatField, DateTimeField, EmbeddedDocumentField
from datetime import datetime, timedelta
import random

# ==================================================================
# SUBCLASES EMBEBIDAS (sin cambios)
# ==================================================================

class OrderItem(EmbeddedDocument):
    """Representa un producto dentro de una orden."""
    product_slug = StringField(required=True)
    product_name = StringField()
    quantity     = IntField(required=True)
    size         = StringField()
    color        = StringField()
    price_paid   = FloatField(required=True)
    subtotal     = FloatField(required=True)

class ShippingAddress(EmbeddedDocument):
    """Dirección de envío asociada a la orden."""
    email      = StringField(required=True)
    name       = StringField(required=True)
    phone      = StringField(required=True)
    address    = StringField(required=True)
    city       = StringField(required=True)
    department = StringField(required=True)
    country    = StringField(default='Colombia')

# ==================================================================
# DOCUMENTO PRINCIPAL: ORDER (MODIFICADO)
# ==================================================================

class Order(Document):
    """
    Representa un pedido en la tienda.
    Flujo de estados (después del cambio):
        pending            → Pendiente de pago (recién creado, espera pago)
        paid               → Pagado (el cliente completó el pago)
        pending_shipment   → Pendiente por enviar (pagado pero aún no despachado)
        shipped            → Enviado (entregado al transportista)
        cancelled          → Cancelado (puede ocurrir desde pending, paid o pending_shipment)

    La cancelación repone el stock automáticamente.
    """
    user_id          = StringField(required=True)
    order_number     = StringField(unique=True)
    items            = ListField(EmbeddedDocumentField(OrderItem), required=True)
    subtotal         = FloatField(required=True)
    tax              = FloatField(default=0)
    shipping         = FloatField(default=0)
    total            = FloatField(required=True)

    # ---------- CAMBIO AQUÍ ----------
    # Se definen las opciones de estado con sus etiquetas legibles.
    # Esto no fuerza migración, pero ayuda a validar y documentar.
    STATUS_CHOICES = (
        ('pending', 'Pendiente de pago'),
        ('paid', 'Pagado'),
        ('pending_shipment', 'Pendiente por enviar'),   # NUEVO estado intermedio
        ('shipped', 'Enviado'),
        ('cancelled', 'Cancelado'),                     # NUEVO estado final
    )
    status = StringField(default='pending', choices=STATUS_CHOICES)
    # --------------------------------

    payment_method   = StringField()
    shipping_address = EmbeddedDocumentField(ShippingAddress, required=True)
    notes            = StringField(default='')
    created_at       = DateTimeField(default=datetime.utcnow)
    updated_at       = DateTimeField(default=datetime.utcnow)
    paid_at          = DateTimeField()                     # Se llena cuando pasa a 'paid' o 'pending_shipment'
    payment_intent_id = StringField()
    expires_at       = DateTimeField()                     # Para órdenes pending que caducan

    meta = {
        'collection': 'orders',
        'indexes': [
            'user_id',
            'order_number',
            {'fields': ['expires_at'], 'expireAfterSeconds': 0}
        ]
    }

    @classmethod
    def generate_order_number(cls):
        """Genera un número de orden único basado en timestamp + aleatorio."""
        timestamp = datetime.utcnow().strftime('%Y%m%d%H%M%S')
        random_suffix = random.randint(100, 999)
        return f"ORD-{timestamp}-{random_suffix}"
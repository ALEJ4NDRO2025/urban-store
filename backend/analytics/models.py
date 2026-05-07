from mongoengine import Document, StringField, DictField, DateTimeField
from datetime import datetime

class Event(Document):
    user_id = StringField()
    session_id = StringField(required=True)
    event_type = StringField(required=True)  # nuevos tipos: 'checkout_started', 'shipping_info_entered', 'payment_info_entered', 'order_completed', 'payment_error', 'address_error'
    product_slug = StringField()
    product_name = StringField()
    price = StringField()
    metadata = DictField()
    error_message = StringField()           # ← NUEVO: para registrar errores
    created_at = DateTimeField(default=datetime.utcnow)
    # 🔒 CLAVE DE IDEMPOTENCIA para evitar duplicados
    idempotency_key = StringField(required=True, unique=True, sparse=True)

    meta = {
        'collection': 'analytics_events',
        'indexes': ['event_type', 'user_id', 'session_id', '-created_at', 'idempotency_key']
    }
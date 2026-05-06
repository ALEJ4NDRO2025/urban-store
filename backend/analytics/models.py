from mongoengine import Document, StringField, DictField, DateTimeField
from datetime import datetime

class Event(Document):
    """
    Modelo para registrar eventos de usuario.
    Tipos de eventos: 'product_view', 'add_to_cart', 'remove_from_cart', 
    'begin_checkout', 'purchase', 'cart_abandon'
    """
    user_id = StringField()                 # email del usuario (si autenticado)
    session_id = StringField(required=True) # ID de sesión (para usuarios anónimos)
    event_type = StringField(required=True) # tipo de evento
    product_slug = StringField()            # slug del producto
    product_name = StringField()            # nombre del producto
    price = StringField()                   # precio en el momento del evento
    metadata = DictField()                  # datos extra (cantidad, talla, color, etc.)
    created_at = DateTimeField(default=datetime.utcnow)  # UTC

    meta = {
        'collection': 'analytics_events',
        'indexes': [
            'event_type',
            'user_id',
            'session_id',
            '-created_at'   # orden descendente por fecha
        ]
    }
from mongoengine import Document, EmbeddedDocument, ListField, StringField, IntField, FloatField, DateTimeField, EmbeddedDocumentField
from datetime import datetime, timedelta
import random

class OrderItem(EmbeddedDocument):
    product_slug = StringField(required=True)
    product_name = StringField()
    quantity     = IntField(required=True)
    size         = StringField()
    color        = StringField()
    price_paid   = FloatField(required=True)
    subtotal     = FloatField(required=True)

class ShippingAddress(EmbeddedDocument):
    email      = StringField(required=True)
    name       = StringField(required=True)
    phone      = StringField(required=True)
    address    = StringField(required=True)
    city       = StringField(required=True)
    department = StringField(required=True)
    country    = StringField(default='Colombia')

class Order(Document):
    user_id          = StringField(required=True)
    order_number     = StringField(unique=True)
    items            = ListField(EmbeddedDocumentField(OrderItem), required=True)
    subtotal         = FloatField(required=True)
    tax              = FloatField(default=0)
    shipping         = FloatField(default=0)
    total            = FloatField(required=True)
    status           = StringField(default='pending')
    payment_method   = StringField()
    shipping_address = EmbeddedDocumentField(ShippingAddress, required=True)
    notes            = StringField(default='')
    created_at       = DateTimeField(default=datetime.utcnow)
    updated_at       = DateTimeField(default=datetime.utcnow)
    paid_at          = DateTimeField()
    payment_intent_id = StringField()
    expires_at       = DateTimeField()

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
        timestamp = datetime.utcnow().strftime('%Y%m%d%H%M%S')
        random_suffix = random.randint(100, 999)
        return f"ORD-{timestamp}-{random_suffix}"

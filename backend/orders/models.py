from mongoengine import Document, EmbeddedDocument, ListField, StringField, IntField, FloatField, DateTimeField, EmbeddedDocumentField
from datetime import datetime

class OrderItem(EmbeddedDocument):
    product_slug = StringField(required=True)
    product_name = StringField()
    quantity     = IntField(required=True)
    size         = StringField()
    color        = StringField()
    price_paid   = FloatField(required=True)
    subtotal     = FloatField(required=True)

class ShippingAddress(EmbeddedDocument):
    email   = StringField(required=True)
    name    = StringField(required=True)
    phone   = StringField(required=True)
    address = StringField(required=True)
    city    = StringField(required=True)
    country = StringField(default='Colombia')

class Order(Document):
    user_id          = StringField(required=True)
    order_number     = StringField(unique=True)
    items            = ListField(EmbeddedDocumentField(OrderItem), required=True)
    subtotal         = FloatField(required=True)
    tax              = FloatField(default=0)
    shipping         = FloatField(default=0)
    total            = FloatField(required=True)
    status           = StringField(default='pending')  # pending → paid → shipped
    payment_method   = StringField()
    shipping_address = EmbeddedDocumentField(ShippingAddress, required=True)
    notes            = StringField(default='')
    created_at       = DateTimeField(default=datetime.utcnow)
    updated_at       = DateTimeField(default=datetime.utcnow)
    paid_at          = DateTimeField()

    meta = {'collection': 'orders', 'indexes': ['user_id', 'order_number']}

    @classmethod
    def generate_order_number(cls):
        count = cls.objects.count()
        return f'ORD-2026-{str(count + 1).zfill(3)}'
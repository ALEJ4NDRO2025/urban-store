from mongoengine import Document, EmbeddedDocument, ListField, StringField, IntField, FloatField, DateTimeField, EmbeddedDocumentField
from datetime import datetime

class CartItem(EmbeddedDocument):
    product_slug  = StringField(required=True)
    product_name  = StringField()
    quantity      = IntField(required=True, min_value=1)
    selected_size  = StringField()
    selected_color = StringField()
    price_at_time  = FloatField(required=True)
    image          = StringField()

class Cart(Document):
    user_id    = StringField(required=True, unique=True)  # email del usuario
    items      = ListField(EmbeddedDocumentField(CartItem), default=[])
    total      = FloatField(default=0)
    item_count = IntField(default=0)
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)

    meta = {'collection': 'carts'}

    def calculate_totals(self):
        self.total      = sum(i.price_at_time * i.quantity for i in self.items)
        self.item_count = sum(i.quantity for i in self.items)
        self.updated_at = datetime.utcnow()
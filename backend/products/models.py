import mongoengine as me
from datetime import datetime

class Product(me.Document):
    # Información básica
    name        = me.StringField(required=True, max_length=200)
    slug        = me.StringField(required=True, unique=True)
    description = me.StringField()
    price       = me.DecimalField(required=True, precision=2)

    # Categoría y stock
    category    = me.StringField(required=True)
    stock       = me.IntField(default=0)
    sizes       = me.ListField(me.StringField())   # ['S', 'M', 'L', 'XL']
    colors      = me.ListField(me.StringField())   # ['negro', 'blanco', 'rojo']

    # Imágenes — URLs de Cloudinary
    images      = me.ListField(me.StringField())

    # Estado
    is_active   = me.BooleanField(default=True)
    created_at  = me.DateTimeField(default=datetime.utcnow)

    meta = {'collection': 'products'}
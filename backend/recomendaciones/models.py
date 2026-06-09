import mongoengine as me
from datetime import datetime

class RecommendationCache(me.Document):
    """
    Almacena recomendaciones precalculadas.
    - product_slug = 'default' para recomendaciones globales (popularidad)
    - product_slug = 'hoodie-oversize-black' para similares
    - user_id = email para recomendaciones personalizadas
    - session_id = UUID para anónimos
    """
    user_id = me.StringField()
    session_id = me.StringField()
    product_slug = me.StringField()
    recommended_slugs = me.ListField(me.StringField(), required=True)
    algorithm = me.StringField(default='popularity')  # 'popularity', 'collaborative'
    expires_at = me.DateTimeField(required=True)
    created_at = me.DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'recommendation_cache',
        'indexes': [
            'user_id',
            'session_id',
            'product_slug',
            {'fields': ['expires_at'], 'expireAfterSeconds': 0}
        ]
    }
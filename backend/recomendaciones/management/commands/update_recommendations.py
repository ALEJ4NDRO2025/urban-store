from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from collections import Counter
from recomendaciones.utils import get_popular_products, get_popular_products_excluding
from recomendaciones.models import RecommendationCache
from analytics.models import Event

class Command(BaseCommand):
    help = 'Actualiza caché de recomendaciones (popularidad global + por sesión anónima)'

    def handle(self, *args, **options):
        self.stdout.write("🔍 Actualizando recomendaciones...")
        expires = timezone.now() + timedelta(hours=6)

        # 1. Popularidad global
        popular_slugs = get_popular_products(limit=20)
        RecommendationCache.objects(product_slug='default').delete()
        RecommendationCache(
            product_slug='default',
            recommended_slugs=popular_slugs,
            algorithm='popularity',
            expires_at=expires
        ).save()
        self.stdout.write(f"✅ Popularidad global: {len(popular_slugs)} productos")

        # 2. Recomendaciones por session_id (usuarios no logueados)
        # Obtener todos los eventos product_view agrupados por session_id
        views = Event.objects.filter(event_type='product_view', product_slug__exists=True)
        session_views = {}
        for ev in views:
            if ev.session_id:
                session_views.setdefault(ev.session_id, []).append(ev.product_slug)

        # Para cada sesión con al menos 3 vistas, guardar recomendaciones (populares excluyendo vistos)
        sessions_updated = 0
        for session_id, viewed_slugs in session_views.items():
            if len(set(viewed_slugs)) >= 3:
                recs = get_popular_products_excluding(viewed_slugs, limit=10)
                if recs:
                    # Eliminar entrada anterior de esta sesión (si existe)
                    RecommendationCache.objects(session_id=session_id).delete()
                    RecommendationCache(
                        session_id=session_id,
                        recommended_slugs=recs,
                        algorithm='popularity_excluding_viewed',
                        expires_at=expires
                    ).save()
                    sessions_updated += 1

        self.stdout.write(self.style.SUCCESS(
            f"✅ Caché actualizado: {sessions_updated} sesiones anónimas personalizadas."
        ))
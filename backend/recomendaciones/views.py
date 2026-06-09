from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.utils import timezone
from .models import RecommendationCache
from products.models import Product

class RecommendationsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        user_id = request.query_params.get('user_id')
        session_id = request.query_params.get('session_id')
        product_slug = request.query_params.get('product_slug')
        limit = int(request.query_params.get('limit', 8))

        cache = None
        if product_slug:
            cache = RecommendationCache.objects(product_slug=product_slug, expires_at__gt=timezone.now()).first()
        elif user_id:
            cache = RecommendationCache.objects(user_id=user_id, expires_at__gt=timezone.now()).first()
        elif session_id:
            cache = RecommendationCache.objects(session_id=session_id, expires_at__gt=timezone.now()).first()
        
        if not cache:
            cache = RecommendationCache.objects(product_slug='default', expires_at__gt=timezone.now()).first()
        
        if not cache or not cache.recommended_slugs:
            return Response([])
        
        slugs = cache.recommended_slugs[:limit]
        products = Product.objects(slug__in=slugs, is_active=True)
        products_dict = {p.slug: p for p in products}
        ordered = [products_dict[slug] for slug in slugs if slug in products_dict]
        
        data = [{
            'slug': p.slug,
            'name': p.name,
            'price': str(p.price),
            'image': p.images[0] if p.images else None,
            'category': p.category
        } for p in ordered]
        
        return Response(data)
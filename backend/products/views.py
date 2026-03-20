from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import BasePermission
from .serializers import ProductSerializer
from .models import Product
from django.conf import settings
import jwt

# ── PERMISO PERSONALIZADO ─────────────────────────────────────
class IsAdminMongo(BasePermission):
    # Verifica que el token JWT sea de un usuario admin de MongoDB
    def has_permission(self, request, view):
        auth = request.headers.get('Authorization', '')
        if not auth.startswith('Bearer '):
            return False
        token = auth.split(' ')[1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            return payload.get('is_admin', False)
        except:
            return False


# ── LISTA Y CREACIÓN DE PRODUCTOS ─────────────────────────────
class ProductListView(APIView):
    authentication_classes = []  # DRF no intercepta el token

    def get_permissions(self):
        # GET → público, POST → solo admin MongoDB
        if self.request.method == 'GET':
            return []
        return [IsAdminMongo()]

    def get(self, request):
        # Filtros opcionales por query params
        category  = request.query_params.get('category')
        min_price = request.query_params.get('min_price')
        max_price = request.query_params.get('max_price')

        products = Product.objects(is_active=True)

        if category:
            products = products.filter(category=category)
        if min_price:
            products = products.filter(price__gte=float(min_price))
        if max_price:
            products = products.filter(price__lte=float(max_price))

        data = [{
            'id':       str(p.id),
            'name':     p.name,
            'slug':     p.slug,
            'price':    str(p.price),
            'category': p.category,
            'stock':    p.stock,
            'sizes':    p.sizes,
            'colors':   p.colors,
            'images':   p.images,
        } for p in products]

        return Response(data)

    def post(self, request):
        # Crea un producto nuevo — solo admin
        serializer = ProductSerializer(data=request.data)
        if serializer.is_valid():
            product = serializer.save()
            return Response({
                'message': 'Producto creado exitosamente',
                'slug':    product.slug,
                'name':    product.name,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ── DETALLE, EDICIÓN Y ELIMINACIÓN ────────────────────────────
class ProductDetailView(APIView):
    authentication_classes = []  # DRF no intercepta el token

    def get_permissions(self):
        # GET → público, PUT/DELETE → solo admin MongoDB
        if self.request.method == 'GET':
            return []
        return [IsAdminMongo()]

    def get(self, request, slug):
        # Busca el producto por su slug
        product = Product.objects(slug=slug).first()
        if not product:
            return Response(
                {'error': 'Producto no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        return Response({
            'id':          str(product.id),
            'name':        product.name,
            'slug':        product.slug,
            'description': product.description,
            'price':       str(product.price),
            'category':    product.category,
            'stock':       product.stock,
            'sizes':       product.sizes,
            'colors':      product.colors,
            'images':      product.images,
        })

    def put(self, request, slug):
        # Edita un producto existente — solo admin
        product = Product.objects(slug=slug).first()
        if not product:
            return Response(
                {'error': 'Producto no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = ProductSerializer(product, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Producto actualizado'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, slug):
        # Elimina un producto — solo admin
        product = Product.objects(slug=slug).first()
        if not product:
            return Response(
                {'error': 'Producto no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        product.delete()
        return Response({'message': 'Producto eliminado'})

# ── PARA QUÉ SIRVE EN LA ESTRUCTURA ──────────────────────────
#
# authentication_classes = [] → evita que DRF valide el token
#                               con simplejwt — usamos el nuestro
#
# IsAdminMongo → lee el token JWT de MongoDB manualmente
#
# ProductListView   → GET público / POST solo admin
# ProductDetailView → GET público / PUT-DELETE solo admin
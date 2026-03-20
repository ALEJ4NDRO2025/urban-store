from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAdminUser, AllowAny
from .serializers import ProductSerializer
from .models import Product

# ── LISTA Y CREACIÓN DE PRODUCTOS ─────────────────────────────
class ProductListView(APIView):

    def get_permissions(self):
        # GET → cualquiera puede ver el catálogo
        # POST → solo admin con token JWT
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAdminUser()]

    def get(self, request):
        # Filtros opcionales por query params
        category = request.query_params.get('category')
        min_price = request.query_params.get('min_price')
        max_price = request.query_params.get('max_price')

        # Trae todos los productos activos
        products = Product.objects(is_active=True)

        # Aplica filtros si llegan
        if category:
            products = products.filter(category=category)
        if min_price:
            products = products.filter(price__gte=float(min_price))
        if max_price:
            products = products.filter(price__lte=float(max_price))

        # Convierte a lista de diccionarios
        data = [{
            'id':          str(p.id),
            'name':        p.name,
            'slug':        p.slug,
            'price':       str(p.price),
            'category':    p.category,
            'stock':       p.stock,
            'sizes':       p.sizes,
            'colors':      p.colors,
            'images':      p.images,
        } for p in products]

        return Response(data)

    def post(self, request):
        # Crea un producto nuevo — solo admin
        serializer = ProductSerializer(data=request.data)
        if serializer.is_valid():
            product = serializer.save()
            return Response({
                'message': '🥵Producto creado exitosamente',
                'slug':    product.slug,
                'name':    product.name,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ── DETALLE, EDICIÓN Y ELIMINACIÓN ────────────────────────────
class ProductDetailView(APIView):

    def get_permissions(self):
        # GET → público
        # PUT, DELETE → solo admin
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAdminUser()]

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
        serializer = ProductSerializer(
            product, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response({'message': '🐺Producto actualizado'})
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
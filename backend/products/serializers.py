from rest_framework import serializers
from .models import Product

class ProductSerializer(serializers.Serializer):
    # Información básica
    name        = serializers.CharField(max_length=200)
    slug        = serializers.CharField(max_length=200)
    description = serializers.CharField(required=False, allow_blank=True)
    price       = serializers.DecimalField(max_digits=10, decimal_places=2)

    # Categoría y stock
    category    = serializers.CharField()
    stock       = serializers.IntegerField(default=0)
    sizes       = serializers.ListField(child=serializers.CharField(), required=False)
    colors      = serializers.ListField(child=serializers.CharField(), required=False)

    # 🆕 Stock por variante (talla + color)
    stock_by_variant = serializers.DictField(required=False)

    # Imágenes
    images      = serializers.ListField(child=serializers.URLField(), required=False)

    # Estado
    is_active   = serializers.BooleanField(default=True)

    def validate_slug(self, value):
        """
        Verifica que el slug no exista ya en MongoDB.
        Si se está editando un producto (self.instance existe) y el slug
        no cambió, se permite sin comprobar duplicados.
        """
        if self.instance and self.instance.slug == value:
            return value
        if Product.objects(slug=value).first():
            raise serializers.ValidationError("Ya existe un producto con este slug")
        return value

    def create(self, validated_data):
        """Crea y guarda el producto en MongoDB."""
        product = Product(**validated_data)
        product.save()
        return product

    def update(self, instance, validated_data):
        """Actualiza los campos que llegaron y guarda el producto existente."""
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
        return instance
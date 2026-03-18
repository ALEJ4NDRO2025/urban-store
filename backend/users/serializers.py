from rest_framework import serializers
from .models import User
import bcrypt

class RegisterSerializer(serializers.Serializer):
    email      = serializers.EmailField()
    password   = serializers.CharField(min_length=6)
    first_name = serializers.CharField(max_length=100)
    last_name  = serializers.CharField(max_length=100)

    def validate_email(self, value):
        if User.objects(email=value).first():
            raise serializers.ValidationError("Este email ya está registrado")
        return value

    def create(self, validated_data):
        hashed = bcrypt.hashpw(
            validated_data['password'].encode('utf-8'),
            bcrypt.gensalt()
        ).decode('utf-8')

        user = User(
            email=validated_data['email'],
            password=hashed,
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
        )
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField()
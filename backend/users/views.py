from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authentication import BaseAuthentication
from .serializers import RegisterSerializer, LoginSerializer
from .models import User
from datetime import datetime, timedelta
from django.conf import settings
import bcrypt
import jwt

# ── VISTA DE REGISTRO ─────────────────────────────────────────
class RegisterView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'message':    'Usuario registrado exitosamente',
                'email':      user.email,
                'first_name': user.first_name,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ── VISTA DE LOGIN ────────────────────────────────────────────
class LoginView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            email    = serializer.validated_data['email']
            password = serializer.validated_data['password']

            user = User.objects(email=email).first()
            if not user:
                return Response(
                    {'error': 'Usuario no encontrado'},
                    status=status.HTTP_404_NOT_FOUND
                )

            if not bcrypt.checkpw(
                password.encode('utf-8'),
                user.password.encode('utf-8')
            ):
                return Response(
                    {'error': 'Contraseña incorrecta'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            payload = {
                'user_id':  str(user.id),
                'email':    user.email,
                'is_admin': user.is_admin,
                'exp':      datetime.utcnow() + timedelta(days=7)
            }
            token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

            return Response({
                'message':  'Login exitoso',
                'access':   token,
                'email':    user.email,
                'name':     user.first_name,
                'is_admin': user.is_admin,
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ── PARA QUÉ SIRVE EN LA ESTRUCTURA ──────────────────────────
#
# authentication_classes = [] → evita que DRF intercepte
# permission_classes = []     → rutas públicas de auth
#
# RegisterView → valida → encripta con bcrypt → guarda en MongoDB
# LoginView    → verifica contraseña → genera token JWT propio
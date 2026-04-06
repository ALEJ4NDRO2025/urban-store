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
    
# ── AGREGAR ESTAS VISTAS AL FINAL DE backend/users/views.py ──────────────────

# Helper reutilizable — extrae payload del JWT
def get_payload(request):
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return None
    try:
        return jwt.decode(auth.split(' ')[1], settings.SECRET_KEY, algorithms=['HS256'])
    except:
        return None


class ProfileView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        """GET /api/users/profile/ → devuelve datos del usuario logueado"""
        payload = get_payload(request)
        if not payload:
            return Response({'error': 'Token inválido'}, status=status.HTTP_401_UNAUTHORIZED)

        user = User.objects(id=payload['user_id']).first()
        if not user:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            'email':      user.email,
            'first_name': user.first_name or '',
            'last_name':  user.last_name  or '',
            'is_admin':   user.is_admin,
            'created_at': user.created_at.isoformat(),
        })

    def put(self, request):
        """PUT /api/users/profile/ → actualiza first_name y last_name (email bloqueado)"""
        payload = get_payload(request)
        if not payload:
            return Response({'error': 'Token inválido'}, status=status.HTTP_401_UNAUTHORIZED)

        user = User.objects(id=payload['user_id']).first()
        if not user:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        # Solo permite cambiar nombre — email bloqueado
        first_name = request.data.get('first_name', '').strip()
        last_name  = request.data.get('last_name', '').strip()

        if not first_name:
            return Response({'error': 'El nombre no puede estar vacío'}, status=status.HTTP_400_BAD_REQUEST)

        user.first_name = first_name
        user.last_name  = last_name
        user.save()

        return Response({
            'message':    'Perfil actualizado',
            'first_name': user.first_name,
            'last_name':  user.last_name,
        })

    def delete(self, request):
        """DELETE /api/users/profile/ → elimina la cuenta del usuario"""
        payload = get_payload(request)
        if not payload:
            return Response({'error': 'Token inválido'}, status=status.HTTP_401_UNAUTHORIZED)

        user = User.objects(id=payload['user_id']).first()
        if not user:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        user.delete()
        return Response({'message': 'Cuenta eliminada'}, status=status.HTTP_200_OK)

# ── PARA QUÉ SIRVE EN LA ESTRUCTURA ──────────────────────────
#
# authentication_classes = [] → evita que DRF intercepte
# permission_classes = []     → rutas públicas de auth
#
# RegisterView → valida → encripta con bcrypt → guarda en MongoDB
# LoginView    → verifica contraseña → genera token JWT propio
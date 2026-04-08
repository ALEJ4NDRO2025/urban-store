from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from .serializers import RegisterSerializer, LoginSerializer
from .models import User
from datetime import datetime, timedelta
import bcrypt
import jwt

# ─── FUNCIÓN AUXILIAR PARA OBTENER PAYLOAD DEL JWT ──────────────────────────
def get_payload(request):
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return None
    try:
        token = auth.split(' ')[1]
        return jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
    except:
        return None

# ─── VISTA DE REGISTRO ─────────────────────────────────────────────────────
class RegisterView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'message': 'Usuario registrado exitosamente',
                'email': user.email,
                'first_name': user.first_name,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ─── VISTA DE LOGIN (CON BLOQUEO DE CUENTAS INACTIVAS) ────────────────────
class LoginView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']

            user = User.objects(email=email).first()
            if not user:
                return Response(
                    {'error': 'Usuario no encontrado'},
                    status=status.HTTP_404_NOT_FOUND
                )

            if not bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):
                return Response(
                    {'error': 'Contraseña incorrecta'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # 🚫 Bloquear acceso si la cuenta está desactivada (soft delete)
            if not user.is_active:
                return Response(
                    {'error': 'Cuenta desactivada. Contacta al soporte.'},
                    status=status.HTTP_403_FORBIDDEN
                )

            payload = {
                'user_id': str(user.id),
                'email': user.email,
                'is_admin': user.is_admin,
                'exp': datetime.utcnow() + timedelta(days=7)
            }
            token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

            return Response({
                'message': 'Login exitoso',
                'access': token,
                'email': user.email,
                'name': user.first_name,
                'is_admin': user.is_admin,
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ─── VISTA DE PERFIL (GET, PUT, SOFT DELETE) ──────────────────────────────
class ProfileView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        payload = get_payload(request)
        if not payload:
            return Response({'error': 'Token inválido'}, status=status.HTTP_401_UNAUTHORIZED)

        user = User.objects(id=payload['user_id'], is_active=True).first()
        if not user:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            'email': user.email,
            'first_name': user.first_name or '',
            'last_name': user.last_name or '',
            'is_admin': user.is_admin,
            'created_at': user.created_at.isoformat(),
        })

    def put(self, request):
        payload = get_payload(request)
        if not payload:
            return Response({'error': 'Token inválido'}, status=status.HTTP_401_UNAUTHORIZED)

        user = User.objects(id=payload['user_id'], is_active=True).first()
        if not user:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        first_name = request.data.get('first_name', '').strip()
        last_name = request.data.get('last_name', '').strip()

        if len(first_name) > 30:
            return Response({'error': 'El nombre no puede exceder los 30 caracteres'}, status=status.HTTP_400_BAD_REQUEST)
        if len(last_name) > 30:
            return Response({'error': 'El apellido no puede exceder los 30 caracteres'}, status=status.HTTP_400_BAD_REQUEST)
        if not first_name:
            return Response({'error': 'El nombre no puede estar vacío'}, status=status.HTTP_400_BAD_REQUEST)

        user.first_name = first_name
        user.last_name = last_name
        user.save()

        return Response({
            'message': 'Perfil actualizado',
            'first_name': user.first_name,
            'last_name': user.last_name,
        })

    def delete(self, request):
        """Soft delete: desactiva la cuenta en lugar de borrarla"""
        payload = get_payload(request)
        if not payload:
            return Response({'error': 'Token inválido'}, status=status.HTTP_401_UNAUTHORIZED)

        user = User.objects(id=payload['user_id'], is_active=True).first()
        if not user:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        # Soft delete
        user.is_active = False
        user.save()

        return Response({'message': 'Cuenta desactivada correctamente'}, status=status.HTTP_200_OK)

# ─── VISTA PARA CAMBIAR CONTRASEÑA ──────────────────────────────────────────
class ChangePasswordView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        payload = get_payload(request)
        if not payload:
            return Response({'error': 'Token inválido'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            user = User.objects.get(email=payload['email'], is_active=True)
        except User.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')

        if not bcrypt.checkpw(current_password.encode('utf-8'), user.password.encode('utf-8')):
            return Response({'error': 'Contraseña actual incorrecta'}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 6:
            return Response({'error': 'La nueva contraseña debe tener al menos 6 caracteres'}, status=status.HTTP_400_BAD_REQUEST)

        hashed = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
        user.password = hashed.decode('utf-8')
        user.save()

        return Response({'message': 'Contraseña actualizada correctamente'}, status=status.HTTP_200_OK)
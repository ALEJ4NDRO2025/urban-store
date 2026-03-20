from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import RegisterSerializer, LoginSerializer
from .models import User
import bcrypt


#AQUI ESTA EL REGISTRO-frontend
class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'message': 'Usuario registrado exitosamente🐲',
                'email': user.email,
                'first_name': user.first_name,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


#AQUI ESTA EL LOGIN-frontend
class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            email    = serializer.validated_data['email']
            password = serializer.validated_data['password']

            # Busca el usuario en MongoDB
            user = User.objects(email=email).first()
            if not user:
                return Response(
                    {'error': 'Usuario no encontrado'},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Verifica la contraseña
            if not bcrypt.checkpw(
                password.encode('utf-8'),
                user.password.encode('utf-8')
            ):
                return Response(
                    {'error': 'Contraseña incorrecta'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Genera token JWT manualmente
            payload = {
                'user_id':  str(user.id),
                'email':    user.email,
                'is_admin': user.is_admin,
                'exp':      datetime.utcnow() + timedelta(days=7)
            }
            token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

            return Response({
                'message': 'Login exitoso',
                'access':  token,
                'email':   user.email,
                'name':    user.first_name,
                'is_admin': user.is_admin,
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
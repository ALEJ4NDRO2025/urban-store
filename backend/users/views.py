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

            user = User.objects(email=email).first()
            if not user:
                return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

            if not bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):
                return Response({'error': 'Contraseña incorrecta'}, status=status.HTTP_400_BAD_REQUEST)

            # Generar token JWT
            refresh = RefreshToken.for_user(user)
            return Response({
                'message': 'Inicio de sesión exitoso✅',
                'access':  str(refresh.access_token),
                'refresh': str(refresh),
                'email':   user.email,
                'name':    user.first_name,
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
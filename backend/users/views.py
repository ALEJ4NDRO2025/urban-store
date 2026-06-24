from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from .serializers import RegisterSerializer, LoginSerializer
from .models import User
from datetime import datetime, timedelta
import bcrypt
import jwt
import random
from django.core.mail import send_mail
from .email_utils import send_email_brevo

# ═══════════════════════════════════════════════════════════════════════════
# FUNCIÓN AUXILIAR PARA EXTRAER EL PAYLOAD DEL JWT
# ═══════════════════════════════════════════════════════════════════════════
def get_payload(request):
    """Decodifica el token JWT del header Authorization y devuelve el payload."""
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return None
    try:
        token = auth.split(' ')[1]
        return jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
    except:
        return None


# ═══════════════════════════════════════════════════════════════════════════
# VISTA DE REGISTRO (CREA USUARIO Y ENVÍA CÓDIGO DE VERIFICACIÓN)
# ═══════════════════════════════════════════════════════════════════════════
class RegisterView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            # 1. Generar código de verificación de 6 dígitos
            code = str(random.randint(100000, 999999))
            user.verification_token = code
            user.verification_token_expires = datetime.utcnow() + timedelta(hours=24)
            user.last_verification_sent_at = datetime.utcnow()
            user.verification_attempts = 0  # Inicializar intentos
            user.save()

            # 2. Enviar correo con diseño HTML y efectos
            subject = 'Código de verificación - Urban Store'
            from_email = settings.DEFAULT_FROM_EMAIL
            recipient_list = [user.email]

            text_message = (
                f'¡Hola {user.first_name}!\n\n'
                f'Tu código de verificación es: {code}\n\n'
                f'Este código expirará en 24 horas.\n\n'
                f'Si no solicitaste este registro, ignora este mensaje.\n\n'
                f'Saludos,\nEl equipo de Urban Store'
            )

            html_message = f'''
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {{ margin:0; padding:0; background-color:#0D0D0D; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#FFFFFF; }}
                    .container {{ max-width:500px; margin:20px auto; background-color:#1A1A1A; border-radius:16px; border:1px solid #333333; box-shadow:0 8px 24px rgba(0,0,0,0.5); overflow:hidden; animation: fadeInUp 0.6s ease-out; }}
                    .header {{ background:linear-gradient(135deg, #B8860B 0%, #D4A017 100%); padding:30px 20px; text-align:center; }}
                    .header h1 {{ margin:0; color:#0D0D0D; font-size:28px; font-weight:800; letter-spacing:2px; }}
                    .header p {{ margin:10px 0 0; color:#0D0D0D; font-size:16px; font-weight:500; }}
                    .content {{ padding:30px 20px; text-align:center; }}
                    .greeting {{ font-size:20px; margin-bottom:12px; color:#C0C0C0; }}
                    .message {{ font-size:15px; color:#C0C0C0; margin-bottom:30px; line-height:1.6; }}
                    .code-box {{ background-color:#262626; border:1px dashed #B8860B; border-radius:12px; padding:25px 15px; margin:20px 0; animation: pulse 2.5s infinite; }}
                    .code {{ font-size:42px; font-weight:700; letter-spacing:10px; color:#B8860B; margin:0; text-shadow:0 0 10px rgba(184,134,11,0.5); animation: glow 2s ease-in-out infinite alternate; }}
                    .expire-note {{ color:#808080; font-size:13px; margin-top:12px; }}
                    .footer {{ background-color:#0D0D0D; padding:20px; text-align:center; border-top:1px solid #333333; color:#808080; font-size:12px; }}
                    .footer a {{ color:#B8860B; text-decoration:none; }}
                    @keyframes fadeInUp {{ from {{ opacity:0; transform:translateY(20px); }} to {{ opacity:1; transform:translateY(0); }} }}
                    @keyframes pulse {{ 0% {{ box-shadow:0 0 0 0 rgba(184,134,11,0.4); }} 70% {{ box-shadow:0 0 0 15px rgba(184,134,11,0); }} 100% {{ box-shadow:0 0 0 0 rgba(184,134,11,0); }} }}
                    @keyframes glow {{ from {{ text-shadow:0 0 5px #B8860B,0 0 10px #B8860B; }} to {{ text-shadow:0 0 20px #D4A017,0 0 30px #D4A017; }} }}
                    @media only screen and (max-width:480px) {{ .container {{ margin:10px; border-radius:12px; }} .header h1 {{ font-size:24px; }} .code {{ font-size:32px; letter-spacing:6px; }} }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header"><h1>URBAN STORE</h1><p>Verifica tu cuenta</p></div>
                    <div class="content">
                        <div class="greeting">¡Hola, {user.first_name}!</div>
                        <div class="message">Gracias por registrarte en Urban Store.<br>Para completar tu registro, utiliza el siguiente código de verificación:</div>
                        <div class="code-box"><div class="code">{code}</div><div class="expire-note">Este código expirará en 24 horas.</div></div>
                        <div class="message" style="margin-top:30px; font-size:13px;">Si no has solicitado esta cuenta, puedes ignorar este mensaje.</div>
                    </div>
                    <div class="footer">© 2026 Urban Store. Todos los derechos reservados.<br><a href="#">{settings.DEFAULT_FROM_EMAIL}</a></div>
                </div>
            </body>
            </html>
            '''

            try:
                send_email_brevo(
                    subject=subject,
                    html_content=html_message,
                    to_email=user.email,
                    text_content=text_message,
                )
            except Exception as e:
                print(f'[Brevo] Error enviando correo de verificación a {user.email}: {e}')

            return Response({
                'message': 'Usuario registrado. Revisa tu correo para obtener el código de verificación.',
                'email': user.email,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ═══════════════════════════════════════════════════════════════════════════
# VISTA DE LOGIN (BLOQUEA SI NO ESTÁ VERIFICADO O INACTIVO)
# ═══════════════════════════════════════════════════════════════════════════
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
                    {'error': 'Credenciales incorrectas'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            if not bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):
                return Response(
                    {'error': 'Credenciales incorrectas'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            if not user.is_active:
                return Response(
                    {'error': 'Cuenta desactivada. Contacta al soporte.'},
                    status=status.HTTP_403_FORBIDDEN
                )

            if not user.is_verified:
                return Response(
                    {'error': 'Debes verificar tu correo antes de iniciar sesión'},
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


# ═══════════════════════════════════════════════════════════════════════════
# VISTA DE VERIFICACIÓN DE CÓDIGO (CON LÍMITE DE 3 INTENTOS)
# ═══════════════════════════════════════════════════════════════════════════
class VerifyCodeView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')

        if not email or not code:
            return Response({'error': 'Email y código son requeridos'}, status=400)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=404)

        if user.is_verified:
            return Response({'message': 'La cuenta ya está verificada'}, status=200)

        MAX_ATTEMPTS = 3
        BLOCK_MINUTES = 15

        # 1. Verificar si está bloqueado por demasiados intentos fallidos
        if user.verification_attempts >= MAX_ATTEMPTS:
            if user.last_failed_attempt_at:
                time_since_last = datetime.utcnow() - user.last_failed_attempt_at
                if time_since_last < timedelta(minutes=BLOCK_MINUTES):
                    minutes_left = BLOCK_MINUTES - (time_since_last.seconds // 60)
                    return Response(
                        {'error': f'Demasiados intentos fallidos. Intenta de nuevo en {minutes_left} minutos o solicita un nuevo código.'},
                        status=429
                    )
                else:
                    # Pasó el tiempo de bloqueo, reseteamos intentos
                    user.verification_attempts = 0
                    user.save()

        # 2. Verificar expiración
        if user.verification_token_expires < datetime.utcnow():
            return Response({'error': 'El código ha expirado. Solicita uno nuevo.'}, status=400)

        # 3. Verificar el código
        if user.verification_token != code:
            user.verification_attempts += 1
            user.last_failed_attempt_at = datetime.utcnow()
            user.save()

            attempts_left = MAX_ATTEMPTS - user.verification_attempts
            if attempts_left > 0:
                return Response(
                    {'error': f'Código incorrecto. Te quedan {attempts_left} intentos.'},
                    status=400
                )
            else:
                return Response(
                    {'error': f'Has superado el límite de intentos. Solicita un nuevo código en {BLOCK_MINUTES} minutos.'},
                    status=429
                )

        # 4. Código correcto: activar cuenta y limpiar campos
        user.is_verified = True
        user.verification_token = None
        user.verification_token_expires = None
        user.verification_attempts = 0
        user.last_failed_attempt_at = None
        user.save()

        return Response({'message': 'Cuenta verificada exitosamente'}, status=200)


# ═══════════════════════════════════════════════════════════════════════════
# VISTA DE PERFIL (GET, PUT, SOFT DELETE)
# ═══════════════════════════════════════════════════════════════════════════
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
        """Soft delete: desactiva la cuenta en lugar de borrarla."""
        payload = get_payload(request)
        if not payload:
            return Response({'error': 'Token inválido'}, status=status.HTTP_401_UNAUTHORIZED)

        user = User.objects(id=payload['user_id'], is_active=True).first()
        if not user:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        user.is_active = False
        user.save()

        return Response({'message': 'Cuenta desactivada correctamente'}, status=status.HTTP_200_OK)


# ═══════════════════════════════════════════════════════════════════════════
# VISTA PARA CAMBIAR CONTRASEÑA (USUARIO LOGUEADO)
# ═══════════════════════════════════════════════════════════════════════════
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


# ═══════════════════════════════════════════════════════════════════════════
# SOLICITAR RESETEO DE CONTRASEÑA (ENVÍA CÓDIGO POR CORREO)
# ═══════════════════════════════════════════════════════════════════════════
class RequestPasswordResetView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'El email es requerido'}, status=400)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'message': 'Si el email está registrado, recibirás un código de reseteo'}, status=200)

        if not user.is_active:
            return Response({'error': 'Cuenta desactivada'}, status=403)

        # Límite de reenvío (2 minutos)
        COOLDOWN_MINUTES = 2
        if user.last_verification_sent_at:
            time_since_last = datetime.utcnow() - user.last_verification_sent_at
            if time_since_last < timedelta(minutes=COOLDOWN_MINUTES):
                seconds_left = (timedelta(minutes=COOLDOWN_MINUTES) - time_since_last).seconds
                return Response(
                    {'error': f'Debes esperar {seconds_left} segundos antes de solicitar otro código.'},
                    status=429
                )

        code = str(random.randint(100000, 999999))
        user.verification_token = code
        user.verification_token_expires = datetime.utcnow() + timedelta(hours=1)
        user.last_verification_sent_at = datetime.utcnow()
        user.verification_attempts = 0  # Reiniciamos intentos para el reseteo
        user.save()

        subject = 'Restablece tu contraseña - Urban Store'
        from_email = settings.DEFAULT_FROM_EMAIL
        recipient_list = [user.email]

        text_message = f'Tu código de reseteo es: {code}\n\nEste código expirará en 1 hora.'

        html_message = f'''
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {{ margin:0; padding:0; background-color:#0D0D0D; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#FFFFFF; }}
                .container {{ max-width:500px; margin:20px auto; background-color:#1A1A1A; border-radius:16px; border:1px solid #333333; box-shadow:0 8px 24px rgba(0,0,0,0.5); overflow:hidden; }}
                .header {{ background:linear-gradient(135deg, #B8860B 0%, #D4A017 100%); padding:30px 20px; text-align:center; }}
                .header h1 {{ margin:0; color:#0D0D0D; font-size:28px; font-weight:800; letter-spacing:2px; }}
                .content {{ padding:30px 20px; text-align:center; }}
                .code-box {{ background-color:#262626; border:1px dashed #B8860B; border-radius:12px; padding:25px 15px; margin:20px 0; }}
                .code {{ font-size:42px; font-weight:700; letter-spacing:10px; color:#B8860B; margin:0; }}
                .footer {{ background-color:#0D0D0D; padding:20px; text-align:center; border-top:1px solid #333333; color:#808080; font-size:12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header"><h1>URBAN STORE</h1><p>Restablece tu contraseña</p></div>
                <div class="content">
                    <div class="greeting">¡Hola, {user.first_name}!</div>
                    <div class="message">Hemos recibido una solicitud para restablecer tu contraseña.<br>Utiliza el siguiente código para continuar:</div>
                    <div class="code-box"><div class="code">{code}</div><div class="expire-note">Este código expirará en 1 hora.</div></div>
                    <div class="message" style="margin-top:30px; font-size:13px;">Si no solicitaste este cambio, ignora este mensaje.</div>
                </div>
                <div class="footer">© 2026 Urban Store. Todos los derechos reservados.<br><a href="#">{settings.DEFAULT_FROM_EMAIL}</a></div>
            </div>
        </body>
        </html>
        '''

        try:
            send_email_brevo(
                subject=subject,
                html_content=html_message,
                to_email=user.email,
                text_content=text_message,
            )
        except Exception as e:
            print(f'[Brevo] Error enviando correo de reseteo a {user.email}: {e}')

        return Response({'message': 'Código de reseteo enviado a tu correo'}, status=200)


# ═══════════════════════════════════════════════════════════════════════════
# CONFIRMAR RESETEO DE CONTRASEÑA (VALIDA CÓDIGO Y CAMBIA CONTRASEÑA)
# ═══════════════════════════════════════════════════════════════════════════
class ConfirmPasswordResetView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')
        new_password = request.data.get('new_password')

        if not email or not code or not new_password:
            return Response({'error': 'Email, código y nueva contraseña son requeridos'}, status=400)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=404)

        # Validaciones similares a VerifyCodeView (puedes aplicar el mismo límite de intentos si quieres)
        if user.verification_token != code:
            return Response({'error': 'Código incorrecto'}, status=400)

        if user.verification_token_expires < datetime.utcnow():
            return Response({'error': 'El código ha expirado. Solicita uno nuevo.'}, status=400)

        if len(new_password) < 6:
            return Response({'error': 'La contraseña debe tener al menos 6 caracteres'}, status=400)

        hashed = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
        user.password = hashed.decode('utf-8')
        user.verification_token = None
        user.verification_token_expires = None
        user.verification_attempts = 0
        user.save()

        return Response({'message': 'Contraseña actualizada correctamente'}, status=200)


# ═══════════════════════════════════════════════════════════════════════════
# REENVIAR CÓDIGO DE VERIFICACIÓN (CON LÍMITE DE TIEMPO)
# ═══════════════════════════════════════════════════════════════════════════
class ResendVerificationCodeView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'El email es requerido'}, status=400)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'message': 'Si el email está registrado y no verificado, recibirás un nuevo código'}, status=200)

        if user.is_verified:
            return Response({'message': 'La cuenta ya está verificada'}, status=200)

        COOLDOWN_MINUTES = 2
        if user.last_verification_sent_at:
            time_since_last = datetime.utcnow() - user.last_verification_sent_at
            if time_since_last < timedelta(minutes=COOLDOWN_MINUTES):
                seconds_left = (timedelta(minutes=COOLDOWN_MINUTES) - time_since_last).seconds
                return Response(
                    {'error': f'Debes esperar {seconds_left} segundos antes de solicitar otro código.'},
                    status=429
                )

        # Generar nuevo código
        code = str(random.randint(100000, 999999))
        user.verification_token = code
        user.verification_token_expires = datetime.utcnow() + timedelta(hours=24)
        user.last_verification_sent_at = datetime.utcnow()
        user.verification_attempts = 0
        user.last_failed_attempt_at = None
        user.save()

        # Enviar correo (HTML similar al de registro, pero con mensaje de reenvío)
        subject = 'Nuevo código de verificación - Urban Store'
        from_email = settings.DEFAULT_FROM_EMAIL
        recipient_list = [user.email]

        text_message = f'Tu nuevo código de verificación es: {code}\n\nEste código expirará en 24 horas.'

        html_message = f'''
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {{ margin:0; padding:0; background-color:#0D0D0D; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#FFFFFF; }}
                .container {{ max-width:500px; margin:20px auto; background-color:#1A1A1A; border-radius:16px; border:1px solid #333333; box-shadow:0 8px 24px rgba(0,0,0,0.5); overflow:hidden; }}
                .header {{ background:linear-gradient(135deg, #B8860B 0%, #D4A017 100%); padding:30px 20px; text-align:center; }}
                .header h1 {{ margin:0; color:#0D0D0D; font-size:28px; font-weight:800; letter-spacing:2px; }}
                .content {{ padding:30px 20px; text-align:center; }}
                .code-box {{ background-color:#262626; border:1px dashed #B8860B; border-radius:12px; padding:25px 15px; margin:20px 0; }}
                .code {{ font-size:42px; font-weight:700; letter-spacing:10px; color:#B8860B; margin:0; }}
                .footer {{ background-color:#0D0D0D; padding:20px; text-align:center; border-top:1px solid #333333; color:#808080; font-size:12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header"><h1>URBAN STORE</h1><p>Nuevo código de verificación</p></div>
                <div class="content">
                    <div class="greeting">¡Hola, {user.first_name}!</div>
                    <div class="message">Has solicitado un nuevo código de verificación.<br>Utiliza el siguiente código para activar tu cuenta:</div>
                    <div class="code-box"><div class="code">{code}</div><div class="expire-note">Este código expirará en 24 horas.</div></div>
                </div>
                <div class="footer">© 2026 Urban Store. Todos los derechos reservados.<br><a href="#">{settings.DEFAULT_FROM_EMAIL}</a></div>
            </div>
        </body>
        </html>
        '''

        try:
            send_email_brevo(
                subject=subject,
                html_content=html_message,
                to_email=user.email,
                text_content=text_message,
            )
        except Exception as e:
            print(f'[Brevo] Error enviando correo de reenvío a {user.email}: {e}')

        return Response({'message': 'Nuevo código enviado a tu correo'}, status=200)
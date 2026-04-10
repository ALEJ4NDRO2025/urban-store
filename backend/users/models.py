import mongoengine as me
from datetime import datetime

class User(me.Document):
    email      = me.EmailField(required=True, unique=True)
    password   = me.StringField(required=True)
    first_name = me.StringField(max_length=30)
    last_name  = me.StringField(max_length=30)
    is_active  = me.BooleanField(default=True)
    is_admin   = me.BooleanField(default=False)
    # NUEVOS CAMPOS PARA VERIFICACIÓN DE EMAIL
    is_verified = me.BooleanField(default=False) #Verifico su correo??
    verification_token = me.StringField() #Token para verificar su correo
    verification_token_expires = me.DateTimeField()        # ← Fecha de expiración (24h)
    created_at = me.DateTimeField(default=datetime.utcnow)
    last_verification_sent_at = me.DateTimeField()  # Última vez que se envió código 
    verification_attempts = me.IntField(default=0)       # Intentos fallidos de verificació
    last_failed_attempt_at = me.DateTimeField()          # Último intento fallido
    

    meta = {'collection': 'users'}
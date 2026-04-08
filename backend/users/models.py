import mongoengine as me
from datetime import datetime

class User(me.Document):
    email      = me.EmailField(required=True, unique=True)
    password   = me.StringField(required=True)
    first_name = me.StringField(max_length=30)
    last_name  = me.StringField(max_length=30)
    is_active  = me.BooleanField(default=True)
    is_admin   = me.BooleanField(default=False)
    created_at = me.DateTimeField(default=datetime.utcnow)

    meta = {'collection': 'users'}
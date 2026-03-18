# Importamos path para definir rutas
from django.urls import path

# Importamos las vistas que creamos
from .views import RegisterView, LoginView

# Lista de rutas de la app users
urlpatterns = [
    # POST /api/users/register/ → crea un usuario nuevo
    path('register/', RegisterView.as_view(), name='register'),

    # POST /api/users/login/ → devuelve el token JWT
    path('login/', LoginView.as_view(), name='login'),
]
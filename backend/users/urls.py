# Importamos path para definir rutas
from django.urls import path
from .views import RegisterView, LoginView, ProfileView, ChangePasswordView


# Importamos las vistas que creamos
from .views import RegisterView, LoginView

# Lista de rutas de la app users
urlpatterns = [
    # POST /api/users/register/ → crea un usuario nuevo
    path('register/', RegisterView.as_view(), name='register'),

    # POST /api/users/login/ → devuelve el token JWT
    path('login/', LoginView.as_view(), name='login'),
    
    # profile/ maneja GET-Para ver los datos, Put-EDITAR NOMBRE/APELLIDO, DELETE-ELIMINAR CUENTA
    path('profile/', ProfileView.as_view(), name='profile'),
    # POST /api/users/change-password/ → cambia la contraseña del usuario autenticado
    path('change-password/', ChangePasswordView.as_view(), name='change-password')
]
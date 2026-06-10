# ARTEFACTOS DE CÓDIGO

Este documento describe los artefactos de código presentes en el proyecto Urban Store: árbol de carpetas anotado, tabla de módulos, snippets clave, dependencias y variables de entorno.

## 1. Árbol de carpetas anotado
```text
/ (raíz del repo)
├─ docker-compose.yml                    # Orquestación local (backend, frontend, mongo)
├─ README.md
├─ SRS.md
├─ API.md
├─ PROPUESTA_TECNICA.md
├─ ANALISIS_SOFTWARE.md
├─ backend/
│  ├─ manage.py
│  ├─ requirements.txt
│  ├─ Dockerfile
│  ├─ db.sqlite3                          # DB de desarrollo
│  ├─ config/ (settings, urls, asgi/wsgi)
│  ├─ users/ (auth y perfiles)
│  ├─ products/ (catalogo, mongoengine)
│  ├─ cart/
│  ├─ orders/
│  ├─ payments/ (stripe, webhooks)
│  ├─ recomendaciones/
│  ├─ analytics/
│  └─ chatbot/
└─ frontend/
   ├─ package.json
   ├─ Dockerfile
   ├─ next.config.mjs
   ├─ middleware.js
   └─ app/ (rutas y componentes Next.js)
```

## 2. Tabla de módulos
| Nombre | Tipo | Responsabilidad | Ruta |
|---|---|---|---|
| users | Django app | Autenticación JWT, registro, perfiles | backend/users/
| products | Django app | Modelos de producto (mongoengine), endpoints | backend/products/
| cart | Django app | Gestión carrito y sincronización | backend/cart/
| orders | Django app | Creación y gestión de pedidos | backend/orders/
| payments | Django app | Integración Stripe y webhooks | backend/payments/
| recomendaciones | Django app | Motor y endpoints de recomendaciones | backend/recomendaciones/
| analytics | Django app | Recolección y reporting de métricas | backend/analytics/
| chatbot | Django app | Asistente conversacional | backend/chatbot/
| frontend | Next.js app | UI, pages, providers, estado (Zustand) | frontend/

## 3. Snippets clave (documentados)
### Modelo Product (mongoengine)
```python
# backend/products/models.py
from mongoengine import Document, StringField, FloatField, ListField, DateTimeField

class Product(Document):
    """Modelo de producto almacenado en MongoDB via mongoengine.
    Campos principales: name, slug, description, price, images, categories, stock
    """
    name = StringField(required=True, max_length=200)
    slug = StringField(required=True, unique=True)
    description = StringField()
    price = FloatField(required=True)
    images = ListField(StringField())
    categories = ListField(StringField())
    stock = FloatField(default=0)
    created_at = DateTimeField()
    meta = {'collection': 'products'}
```

### Serializer de Order (DRF)
```python
# backend/orders/serializers.py
from rest_framework import serializers

class OrderItemSerializer(serializers.Serializer):
    product_id = serializers.CharField()
    quantity = serializers.IntegerField()
    price = serializers.FloatField()

class OrderSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    user = serializers.CharField(read_only=True)
    items = OrderItemSerializer(many=True)
    total = serializers.FloatField()
    status = serializers.CharField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
```

### Vista de autenticación JWT (ejemplo)
```python
# backend/users/views.py
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import permissions

class CustomTokenObtainPairView(TokenObtainPairView):
    permission_classes = (permissions.AllowAny,)
    # serializer_class = CustomTokenObtainPairSerializer  # <!-- TODO: confirmar -->
```

### Store de carrito (Zustand)
```javascript
// frontend/app/lib/store/cartStore.js
import create from 'zustand'

export const useCartStore = create((set) => ({
  items: [],
  addItem: (product) => set(state => ({ items: [...state.items, product] })),
  removeItem: (productId) => set(state => ({ items: state.items.filter(i => i.id !== productId) })),
  clear: () => set({ items: [] })
}))
```

### Middleware de autenticación (Next.js)
```javascript
// frontend/middleware.js
import { NextResponse } from 'next/server'

export function middleware(req) {
  const token = req.cookies.get('token')
  const { pathname } = req.nextUrl
  if (!token && pathname.startsWith('/perfil')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  return NextResponse.next()
}
```

## 4. Tabla de dependencias (extracto, versiones reales)
| Librería | Versión | Propósito |
|---|---:|---|
| Django | 6.0.3 | Framework backend |
| djangorestframework | 3.16.1 | API REST |
| mongoengine | 0.29.3 | ODM MongoDB |
| pymongo | 4.16.0 | Driver MongoDB |
| djangorestframework_simplejwt | 5.5.1 | JWT auth |
| PyJWT | 2.12.1 | JWT utils |
| stripe | 15.0.1 | Integración pagos |
| cloudinary | 1.44.1 | Media management |
| bcrypt | 4.0.1 | Hashing passwords |
| psycopg2-binary | <!-- TODO: versión --> | Soporte PostgreSQL |
| Next.js | 16.2.3 | Frontend framework |
| React | 18 | UI library |
| Zustand | 5.0.12 | State management frontend |
| TailwindCSS | 3.4.1 | Styling frontend |
| GSAP | 3.15.0 | Animations |
| AOS | 2.3.4 | Scroll animations |
| Three.js | 0.184.0 | 3D in frontend |

<!-- TODO: completar con el resto de dependencias listadas en backend/requirements.txt y frontend/package.json -->

## 5. Variables de entorno (referencia)
- Ver ENV_EXAMPLE.md para .env.example completo.

## 6. Scripts y comandos útiles
- Backend (desarrollo):
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```
- Frontend (desarrollo):
```bash
cd frontend
npm install
npm run dev
```

---
Urban Store — Artefactos de código. <!-- TODO: añadir referencias a tests unitarios específicos y ejemplos extraídos de archivos reales -->
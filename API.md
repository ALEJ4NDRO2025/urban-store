# API — Documentación de Endpoints

Este documento lista los endpoints disponibles en el backend Django (DRF) del proyecto Urban Store, con ejemplos de petición y respuesta. Todos los endpoints están prefijados por /api/ (salvo admin).

Nota: algunos esquemas de request/response requieren confirmación con los serializers en backend/*/serializers.py. Donde falta detalle se indica con <!-- TODO: -->.

## Autenticación y usuarios
### POST /api/users/register/  (registro)
- Descripción: Crear nuevo usuario.
- Cuerpo (JSON):
```json
{
  "email": "user@example.com",
  "password": "StrongPass123",
  "first_name": "Juan",
  "last_name": "Perez"
}
```
- Respuesta: 201 Created {user, tokens}
- Ejemplo curl:
```bash
curl -X POST "http://localhost:8000/api/users/register/" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"StrongPass123"}'
```

### POST /api/users/login/  (login)
- Descripción: Obtener tokens JWT.
- Cuerpo (JSON): {"email": "user@example.com", "password": "..."}
- Respuesta: 200 OK {access, refresh}

### GET /api/users/me/  (perfil autenticado)
- Descripción: Obtener datos del usuario autenticado.
- Autenticación: Bearer <access_token>
- Respuesta: 200 OK {id, email, first_name, last_name, ...}

## Productos (products)
### GET /api/products/
- Descripción: Listar productos, soporta query params: search, category, page, limit.
- Respuesta: 200 OK con listado paginado.

### GET /api/products/<slug>/
- Descripción: Detalle de producto por slug.
- Respuesta: 200 OK {id, name, slug, price, images, stock, description}

### POST /api/products/  (admin)
- Descripción: Crear producto (admin).
- Autenticación: Admin (token)
- Cuerpo: ver serializers en backend/products/serializers.py
- <!-- TODO: añadir ejemplo de body completo -->

## Carrito (cart)
### GET /api/cart/
- Descripción: Obtener carrito del usuario (o carrito anónimo por cookie/session).
- Respuesta: 200 OK {items: [{product_id, name, qty, price}], total}

### POST /api/cart/  (añadir item)
- Cuerpo (JSON): {"product_id": "<id>", "quantity": 2}
- Respuesta: 200 OK carrito actualizado

### POST /api/cart/sync/  (sync)
- Descripción: Sincronizar carrito cliente con servidor (merge on login).
- Cuerpo (JSON): {"items": [{"product_id":"...","quantity":1}, ...]}
- Respuesta: 200 OK carrito sincronizado

## Pedidos (orders)
### POST /api/orders/  (crear pedido)
- Descripción: Crear un pedido a partir del carrito.
- Cuerpo (JSON):
```json
{
  "cart_id": "<cart-id>",
  "shipping_address": {"line1":"...","city":"...","postal_code":"..."},
  "billing_address": {...},
  "payment_method": "stripe"
}
```
- Respuesta: 201 Created {order_id, amount}

### GET /api/orders/my-orders/
- Descripción: Listar pedidos del usuario autenticado.
- Respuesta: 200 OK [orders]

### GET /api/orders/all/  (admin)
- Descripción: Listar todos los pedidos (admin paginado).

### GET /api/orders/<order_id>/
- Descripción: Detalle del pedido.

### PATCH /api/orders/<order_id>/status/
- Descripción: Actualizar estado del pedido (admin).
- Cuerpo: {"status": "shipped"}

## Pagos (payments)
### POST /api/payments/create/  (crear pago - PaymentIntent)
- Descripción: Crear PaymentIntent en Stripe para un order_id.
- Cuerpo: {"order_id": "..."}
- Respuesta: 200 OK {client_secret}
- Notas: Backend usa la librería stripe v15.0.1 y requiere STRIPE_SECRET_KEY en .env.

### POST /api/payments/webhook/  (webhook)
- Descripción: Endpoint público para recibir eventos Stripe. Valida firma con STRIPE_WEBHOOK_SECRET.
- Headers: Stripe-Signature
- Respuesta: 200 OK

## Recomendaciones
### GET /api/recommendations/  ó /api/recomendaciones/recommendations/
- Descripción: Devuelve recomendaciones personalizadas según user_id o producto.
- Query params: ?user_id=<id>&product_id=<id>
- Respuesta: 200 OK {recommendations: [{product_id, score, reason}, ...]}

## Chatbot
### POST /api/chatbot/
- Descripción: Enviar mensaje al asistente. Mantener session_id para contexto.
- Cuerpo: {"session_id": "...", "message": "Hola"}
- Respuesta: 200 OK {reply: "...", actions: [...]}

## Analytics
### POST /api/analytics/track/
- Descripción: Enviar evento de cliente (page_view, add_to_cart, purchase).
- Cuerpo: {"event": "add_to_cart", "user_id": "...", "metadata": {...}}

### GET /api/analytics/dashboard-stats/
- Descripción: Obtener métricas para dashboard admin.

### GET /api/analytics/funnel/
- Descripción: Obtener conversión por funnel.

### GET /api/analytics/rfm/
- Descripción: Calcular RFM para segmentos.

## Autenticación y cabeceras
- La mayoría de endpoints requiere header:
  - Authorization: Bearer <access_token>
  - Content-Type: application/json

## Ejemplo completo: flujo de creación de pedido + pago (curl)
1) Crear pedido
```bash
curl -X POST "http://localhost:8000/api/orders/" \
 -H "Authorization: Bearer <ACCESS_TOKEN>" \
 -H "Content-Type: application/json" \
 -d '{"cart_id":"abc123","shipping_address": {"line1":"Calle 1","city":"Bogota","postal_code":"110111"}}'
```
2) Crear PaymentIntent
```bash
curl -X POST "http://localhost:8000/api/payments/create/" \
 -H "Authorization: Bearer <ACCESS_TOKEN>" \
 -H "Content-Type: application/json" \
 -d '{"order_id":"<order_id>"}'
```

---
Referencias: rutas cargadas en backend/config/urls.py y archivos backend/*/urls.py.
<!-- TODO: completar esquemas de request/response leyendo serializers.py para cada app -->

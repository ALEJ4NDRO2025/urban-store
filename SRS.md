# SRS — Especificación de Requisitos de Software (IEEE 830)

## 1. Introducción

### 1.1 Propósito
Este documento especifica los requisitos de software del proyecto Urban Store — E‑commerce de streetwear. Está dirigido a desarrolladores, QA, product owners y administradores del programa SENA ADSO.

### 1.2 Alcance
Urban Store es una aplicación web full‑stack que ofrece catálogo de productos, gestión de usuarios con JWT, carrito de compras persistente, creación y seguimiento de pedidos, integración de pagos mediante Stripe, recomendaciones personalizadas, chatbot de asistencia y analítica de comportamiento.

### 1.3 Definiciones y acrónimos
- API: Application Programming Interface
- JWT: JSON Web Token
- DRF: Django REST Framework
- PWA: Progressive Web App
- RF: Requisito Funcional
- RNF: Requisito No Funcional
- CU: Caso de Uso

### 1.4 Referencias
- Código del proyecto en el workspace (estructura provista).
- Dependencias principales: Django 6.0.3, DRF 3.16.1, Next.js 16.2.3, MongoDB 7, Stripe 15.0.1.
- <!-- TODO: agregar enlaces a políticas internas, RFCs o documentación externa relevante -->

### 1.5 Visión general
El documento contiene requisitos funcionales y no funcionales, descripciones de casos de uso, restricciones, supuestos y criterios de aceptación.

## 2. Descripción general

### 2.1 Perspectiva del producto
Urban Store está diseñado como un monolito modular: back‑end (Django + DRF) que expone una API REST consumida por el front‑end (Next.js App Router). Persistencia principal en MongoDB (mongoengine) y opción PostgreSQL para producción relacional.

### 2.2 Funciones del producto (resumen)
- Autenticación JWT (login, refresh, logout). 
- Gestión de usuarios y perfiles.
- Catálogo de productos (CRUD en admin, búsqueda, filtros).
- Carrito de compras (persistente y sincronizable).
- Flujo de checkout y pagos con Stripe.
- Gestión de pedidos con estados y trazabilidad.
- Motor de recomendaciones.
- Chatbot conversacional.
- Analytics y dashboards.

### 2.3 Clases de usuario
- Guest: visitante sin cuenta.
- Customer: usuario autenticado (cliente).
- Admin: usuario con privilegios administrativos.

### 2.4 Restricciones
- Backend corre en puerto 8000 (Django). Frontend en 3000 (Next.js).
- Servicios externos obligatorios: Stripe, Cloudinary, MongoDB. 
- Docker Compose orquesta backend, frontend y mongo en desarrollo.

### 2.5 Supuestos
- Servicios externos disponibles y con credenciales. 
- El equipo dispone de credenciales para Stripe y Cloudinary en entornos secure.
- <!-- TODO: agregar SLA y niveles de servicio aceptados -->

## 3. Requisitos funcionales (RF)

RF-001: Autenticación con JWT
- ID: RF-001
- Descripción: El sistema deberá permitir registro y login mediante JWT usando djangorestframework_simplejwt.
- Actor: Guest
- Prioridad: Alta
- Criterios de aceptación: POST /api/users/login/ devuelve access y refresh tokens.

RF-002: Gestión de usuarios
- ID: RF-002
- Descripción: CRUD de perfiles de usuario, recuperación de contraseña y actualización de datos.
- Actor: Customer, Admin
- Prioridad: Alta

RF-003: Catálogo de productos
- ID: RF-003
- Descripción: Listado, detalle, búsqueda y filtros; imágenes en Cloudinary.
- Endpoint base: /api/products/
- Prioridad: Alta

RF-004: Carrito de compras
- ID: RF-004
- Descripción: Añadir/editar/eliminar items; persistencia por usuario; sincronización con /api/cart/sync/.
- Endpoint base: /api/cart/
- Prioridad: Alta

RF-005: Pedidos
- ID: RF-005
- Descripción: Crear pedido desde carrito, ver historial (/api/orders/my-orders/), detalle de pedido, actualización de estado por admin.
- Prioridad: Alta

RF-006: Pagos (Stripe)
- ID: RF-006
- Descripción: Crear PaymentIntent, confirmar pago, procesar webhooks en /api/payments/webhook/.
- Prioridad: Alta

RF-007: Recomendaciones
- ID: RF-007
- Descripción: Endpoint para recomendaciones personalizadas (/api/recommendations/).
- Prioridad: Media

RF-008: Chatbot
- ID: RF-008
- Descripción: Endpoint para interacción conversacional con asistentes (/api/chatbot/).
- Prioridad: Media

RF-009: Analytics
- ID: RF-009
- Descripción: Endpoints para trackeo de eventos y métricas (/api/analytics/track/, dashboard-stats/ ...).
- Prioridad: Media

RF-010: Admin
- ID: RF-010
- Descripción: Gestión de productos, pedidos y usuarios en Django Admin.
- Prioridad: Alta

## 4. Requisitos no funcionales (RNF)

RNF-001: Rendimiento
- Tiempo de respuesta objetivo: < 300 ms en endpoints de lectura bajo carga moderada. <!-- TODO: definir métricas y herramientas de benchmark -->

RNF-002: Seguridad
- Contraseñas con bcrypt; TLS en producción; validación y firma de webhooks Stripe; CORS configurado con django-cors-headers.

RNF-003: Escalabilidad
- Arquitectura preparada para separar servicios por contenedor y escalar backend y mongo si requerido.

RNF-004: Disponibilidad
- Objetivo inicial: 99.5% uptime en producción. <!-- TODO: confirmar SLA con stakeholders -->

RNF-005: Usabilidad
- Diseño responsive; accesibilidad objetivo WCAG AA. <!-- TODO: criterios concretos de accesibilidad -->

## 5. Casos de uso (detallados)

### Diagrama de casos de uso
```mermaid
%% CU-Principal
actor Guest
actor Customer
actor Admin

Customer --> (Explorar catálogo)
Customer --> (Añadir al carrito)
Customer --> (Checkout / Pagar)
Customer --> (Ver historial de pedidos)
Guest --> (Explorar catálogo)
Guest --> (Registro / Login)
Admin --> (Gestionar productos)
Admin --> (Gestionar pedidos)
Admin --> (Ver analytics)
Customer --> (Interaccionar con chatbot)
```

### CU-001: Registro y autenticación
- Actor: Guest
- Precondiciones: Acceso a formulario de registro
- Flujo principal:
  1. Guest completa formulario con email y contraseña.
  2. POST /api/users/register/ -> backend valida y crea usuario.
  3. Backend devuelve access y refresh tokens.
- Flujo alternativo: Email ya registrado -> mostrar error y sugerir recuperación de contraseña.
- Postcondición: Usuario creado y autenticado.

### CU-002: Compra (carrito → checkout → pago)
- Actor: Customer
- Precondiciones: Cliente autenticado y carrito no vacío.
- Flujo principal:
  1. GET /api/cart/ para revisar items.
  2. POST /api/orders/ crea pedido preliminar.
  3. POST /api/payments/create/ crea PaymentIntent en Stripe.
  4. Frontend completa pago con Stripe (client_secret).
  5. Stripe envía webhook a /api/payments/webhook/.
  6. Backend valida webhook y marca order como paid.
- Postcondición: Pedido confirmado y registrado; notificaciones enviadas.

### CU-003: Gestión de productos (Admin)
- Actor: Admin
- Precondiciones: Usuario Admin autenticado en Django Admin.
- Flujo principal:
  1. Admin accede a Django Admin.
  2. Crea/edita/elimina productos.
  3. Cambios actualizados en catalog.
- Postcondición: Catálogo actualizado.

<!-- TODO: Añadir CU para chatbot, recomendaciones y analytics con detalle -->

## 6. Anexos
- API endpoints: ver API.md (generado junto a esta documentación). 
- Variables de entorno: ver ENV_EXAMPLE.md.

<!-- FIN SRS -->
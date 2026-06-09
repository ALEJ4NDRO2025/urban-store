# urban-store

Urban-store es una aplicación de comercio electrónico (e‑commerce) compuesta por un backend en Django y un frontend en Next.js. Este README describe el propósito del proyecto, su arquitectura, los componentes principales, tecnologías usadas, dependencias y pasos para ejecutar, probar y desplegar la aplicación.

Resumen rápido
- Backend: Django (API REST, lógica de negocio, administración).
- Frontend: Next.js (React) con TailwindCSS (UI).
- Contenerización: Docker + docker-compose.
- Base de datos de desarrollo: SQLite (backend/db.sqlite3). En producción use PostgreSQL u otra DB relacional.

Estructura del proyecto (carpetas principales)
- docker-compose.yml — orquestación de servicios (backend, frontend, db, etc.).
- backend/ — proyecto Django con aplicaciones por dominio:
  - analytics/ — recolección y gestión de métricas/eventos.
  - cart/ — lógica del carrito de compras.
  - chatbot/ — integración de asistente conversacional.
  - config/ — settings, asgi/wsgi, urls globales y configuración del proyecto.
  - env/ — entorno virtual incluido en el repo (puede eliminarse del control de versiones).
  - orders/ — creación y seguimiento de pedidos.
  - payments/ — integración con pasarelas y webhooks.
  - products/ — modelos, serializadores y vistas de producto.
  - recomendaciones/ — motor/heurísticas de recomendaciones.
  - users/ — gestión de usuarios, autenticación y perfiles.
  - manage.py, requirements.txt, Dockerfile, db.sqlite3
- frontend/ — aplicación Next.js (app router) con UI y lógica cliente/servidor híbrida:
  - app/ — páginas y componentes (admin, carrito, catálogo, checkout, perfil, auth, etc.).
  - next.config.mjs, middleware.js, package.json, tailwind.config.js, Dockerfile.
- placeholder.jpg — imagen genérica incluida en el repo.

Arquitectura y responsabilidades
- Separación de capas: frontend (presentación) <-> API REST (backend). El frontend consume la API expuesta por Django (endpoints en /api/ o rutas definidas en backend/config/urls.py).
- Backend:
  - Models: definición de entidades (products, orders, users, etc.) en cada app.
  - Views/Serializers: lógica de exposición de datos (DRF si está configurado).
  - Admin: administración interna (Django Admin).
  - Migrations: control de esquema en backend/*/migrations.
- Frontend:
  - Rutas y páginas en frontend/app/ usando el App Router de Next.js.
  - Componentes reutilizables en frontend/app/components/.
  - Estilado con TailwindCSS y configuración PostCSS.

Principales endpoints esperados (ejemplos)
- /api/users/ — registro, login, perfil (backend/users/urls.py).
- /api/products/ — listado, detalle, búsqueda (backend/products/urls.py).
- /api/cart/ — ver y modificar carrito (backend/cart/urls.py).
- /api/orders/ — crear y listar pedidos (backend/orders/urls.py).
- /api/payments/ — iniciar pago, confirmación y webhooks (backend/payments/urls.py).
- /api/recomendaciones/ — recomendaciones (backend/recomendaciones/urls.py).
- /api/chatbot/ — endpoints del asistente (backend/chatbot/urls.py).

Tecnologías y dependencias
- Backend:
  - Python 3.11/3.13 (según el entorno), Django (versión en backend/requirements.txt).
  - Posible uso de Django REST Framework (DRF) si está listado en requirements.txt.
  - Dependencias listadas en backend/requirements.txt.
- Frontend:
  - Node.js y npm, Next.js, React, TailwindCSS, PostCSS.
  - Dependencias listadas en frontend/package.json.
- Contenerización: Docker y docker-compose para desarrollo y despliegue.

Variables de entorno (ejemplos - NO subir secretos al repo)
- backend/.env (sugerido):
  - DJANGO_SECRET_KEY="cambia-esta-clave"
  - DEBUG=True
  - ALLOWED_HOSTS=localhost,127.0.0.1
  - DATABASE_URL=sqlite:///db.sqlite3  # o URL a Postgres
  - EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD
  - STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET (si se usa Stripe)
- frontend/.env.local (sugerido):
  - NEXT_PUBLIC_API_URL=http://localhost:8000/api
  - NEXT_PUBLIC_STRIPE_KEY=pk_test_...

Ejecución local
Opción A — Con Docker Compose (recomendado):
1. Desde la raíz del proyecto:
   docker-compose up --build
2. Acceder a:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8000

Opción B — Ejecutar por separado en macOS
Backend (Django):
1. cd backend
2. python3 -m venv .venv && source .venv/bin/activate
3. pip install -r requirements.txt
4. python manage.py migrate
5. python manage.py createsuperuser  # opcional
6. python manage.py runserver 0.0.0.0:8000

Frontend (Next.js):
1. cd frontend
2. npm install
3. npm run dev

Base de datos
- Desarrollo: SQLite incluido en backend/db.sqlite3.
- Producción: migrar a PostgreSQL o servicio administrado. Actualizar backend/config/settings.py y variables de entorno.

Testing y calidad de código
- Backend: pruebas unitarias con Django TestCase en backend/*/tests.py
  - Ejecutar: cd backend && python manage.py test
- Frontend: scripts definidos en frontend/package.json (lint, test)
  - Ejecutar: cd frontend && npm run lint && npm test (si existen tests)

Build y despliegue
- Construir imágenes Docker desde los Dockerfile en frontend/ y backend/.
- Subir imágenes a un registro y desplegar en el proveedor elegido (ECS, GKE, Cloud Run, DigitalOcean, etc.).
- En producción:
  - Reemplazar SQLite por PostgreSQL.
  - Configurar HTTPS y dominio.
  - Configurar variables de entorno y secretos en un gestor seguro.
  - Configurar escalado y workers (Celery + Redis si aplica).

Buenas prácticas recomendadas
- No subir archivos con secretos (.env, env/...). Añadir env/ a .gitignore si corresponde.
- Mantener tests y cubrir flujos críticos: users, payments, orders.
- Documentar API (OpenAPI/Swagger) si se usa DRF.
- Configurar CI (GitHub Actions, GitLab CI): ejecutar linters, tests y builds.
- Monitorización en producción: Sentry, Prometheus/Grafana.

Cómo contribuir
1. Crear rama feature/ o fix/ basada en main.
2. Escribir tests para cambios relevantes.
3. Ejecutar linters y pruebas locales.
4. Abrir Pull Request con descripción y screenshots si aplica.

Archivos y rutas clave
- backend/manage.py — punto de entrada de Django.
- backend/requirements.txt — dependencias Python.
- backend/config/settings.py — configuración principal.
- backend/*/urls.py — rutas por aplicación (products, orders, cart, etc.).
- frontend/app/ — páginas y componentes de Next.js.
- frontend/package.json — scripts y dependencias de frontend.
- docker-compose.yml — orquestación multi-contenedor.

Siguientes mejoras posibles
- Documentación automática de la API (Swagger/OpenAPI).
- Tests E2E (Cypress/Playwright) para flujos críticos.
- Migración a base de datos relacional en production y configuración de backups.
- Separar servicios en microservicios si la carga crece significativamente.

Si quieres, puedo generar:
- Plantillas .env con explicaciones para cada variable.
- Documentación automática de endpoints leyendo backend/*/urls.py.
- Ejemplos de tests unitarios para una app concreta (products, orders, payments).

Licencia
- Añade una LICENSE (por ejemplo MIT) según política del proyecto.

--
Urban-store — documentación técnica básica. Para detalles adicionales solicita la sección concreta que quieras ampliar (API, despliegue, tests, etc.).
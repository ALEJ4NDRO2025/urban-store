# PRUEBAS — Estrategia, Plan y Casos de Prueba

## 1. Estrategia de Pruebas
Objetivo: garantizar la calidad funcional y no funcional de Urban Store mediante pruebas automatizadas y manuales. Niveles de prueba:
- Unitarias: lógica de negocio (Django TestCase, Jest/React Testing Library). 
- Integración: endpoints REST con DRF APIClient.
- E2E: flujos críticos con Playwright o Cypress (registro, compra completa, webhook Stripe).
- Mocking: Stripe y servicios externos (Cloudinary) en pruebas.

Criterios de aceptación:
- Tests unitarios y de integración deben pasar en CI antes de merge.
- Cobertura objetivo: Backend >=80% en módulos críticos (users, orders, payments); Frontend >=70%.

## 2. Plan de Pruebas
Alcance: auth, products, cart, orders, payments (Stripe mock), recomendaciones, chatbot, analytics.
Recursos: entorno CI con MongoDB (mongo:7), Node 18, Python 3.11.
Criterios de entrada: código compilable, dependencias instaladas, variables de entorno de prueba.
Criterios de salida: todos los tests automatizados pasan y E2E críticos pasan en staging.

## 3. Casos de prueba (tabla representativa)
| ID | Nombre | Módulo | Precondiciones | Pasos | Resultado esperado | Prioridad |
|---|---|---|---|---|---|---|
| TC-001 | Registro usuario | users | N/A | POST /api/users/register/ | 201 + tokens | Alta |
| TC-002 | Login usuario | users | Usuario creado | POST /api/users/login/ | 200 + access/refresh | Alta |
| TC-003 | CRUD producto | products | Admin auth | POST/GET/PATCH/DELETE /api/products/ | 201/200/200/204 | Media |
| TC-004 | Añadir al carrito | cart | Producto disponible | POST /api/cart/ | 200 carrito con item | Alta |
| TC-005 | Crear orden | orders | Carrito con items | POST /api/orders/ | 201 order_id | Alta |
| TC-006 | Pago Stripe mock | payments | Order creada | Simular webhook payment_intent.succeeded | Order.status == paid | Alta |
| TC-007 | Sync carrito tras login | cart | Carrito anónimo + login | POST /api/cart/sync/ | Carrito mergeado | Media |
| TC-008 | Chatbot responde | chatbot | N/A | POST /api/chatbot/ | 200 reply | Media |

## 4. Ejemplos de pruebas unitarias (Django)
```python
# backend/users/tests.py
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status

class UserTests(APITestCase):
    def test_user_registration(self):
        url = reverse('users-register')
        data = {'email':'test@example.com','password':'StrongPass123'}
        resp = self.client.post(url, data, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', resp.data)
```

## 5. Ejemplo de prueba de integración (DRF APIClient)
```python
# backend/orders/tests.py
from rest_framework.test import APITestCase
from django.urls import reverse

class OrderIntegrationTests(APITestCase):
    def setUp(self):
        # crear usuario y producto (mock) y autenticar
        pass  # <!-- TODO: implementar fixtures reales -->

    def test_create_order_and_process_payment(self):
        # flow: add product to cart, create order, mock stripe webhook
        pass  # <!-- TODO: llenar pasos concretos -->
```

## 6. Escenarios E2E recomendados (Playwright/Cypress)
- Flujo completo de compra: registro -> añadir producto -> checkout -> pago mock -> ver orden confirmada.
- Flujo de login y sincronización de carrito.
- Admin: crear producto y verificar aparición en catálogo.

## 7. Mocking de Stripe
- Emplear stripe-mock o librerías de mocking para simular PaymentIntent y webhooks.
- Validar firma del webhook con STRIPE_WEBHOOK_SECRET en pruebas.

## 8. Plantilla de reporte de bugs
- ID: BUG-XXX
- Resumen: breve descripción
- Pasos para reproducir: paso a paso
- Resultado esperado
- Resultado real
- Logs / stacktrace
- Prioridad / Severidad
- Asignado a

## 9. Métricas de calidad y cobertura
- Cobertura: medir con coverage.py (backend) y jest coverage (frontend).
- KPIs: % tests pasados, tiempo medio de pipeline CI, errores críticos en staging.

---
PRUEBAS.md creado: estrategia, plan, casos y ejemplos. <!-- TODO: añadir fixtures y ejemplos completos de E2E en Playwright -->
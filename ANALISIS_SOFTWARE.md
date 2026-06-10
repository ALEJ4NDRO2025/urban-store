# ANÁLISIS DEL SOFTWARE — Vistas Dinámicas

Este documento contiene diagramas dinámicos que describen los flujos principales del sistema Urban Store: login con JWT, flujo completo de compra, interacciones del chatbot, procesos de registro y pago, y diagramas de estados para Orders y Cart. Todos los diagramas están en Mermaid.

## 1. Secuencia: Login con JWT
```mermaid
sequenceDiagram
    participant FE as Frontend (Next.js)
    participant API as Backend (Django DRF)
    participant AUTH as SimpleJWT

    FE->>API: POST /api/users/login/ {email, password}
    API->>AUTH: validar credenciales (SimpleJWT)
    AUTH-->>API: access_token, refresh_token
    API-->>FE: 200 OK {access_token, refresh_token, user}
    Note right of FE: Guardar token en HttpOnly cookie o localStorage (según política)
```

## 2. Secuencia: Flujo completo de compra (carrito → checkout → Stripe → confirmación pedido)
```mermaid
sequenceDiagram
    participant Customer
    participant FE as Frontend
    participant API as Backend
    participant Stripe
    participant Webhook

    Customer->>FE: Click checkout
    FE->>API: POST /api/orders/ {cart_id, shipping, billing}
    API-->>FE: 201 Created {order_id, amount}
    FE->>API: POST /api/payments/create/ {order_id, payment_method}
    API->>Stripe: crear PaymentIntent (Stripe SDK v15.0.1)
    Stripe-->>API: payment_intent {client_secret}
    API-->>FE: 200 {client_secret}
    FE->>Stripe: completar pago (cliente con @stripe/stripe-js)
    Stripe->>Webhook: enviar evento payment_intent.succeeded
    Webhook->>API: POST /api/payments/webhook/ {evento firmado}
    API->>API: validar firma (STRIPE_WEBHOOK_SECRET) y actualizar order -> paid
    API-->>FE: notificar confirmación (respuesta API / correo)
```

## 3. Secuencia: Chatbot request/response
```mermaid
sequenceDiagram
    participant User
    participant FE
    participant API
    participant ChatbotSvc

    User->>FE: enviar mensaje al chatbot
    FE->>API: POST /api/chatbot/ {message, session_id}
    API->>ChatbotSvc: procesar mensaje (modelo/servicio externo)
    ChatbotSvc-->>API: respuesta {text, actions}
    API-->>FE: 200 {text, actions}
    FE-->>User: mostrar respuesta
```

## 4. Actividad: Proceso de registro de usuario
```mermaid
flowchart TD
    A[Inicio: formulario registro] --> B{Validar datos}
    B -->|Ok| C[Crear usuario en MongoDB via mongoengine]
    C --> D[Generar tokens JWT (SimpleJWT)]
    D --> E[Enviar email verificación (EMAIL_HOST)]
    E --> F[Redirigir a dashboard o login]
    B -->|Error| G[Mostrar errores]
```

## 5. Actividad: Proceso de pago con Stripe + webhook
```mermaid
flowchart TD
    A[Cliente inicia pago] --> B[Backend crea PaymentIntent]
    B --> C[Backend devuelve client_secret al Frontend]
    C --> D[Frontend completa pago con Stripe Elements]
    D --> E[Stripe procesa pago]
    E --> F[Stripe envía webhook a /api/payments/webhook/]
    F --> G[Backend valida firma y estado del evento]
    G --> H[Backend actualiza Order.status -> paid]
    H --> I[Emitir señal (Django signals) para analytics y notificaciones]
```

## 6. Diagrama de estados: Ciclo de vida de un Order
```mermaid
stateDiagram-v2
    [*] --> pending
    pending --> paid : payment confirmed
    paid --> shipped : marca como enviado
    shipped --> delivered : entrega confirmada
    pending --> cancelled : cancelado (cliente/admin)
    paid --> refunded : reembolso procesado
```

## 7. Diagrama de estados: Ciclo de vida del Cart
```mermaid
stateDiagram-v2
    [*] --> empty
    empty --> active : add item
    active --> checkout : iniciar checkout
    checkout --> completed : order creada
    active --> abandoned : timeout/usuario sale
    abandoned --> active : reactivación (login/sync)
```

---
Urban Store — Análisis de Software (vistas dinámicas). <!-- TODO: agregar tiempos de respuesta esperados y métricas de carga -->

// frontend/app/lib/analytics.js

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Obtiene un session_id único y persistente durante toda la vida de la pestaña.
 */
function getSessionId() {
  if (typeof window !== 'undefined' && window.__URBAN_SESSION_ID__) {
    return window.__URBAN_SESSION_ID__;
  }

  let sessionId = null;
  if (typeof window !== 'undefined') {
    sessionId = localStorage.getItem('session_id');
  }

  if (!sessionId) {
    sessionId = crypto.randomUUID();
  }

  if (typeof window !== 'undefined') {
    window.__URBAN_SESSION_ID__ = sessionId;
    localStorage.setItem('session_id', sessionId);
  }

  return sessionId;
}

/**
 * Genera una clave de idempotencia basada en session, tipo de evento, producto y ventana temporal.
 */
async function generateIdempotencyKey(eventType, productSlug = 'no-slug') {
  const sessionId = getSessionId();
  const now = Math.floor(Date.now() / 5000); // ventana de 5 segundos
  const raw = `${sessionId}|${eventType}|${productSlug}|${now}`;

  const msgBuffer = new TextEncoder().encode(raw);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Envía un evento a Google Analytics 4 si el script está disponible.
 */
function gtagEvent(eventName, params = {}) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
}

/**
 * Registra un evento de usuario en el backend y en GA4.
 */
export async function trackEvent(eventType, data = {}) {
  const sessionId = getSessionId();
  const productSlug = data.product_slug || 'no-slug';
  const idempotency_key = await generateIdempotencyKey(eventType, productSlug);

  // 1. Enviar al backend propio
  const payload = {
    event_type: eventType,
    session_id: sessionId,
    idempotency_key,
    ...data,
  };

  try {
    await fetch(`${API_URL}/api/analytics/track/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('Error registrando evento en backend:', err);
  }

  // 2. Enviar a Google Analytics 4
  const gaParams = {
    event_category: 'ecommerce',
    event_label: data.product_name || data.product_slug || '',
    value: parseFloat(data.price) || 0,
    ...data.metadata,            // añade cualquier metadato extra
  };

  gtagEvent(eventType, gaParams);
}

/**
 * Registra un evento de error en el backend y en GA4.
 */
export async function trackError(errorType, errorMessage, context = {}) {
  const sessionId = getSessionId();
  const idempotency_key = await generateIdempotencyKey(errorType, 'error');

  // 1. Enviar al backend propio
  const payload = {
    event_type: errorType,
    session_id: sessionId,
    error_message: errorMessage,
    metadata: context,
    idempotency_key,
  };

  try {
    await fetch(`${API_URL}/api/analytics/track/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('Error registrando error en backend:', err);
  }

  // 2. Enviar a Google Analytics 4
  gtagEvent(errorType, {
    event_category: 'error',
    event_label: errorMessage,
    ...context,
  });
}
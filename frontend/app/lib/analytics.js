// frontend/app/lib/analytics.js
/**
 * Utilidad para registrar eventos de usuario en el backend de analíticas.
 * Soporta eventos estándar y eventos de error.
 * 
 * 🔒 El session_id se persiste en window y localStorage.
 * 🔒 Cada evento incluye un idempotency_key para evitar duplicados.
 */

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
 * @param {string} eventType 
 * @param {string} productSlug 
 * @returns {Promise<string>} hash SHA-256 hexadecimal
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
 * Registra un evento de usuario en el servidor.
 * @param {string} eventType 
 * @param {Object} data - product_slug, product_name, price, metadata, etc.
 */
export async function trackEvent(eventType, data = {}) {
  const sessionId = getSessionId();
  const productSlug = data.product_slug || 'no-slug';
  const idempotency_key = await generateIdempotencyKey(eventType, productSlug);

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
    console.warn('Error registrando evento:', err);
  }
}

/**
 * Registra un evento de error en el servidor.
 * @param {string} errorType 
 * @param {string} errorMessage 
 * @param {Object} context 
 */
export async function trackError(errorType, errorMessage, context = {}) {
  const sessionId = getSessionId();
  const idempotency_key = await generateIdempotencyKey(errorType, 'error');

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
    console.warn('Error registrando error:', err);
  }
}
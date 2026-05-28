// frontend/app/lib/analytics.js

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ============================================================
// MAPEO DE NOMBRES DE EVENTO INTERNOS → ESTÁNDAR GA4
// ============================================================
const GA4_EVENT_NAMES = {
  page_view: 'page_view',
  product_view: 'view_item',
  add_to_cart: 'add_to_cart',
  begin_checkout: 'begin_checkout',
  purchase: 'purchase',
  checkout_started: 'checkout_progress',
  payment_info_entered: 'add_payment_info',
  payment_error: 'exception',
  address_error: 'exception',
  checkout_error: 'exception',
  payment_confirmation_error: 'exception',
};

// ============================================================
// GESTIÓN DE SESIÓN PERSISTENTE
// ============================================================
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

// ============================================================
// 🆕 OBTENER TOKEN JWT (si el usuario está logueado)
// ============================================================
function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access');
}

// ============================================================
// GENERACIÓN DE CLAVE DE IDEMPOTENCIA
// ============================================================
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

// ============================================================
// DETECTAR FUENTE DE TRÁFICO (UTM, referrer, directo)
// ============================================================
function getTrafficSource() {
  if (typeof window === 'undefined') return 'direct';

  const urlParams = new URLSearchParams(window.location.search);
  const utmSource = urlParams.get('utm_source');
  if (utmSource) return utmSource.toLowerCase();

  const referrer = document.referrer;
  if (!referrer) return 'direct';

  if (referrer.includes('google.com')) return 'google';
  if (referrer.includes('facebook.com') || referrer.includes('instagram.com')) return 'social';
  if (referrer.includes('twitter.com') || referrer.includes('t.co')) return 'twitter';
  return 'referral';
}

// ============================================================
// 🆕 PERSISTIR LA FUENTE DE TRÁFICO DURANTE TODA LA SESIÓN
// ============================================================
function getPersistedTrafficSource() {
  if (typeof window === 'undefined') return 'direct';

  const storedSource = sessionStorage.getItem('utm_source');
  if (storedSource) return storedSource;

  const currentSource = getTrafficSource();

  if (currentSource !== 'direct') {
    sessionStorage.setItem('utm_source', currentSource);
  }

  return currentSource;
}

// ============================================================
// FUNCIÓN AUXILIAR PARA ENVIAR A GOOGLE ANALYTICS 4
// ============================================================
function gtagEvent(eventName, params = {}) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
}

// ============================================================
// CONSTRUIR EL ARRAY DE ITEMS PARA GA4
// ============================================================
function buildGa4Items(data) {
  const item = {
    item_id: data.product_slug || '',
    item_name: data.product_name || '',
    price: parseFloat(data.price) || 0,
    quantity: data.metadata?.quantity || 1,
  };
  return [item];
}

// ============================================================
// REGISTRAR EVENTO DE USUARIO (BACKEND + GA4)
// ============================================================
export async function trackEvent(eventType, data = {}) {
  const sessionId = getSessionId();
  const productSlug = data.product_slug || 'no-slug';
  const idempotency_key = await generateIdempotencyKey(eventType, productSlug);

  // 1. Enviar al backend propio (con source persistido y token)
  const payload = {
    event_type: eventType,
    session_id: sessionId,
    idempotency_key,
    source: getPersistedTrafficSource(),
    ...data,
  };

  try {
    await fetch(`${API_URL}/api/analytics/track/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken() || ''}`,   // ← 🆕 envía el token si existe
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('Error registrando evento en backend:', err);
  }

  // 2. Enviar a Google Analytics 4 (estándar)
  const ga4EventName = GA4_EVENT_NAMES[eventType] || eventType;
  const gaParams = {};

  if (['product_view', 'add_to_cart', 'begin_checkout', 'purchase', 'checkout_started', 'payment_info_entered'].includes(eventType)) {
    gaParams.items = buildGa4Items(data);
    gaParams.value = parseFloat(data.price) || 0;
    gaParams.currency = 'COP';
  }

  if (eventType === 'purchase') {
    gaParams.transaction_id = data.metadata?.order_number || data.metadata?.transaction_id || '';
  }

  if (eventType.endsWith('_error')) {
    gaParams.description = data.error_message || eventType;
    gaParams.fatal = false;
  }

  gtagEvent(ga4EventName, gaParams);
}

// ============================================================
// REGISTRAR EVENTO DE ERROR (BACKEND + GA4)
// ============================================================
export async function trackError(errorType, errorMessage, context = {}) {
  const sessionId = getSessionId();
  const idempotency_key = await generateIdempotencyKey(errorType, 'error');

  const payload = {
    event_type: errorType,
    session_id: sessionId,
    error_message: errorMessage,
    metadata: context,
    idempotency_key,
    source: getPersistedTrafficSource(),
  };

  try {
    await fetch(`${API_URL}/api/analytics/track/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken() || ''}`,   // ← 🆕 envía el token si existe
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('Error registrando error en backend:', err);
  }

  gtagEvent('exception', {
    description: errorMessage,
    fatal: false,
    ...context,
  });
}
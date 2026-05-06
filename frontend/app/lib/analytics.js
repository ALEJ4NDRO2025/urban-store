
// frontend/app/lib/analytics.js
/**
 * Utilidad para registrar eventos de usuario en el backend de analíticas.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Registra un evento en el servidor.
 * @param {string} eventType - Tipo de evento ('product_view', 'add_to_cart', 'remove_from_cart', 'begin_checkout', 'purchase', 'cart_abandon')
 * @param {Object} data - Datos adicionales (product_slug, product_name, price, metadata)
 */
export async function trackEvent(eventType, data = {}) {
  // Obtener o generar un sessionId persistente (para usuarios anónimos)
  let sessionId = localStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('session_id', sessionId);
  }

  // Añadir el session_id al payload
  const payload = {
    event_type: eventType,
    session_id: sessionId,
    ...data,
  };

  try {
    await fetch(`${API_URL}/api/analytics/track/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // No interrumpir la experiencia del usuario si falla el tracking
    console.warn('Error registrando evento:', err);
  }
}
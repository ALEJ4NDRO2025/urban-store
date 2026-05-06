'use client';

// ============================================================
// 1. IMPORTS Y CONFIGURACIÓN INICIAL
// ============================================================

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useCartStore } from '../lib/cartStore';
import { c, styles, mergeStyles } from '../lib/styles';
import { departamentos, departamentosYCiudades } from '../lib/colombiaData';
import CheckoutForm from './CheckoutForm';
import { trackEvent } from '../lib/analytics'; // ← Importar función para analíticas

// URL base del backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Clave publicable de Stripe (debe estar en .env.local)
const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

// ============================================================
// 2. PERSONALIZACIÓN DE STRIPE ELEMENTS (diseño dorado)
// ============================================================

const stripeAppearance = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#B8860B',
    colorBackground: '#1a1a1a',
    colorText: '#FFFFFF',
    colorDanger: '#ef4444',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    borderRadius: '14px',
    spacingUnit: '4px',
    colorTextSecondary: '#a0a0a0',
  },
  rules: {
    '.Input': {
      backgroundColor: 'rgba(38, 38, 38, 0.6)',
      border: '1px solid rgba(184, 134, 11, 0.2)',
      padding: '14px 16px',
      borderRadius: '14px',
      color: '#FFFFFF',
    },
    '.Input:focus': {
      borderColor: '#B8860B',
      boxShadow: '0 0 0 1px #B8860B',
    },
    '.Label': {
      fontSize: '13px',
      color: '#a0a0a0',
      marginBottom: '6px',
      fontWeight: 500,
    },
  },
};

// ============================================================
// 3. COMPONENTE DE PAGO (PASO 2) – Stripe Elements
// ============================================================
function PaymentStep({ clientSecret, orderId }) {
  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance: stripeAppearance }}>
      <CheckoutForm clientSecret={clientSecret} orderId={orderId} />
    </Elements>
  );
}

// ============================================================
// 4. COMPONENTE PRINCIPAL DEL CHECKOUT
// ============================================================
export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumeOrderId = searchParams.get('resume_order'); // Reanudar pago

  const { items, total, createOrder } = useCartStore();

  // Estados generales
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estados flujo de pago
  const [step, setStep] = useState('address');
  const [orderId, setOrderId] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);

  // Formulario dirección
  const [form, setForm] = useState({
    name: '',
    email: '',
    address: '',
    city: '',
    customCity: '',
    department: '',
    country: 'Colombia',
    notes: '',
  });
  const [phoneDigits, setPhoneDigits] = useState('');
  const [availableCities, setAvailableCities] = useState([]);

  // ============================================================
  // 4.1 Verificar autenticación y precargar email del usuario
  // ============================================================
  useEffect(() => {
    const access = localStorage.getItem('access');
    if (!access) {
      router.push('/login');
      return;
    }
    const userRaw = localStorage.getItem('user');
    if (userRaw) {
      try {
        const user = JSON.parse(userRaw);
        setForm((prev) => ({ ...prev, email: user.email || '' }));
      } catch (_) {}
    }
  }, [router]);

  // ============================================================
  // 4.2 REANUDAR PAGO (cargar orden pendiente y saltar al paso de pago)
  // ============================================================
  useEffect(() => {
    if (!resumeOrderId) return;
    const token = localStorage.getItem('access');
    if (!token) return;

    fetch(`${API_URL}/api/orders/${resumeOrderId}/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((orderData) => {
        if (orderData.status === 'pending') {
          // Precargar datos de dirección
          setForm({
            name: orderData.shipping_address.name || '',
            email: orderData.shipping_address.email || '',
            address: orderData.shipping_address.address || '',
            city: orderData.shipping_address.city || '',
            department: orderData.shipping_address.department || '',
            country: orderData.shipping_address.country || 'Colombia',
            notes: orderData.notes || '',
            customCity: '',
          });
          // Quitar prefijo +57 del teléfono si existe
          if (orderData.shipping_address.phone) {
            const phoneRaw = orderData.shipping_address.phone.replace('+57 ', '');
            setPhoneDigits(phoneRaw);
          }
          // Crear nuevo PaymentIntent para la orden existente y saltar a pago
          const createPayment = async () => {
            try {
              const paymentRes = await fetch(`${API_URL}/api/payments/create-payment-intent/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ order_id: orderData.id }),
              });
              if (!paymentRes.ok) throw new Error('Error al crear PaymentIntent');
              const { client_secret } = await paymentRes.json();
              setOrderId(orderData.id);
              setClientSecret(client_secret);
              setStep('payment');
            } catch (err) {
              setError('No se pudo iniciar el pago. Intenta de nuevo.');
            }
          };
          createPayment();
        } else {
          alert('Esta orden ya no está pendiente. No se puede reanudar.');
          router.push('/perfil');
        }
      })
      .catch((err) => {
        console.error('Error al reanudar orden:', err);
        setError('No se pudo cargar la orden pendiente.');
      });
  }, [resumeOrderId]);

  // ============================================================
  // 4.3 Actualizar ciudades según departamento seleccionado
  // ============================================================
  useEffect(() => {
    if (form.department && departamentosYCiudades[form.department]) {
      setAvailableCities(departamentosYCiudades[form.department]);
      if (form.city !== '__OTHER__' && !departamentosYCiudades[form.department].includes(form.city)) {
        setForm((prev) => ({ ...prev, city: '', customCity: '' }));
      }
    } else {
      setAvailableCities([]);
    }
  }, [form.department]);

  // ============================================================
  // 4.4 Manejadores de cambios en el formulario
  // ============================================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handlePhoneChange = (e) => {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, '');
    const limited = digits.slice(0, 10);
    setPhoneDigits(limited);
  };

  // ============================================================
  // 4.5 ENVÍO DEL FORMULARIO DE DIRECCIÓN + EVENTO begin_checkout
  // ============================================================
  const handleAddressSubmit = async () => {
    // Validaciones del formulario
    const ciudadValida = form.city === '__OTHER__' ? form.customCity.trim() !== '' : form.city !== '';
    if (!form.name || !form.email || !form.address || !ciudadValida || !form.department) {
      setError('Por favor completa todos los campos obligatorios.');
      return;
    }
    if (phoneDigits.trim() === '') {
      setError('El teléfono es obligatorio.');
      return;
    }
    if (items.length === 0) {
      setError('Tu carrito está vacío.');
      return;
    }
    const length = phoneDigits.length;
    const isMobile = length === 10 && phoneDigits[0] === '3';
    const isFixed = length === 7 && phoneDigits[0] !== '3';
    if (!isMobile && !isFixed) {
      setError('Ingresa un número colombiano válido: 10 dígitos para móvil (comienza en 3) o 7 dígitos para fijo.');
      return;
    }

    setLoading(true);
    setError(null);

    const fullPhone = `+57 ${phoneDigits}`;
    const shippingAddress = {
      email: form.email,
      name: form.name,
      phone: fullPhone,
      address: form.address,
      city: form.city === '__OTHER__' ? form.customCity : form.city,
      department: form.department,
      country: form.country,
    };

    // 📊 EVENTO: begin_checkout (inicio del proceso de pago)
    // Se registra justo antes de crear la orden, con el total del carrito y cantidad de ítems.
    trackEvent('begin_checkout', {
      metadata: {
        cart_total: total,
        item_count: items.length,
      },
    });

    // 1. Crear la orden (usando el store)
    const order = await createOrder(shippingAddress, form.notes);
    if (!order || order.error) {
      setError(order?.error || 'No se pudo crear la orden. Intenta de nuevo.');
      setLoading(false);
      return;
    }

    // 2. Obtener client_secret de Stripe
    try {
      const token = localStorage.getItem('access');
      const paymentRes = await fetch(`${API_URL}/api/payments/create-payment-intent/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ order_id: order.id }),
      });
      if (!paymentRes.ok) {
        const errData = await paymentRes.json();
        throw new Error(errData.error || 'Error al iniciar el pago');
      }
      const { client_secret } = await paymentRes.json();
      setOrderId(order.id);
      setClientSecret(client_secret);
      setStep('payment'); // Cambiar al paso de pago con Stripe
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // ============================================================
  // 4.6 Renderizado condicional: paso de pago (Stripe)
  // ============================================================
  if (step === 'payment' && clientSecret) {
    return (
      <div style={{ ...styles.page, display: 'block', padding: 0 }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: 'clamp(20px,5vw,40px)' }}>
          <h1 style={{ ...styles.heading2, textAlign: 'center' }}>Pagar con tarjeta</h1>
          <PaymentStep clientSecret={clientSecret} orderId={orderId} />
        </div>
      </div>
    );
  }

  // ============================================================
  // 4.7 Paso 1: Formulario de dirección de envío (diseño Glassmorphism)
  // ============================================================
  return (
    <div style={{ ...styles.page, display: 'block', padding: 0 }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: 'clamp(20px,5vw,40px) clamp(16px,4vw,20px)' }}>
        <h1 style={{ ...styles.heading2, fontSize: 'clamp(28px,6vw,36px)' }}>Checkout</h1>
        <p style={{ ...styles.body, marginBottom: 'clamp(30px,6vw,40px)' }}>
          Completa tus datos para finalizar el pedido
        </p>

        <div className="checkout-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 380px',
          gap: 'clamp(20px,4vw,40px)',
        }}>
          {/* COLUMNA IZQUIERDA: FORMULARIO (glassmorphism) */}
          <div style={{
            backgroundColor: 'rgba(26,26,26,0.4)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(184,134,11,0.15)',
            borderRadius: '24px',
            padding: 'clamp(20px,4vw,32px)',
          }}>
            <h2 style={{ fontSize: '20px', marginBottom: '24px', color: c.textMain, fontWeight: '700' }}>Datos de envío</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Nombre */}
              <div>
                <label style={{ display: 'block', color: c.textSub, fontSize: '13px', marginBottom: '6px' }}>Nombre completo *</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="Wilson Mejía" style={{
                  width: '100%', padding: '14px 16px', backgroundColor: 'rgba(38,38,38,0.6)', backdropFilter: 'blur(8px)',
                  border: `1px solid ${c.border}`, borderRadius: '14px', color: c.textMain, fontSize: '15px', boxSizing: 'border-box', outline: 'none'
                }} />
              </div>
              {/* Email (solo lectura) */}
              <div>
                <label style={{ display: 'block', color: c.textSub, fontSize: '13px', marginBottom: '6px' }}>Email *</label>
                <input name="email" type="email" value={form.email} readOnly style={{
                  width: '100%', padding: '14px 16px', backgroundColor: 'rgba(51,51,51,0.5)', backdropFilter: 'blur(8px)',
                  border: `1px solid ${c.border}`, borderRadius: '14px', color: c.textWeak, fontSize: '15px', cursor: 'not-allowed'
                }} />
                <p style={{ fontSize: '11px', color: c.textWeak, marginTop: '4px' }}>El correo asociado a tu cuenta no se puede modificar.</p>
              </div>
              {/* Teléfono con prefijo +57 */}
              <div>
                <label style={{ display: 'block', color: c.textSub, fontSize: '13px', marginBottom: '6px' }}>Teléfono *</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: '16px', color: c.textSub, pointerEvents: 'none', zIndex: 1 }}>+57</span>
                  <input type="tel" inputMode="numeric" value={phoneDigits} onChange={handlePhoneChange} placeholder="300 123 4567" style={{
                    width: '100%', padding: '14px 16px 14px 52px', backgroundColor: 'rgba(38,38,38,0.6)', backdropFilter: 'blur(8px)',
                    border: `1px solid ${c.border}`, borderRadius: '14px', color: c.textMain, fontSize: '15px', boxSizing: 'border-box', outline: 'none'
                  }} />
                </div>
                <p style={{ fontSize: '11px', color: c.textWeak, marginTop: '4px' }}>Móvil: 10 dígitos comenzando en 3 · Fijo: 7 dígitos</p>
              </div>
              {/* Dirección */}
              <div>
                <label style={{ display: 'block', color: c.textSub, fontSize: '13px', marginBottom: '6px' }}>Dirección *</label>
                <input name="address" value={form.address} onChange={handleChange} placeholder="Calle 123 # 45-67, Apto 8" style={{
                  width: '100%', padding: '14px 16px', backgroundColor: 'rgba(38,38,38,0.6)', backdropFilter: 'blur(8px)',
                  border: `1px solid ${c.border}`, borderRadius: '14px', color: c.textMain, fontSize: '15px', boxSizing: 'border-box', outline: 'none'
                }} />
              </div>
              {/* Departamento */}
              <div>
                <label style={{ display: 'block', color: c.textSub, fontSize: '13px', marginBottom: '6px' }}>Departamento *</label>
                <select name="department" value={form.department} onChange={handleChange} style={{
                  width: '100%', padding: '14px 16px', backgroundColor: 'rgba(38,38,38,0.6)', backdropFilter: 'blur(8px)',
                  border: `1px solid ${c.border}`, borderRadius: '14px', color: c.textMain, fontSize: '15px', outline: 'none'
                }}>
                  <option value="">Selecciona un departamento</option>
                  {departamentos.map(depto => <option key={depto} value={depto}>{depto}</option>)}
                </select>
              </div>
              {/* Ciudad */}
              <div>
                <label style={{ display: 'block', color: c.textSub, fontSize: '13px', marginBottom: '6px' }}>Ciudad *</label>
                <select name="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value, customCity: '' })} style={{
                  width: '100%', padding: '14px 16px', backgroundColor: 'rgba(38,38,38,0.6)', backdropFilter: 'blur(8px)',
                  border: `1px solid ${c.border}`, borderRadius: '14px', color: c.textMain, fontSize: '15px', outline: 'none'
                }} disabled={!form.department}>
                  <option value="">Selecciona una ciudad</option>
                  {availableCities.map(ciudad => <option key={ciudad} value={ciudad}>{ciudad}</option>)}
                  <option value="__OTHER__">Otro municipio (especificar)</option>
                </select>
              </div>
              {form.city === '__OTHER__' && (
                <div>
                  <label style={{ display: 'block', color: c.textSub, fontSize: '13px', marginBottom: '6px' }}>Especifica el municipio *</label>
                  <input name="customCity" value={form.customCity} onChange={handleChange} placeholder="Ej: San Vicente de Chucurí" style={{
                    width: '100%', padding: '14px 16px', backgroundColor: 'rgba(38,38,38,0.6)', backdropFilter: 'blur(8px)',
                    border: `1px solid ${c.border}`, borderRadius: '14px', color: c.textMain, fontSize: '15px', outline: 'none'
                  }} />
                </div>
              )}
              {/* País */}
              <div>
                <label style={{ display: 'block', color: c.textSub, fontSize: '13px', marginBottom: '6px' }}>País</label>
                <input name="country" value={form.country} readOnly style={{
                  width: '100%', padding: '14px 16px', backgroundColor: 'rgba(51,51,51,0.5)', cursor: 'not-allowed',
                  border: `1px solid ${c.border}`, borderRadius: '14px', color: c.textWeak, fontSize: '15px'
                }} />
              </div>
              {/* Notas opcionales */}
              <div>
                <label style={{ display: 'block', color: c.textSub, fontSize: '13px', marginBottom: '6px' }}>Notas del pedido (opcional)</label>
                <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Instrucciones especiales de entrega..." rows={3} style={{
                  width: '100%', padding: '14px 16px', backgroundColor: 'rgba(38,38,38,0.6)', backdropFilter: 'blur(8px)',
                  border: `1px solid ${c.border}`, borderRadius: '14px', color: c.textMain, fontSize: '15px', resize: 'vertical', outline: 'none'
                }} />
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: RESUMEN DEL PEDIDO */}
          <div style={{
            backgroundColor: 'rgba(26,26,26,0.4)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(184,134,11,0.2)',
            borderRadius: '24px',
            padding: 'clamp(20px,4vw,28px)',
            position: 'sticky',
            top: '20px',
          }}>
            <h2 style={{ fontSize: '20px', marginBottom: '20px', fontWeight: '700' }}>Tu pedido</h2>
            <div style={{ marginBottom: '20px' }}>
              {items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${c.border}` }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>{item.product_name}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: c.textSub }}>{item.selected_size} · {item.selected_color} · x{item.quantity}</p>
                  </div>
                  <p style={{ margin: 0, color: c.primary, fontWeight: 'bold', fontSize: '14px' }}>${(item.price_at_time * item.quantity).toLocaleString()}</p>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: c.textSub, fontSize: '14px' }}><span>Subtotal</span><span>${total?.toLocaleString()}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: c.textSub, fontSize: '14px' }}><span>Impuestos</span><span>$0</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: c.textSub, fontSize: '14px' }}><span>Envío</span><span>Gratis</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '18px', color: c.primary, borderTop: `1px solid ${c.border}`, paddingTop: '12px', marginTop: '4px' }}><span>TOTAL</span><span>${total?.toLocaleString()}</span></div>
            </div>
            {error && <div style={{ ...styles.error, marginBottom: '16px' }}>{error}</div>}
            <button onClick={handleAddressSubmit} disabled={loading} style={styles.button(loading)}>
              {loading ? 'Procesando...' : 'Continuar al pago'}
            </button>
            <button onClick={() => router.push('/carrito')} style={mergeStyles(styles.buttonSecondary(), { marginTop: '10px' })}>
              ← Volver al carrito
            </button>
          </div>
        </div>
      </div>

      {/* Estilo responsivo */}
      <style jsx>{`
        @media (max-width: 768px) {
          .checkout-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
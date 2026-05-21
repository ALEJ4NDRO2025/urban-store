'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useCartStore } from '../lib/cartStore';
import { c, styles, mergeStyles } from '../lib/styles';
import { departamentos, departamentosYCiudades } from '../lib/colombiaData';
import CheckoutForm from './CheckoutForm';
import { trackEvent, trackError } from '../lib/analytics';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

const stripeAppearance = {
  theme: 'night',
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

function PaymentStep({ clientSecret, orderId }) {
  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance: stripeAppearance }}>
      <CheckoutForm clientSecret={clientSecret} orderId={orderId} />
    </Elements>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumeOrderId = searchParams.get('resume_order');

  const { items, createOrder } = useCartStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('address');
  const [orderId, setOrderId] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);

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

  const realTotal = items.reduce((sum, item) => {
    const price = parseFloat(item.price_at_time) || 0;
    return sum + price * item.quantity;
  }, 0);

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
    if (items.length > 0) {
      trackEvent('begin_checkout', {
        metadata: { item_count: items.length, cart_total: realTotal },
      });
    }
  }, []);

  // Reanudación de pago (sin cambios)
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
          if (orderData.shipping_address.phone) {
            const phoneRaw = orderData.shipping_address.phone.replace('+57 ', '');
            setPhoneDigits(phoneRaw);
          }
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handlePhoneChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhoneDigits(digits);
  };

  const handleAddressSubmit = async () => {
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
    const isMobile = (length === 10 && phoneDigits[0] === '3');
    const isFixed = (length === 7 && phoneDigits[0] !== '3');
    if (!isMobile && !isFixed) {
      setError('Ingresa un número colombiano válido: 10 dígitos para móvil (empieza en 3) o 7 dígitos para fijo.');
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

    trackEvent('checkout_started', {
      metadata: { cart_total: realTotal, item_count: items.length },
    });

    const order = await createOrder(shippingAddress, form.notes);
    if (!order || order.error) {
      trackError('checkout_error', order?.error || 'No se pudo crear la orden', {
        address: shippingAddress,
        cart_items: items.length,
      });
      setError(order?.error || 'No se pudo crear la orden. Intenta de nuevo.');
      setLoading(false);
      return;
    }

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
      setStep('payment');
    } catch (err) {
      trackError('payment_intent_error', err.message, { order_id: order.id });
      setError(err.message);
      setLoading(false);
    }
  };

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

  // Estilos del tema oscuro
  const glassCard = {
    background: 'rgba(26, 26, 26, 0.5)',
    backdropFilter: 'blur(16px)',
    borderRadius: '28px',
    border: '1px solid rgba(184, 134, 11, 0.15)',
    padding: 'clamp(24px, 4vw, 40px)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
  };

  const inputStyle = (isError = false) => ({
    width: '100%',
    padding: '14px 16px',
    backgroundColor: 'rgba(38, 38, 38, 0.6)',
    backdropFilter: 'blur(8px)',
    border: `1px solid ${isError ? c.error : c.border}`,
    borderRadius: '14px',
    color: c.textMain,
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    transition: 'border-color 0.3s, box-shadow 0.3s',
  });

  const labelStyle = {
    display: 'block',
    color: c.textSub,
    fontSize: '13px',
    marginBottom: '8px',
    fontWeight: '500',
  };

  return (
    <div style={{
      background: 'radial-gradient(circle at 30% 20%, #1a1a1a, #0D0D0D 80%)',
      minHeight: '100vh',
      color: c.textMain,
      padding: 'clamp(20px, 5vw, 48px) 24px',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{
            fontSize: 'clamp(32px, 7vw, 48px)',
            fontWeight: '900',
            marginBottom: '12px',
            background: `linear-gradient(135deg, #FFFFFF 0%, ${c.primary} 40%, #FFD700 100%)`,
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'gradientShift 6s ease infinite',
            letterSpacing: '1px',
          }}>
            Checkout
          </h1>
          <p style={{ ...styles.body, fontSize: '16px', color: c.textSub }}>
            Completa tus datos para finalizar el pedido
          </p>
        </div>

        <div className="checkout-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 400px',
          gap: 'clamp(24px, 5vw, 48px)',
          alignItems: 'start',
        }}>
          {/* Formulario */}
          <div style={glassCard}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '800',
              marginBottom: '32px',
              color: c.textMain,
            }}>
              Datos de envío
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={labelStyle}>Nombre completo *</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="Wilson Mejía" style={inputStyle()} />
              </div>
              <div>
                <label style={labelStyle}>Email *</label>
                <input name="email" type="email" value={form.email} readOnly style={{ ...inputStyle(), backgroundColor: 'rgba(51,51,51,0.5)', cursor: 'not-allowed', color: c.textWeak }} />
                <p style={{ fontSize: '11px', color: c.textWeak, marginTop: '4px' }}>El correo asociado a tu cuenta no se puede modificar.</p>
              </div>
              <div>
                <label style={labelStyle}>Teléfono *</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: '16px', color: c.textSub, pointerEvents: 'none', zIndex: 1 }}>+57</span>
                  <input type="tel" inputMode="numeric" value={phoneDigits} onChange={handlePhoneChange} placeholder="300 123 4567" style={{ ...inputStyle(), paddingLeft: '52px' }} />
                </div>
                <p style={{ fontSize: '11px', color: c.textWeak, marginTop: '4px' }}>Móvil: 10 dígitos comenzando en 3 · Fijo: 7 dígitos</p>
              </div>
              <div>
                <label style={labelStyle}>Dirección *</label>
                <input name="address" value={form.address} onChange={handleChange} placeholder="Calle 123 # 45-67, Apto 8" style={inputStyle()} />
              </div>
              <div>
                <label style={labelStyle}>Departamento *</label>
                <select name="department" value={form.department} onChange={handleChange} style={{ ...inputStyle(), cursor: 'pointer' }}>
                  <option value="">Selecciona un departamento</option>
                  {departamentos.map(depto => <option key={depto} value={depto}>{depto}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Ciudad *</label>
                <select name="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value, customCity: '' })} style={{ ...inputStyle(), cursor: 'pointer' }} disabled={!form.department}>
                  <option value="">Selecciona una ciudad</option>
                  {availableCities.map(ciudad => <option key={ciudad} value={ciudad}>{ciudad}</option>)}
                  <option value="__OTHER__">Otro municipio (especificar)</option>
                </select>
              </div>
              {form.city === '__OTHER__' && (
                <div>
                  <label style={labelStyle}>Especifica el municipio *</label>
                  <input name="customCity" value={form.customCity} onChange={handleChange} placeholder="Ej: San Vicente de Chucurí" style={inputStyle()} />
                </div>
              )}
              <div>
                <label style={labelStyle}>País</label>
                <input name="country" value={form.country} readOnly style={{ ...inputStyle(), backgroundColor: 'rgba(51,51,51,0.5)', cursor: 'not-allowed', color: c.textWeak }} />
              </div>
              <div>
                <label style={labelStyle}>Notas del pedido (opcional)</label>
                <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Instrucciones especiales..." rows={3} style={{ ...inputStyle(), resize: 'vertical', minHeight: '100px' }} />
              </div>
            </div>
          </div>

          {/* Resumen del pedido */}
          <div style={{
            ...glassCard,
            position: 'sticky',
            top: 'calc(clamp(80px, 12vw, 100px) + 20px)',
            border: '1px solid rgba(184, 134, 11, 0.25)',
            boxShadow: '0 12px 28px rgba(0,0,0,0.4)',
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '800',
              marginBottom: '24px',
              color: c.textMain,
            }}>
              Tu pedido
            </h2>

            <div style={{ marginBottom: '24px', maxHeight: '400px', overflowY: 'auto' }}>
              {items.map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: `1px solid ${c.border}`,
                  gap: '12px',
                }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '15px', fontWeight: '600', color: c.textMain, margin: '0 0 4px' }}>{item.product_name}</p>
                    <p style={{ fontSize: '13px', color: c.textSub, margin: 0 }}>
                      {item.selected_size} · {item.selected_color} · <strong>x{item.quantity}</strong>
                    </p>
                  </div>
                  <p style={{
                    fontSize: '15px',
                    fontWeight: '700',
                    color: c.primary,
                    margin: 0,
                    whiteSpace: 'nowrap',
                  }}>
                    ${(Number(item.price_at_time) * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: c.textSub, fontSize: '14px' }}>
                <span>Subtotal</span>
                <span>${realTotal.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: c.textSub, fontSize: '14px' }}>
                <span>Impuestos</span>
                <span>$0</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: c.textSub, fontSize: '14px' }}>
                <span>Envío</span>
                <span style={{ color: c.success }}>Gratis</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 'bold',
                fontSize: '18px',
                marginTop: '8px',
                borderTop: `1px solid ${c.border}`,
                paddingTop: '16px',
              }}>
                <span style={{ color: c.textMain }}>TOTAL</span>
                <span style={{
                  background: `linear-gradient(135deg, ${c.primary} 0%, #D4A017 50%, #FFD700 100%)`,
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  ${realTotal.toLocaleString()}
                </span>
              </div>
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

      <style jsx>{`
        @media (max-width: 768px) {
          .checkout-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}
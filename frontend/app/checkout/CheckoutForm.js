'use client';

import { useState, useEffect } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useRouter } from 'next/navigation';
import { c } from '../lib/styles';
import { trackEvent, trackError } from '../lib/analytics';

export default function CheckoutForm({ clientSecret, orderId }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentInfoCompleted, setPaymentInfoCompleted] = useState(false);

  // ============================================================
  // Detectar cuando el usuario completa los datos de pago (por primera vez)
  // ============================================================
  useEffect(() => {
    if (!elements || paymentInfoCompleted) return;
    const paymentElement = elements.getElement('payment');
    if (!paymentElement) return;

    const onChange = (event) => {
      if (event.complete && !event.empty && !paymentInfoCompleted) {
        setPaymentInfoCompleted(true);
        // 📊 EVENTO: Usuario ingresó correctamente los datos de tarjeta
        trackEvent('payment_info_entered', { order_id: orderId });
      }
    };
    paymentElement.on('change', onChange);
    return () => paymentElement.off('change', onChange);
  }, [elements, orderId, paymentInfoCompleted]);

  // ============================================================
  // Manejar el envío del pago a Stripe
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success?order_id=${orderId}`,
        },
      });

      if (error) {
        // 📊 EVENTO: Error de pago (tarjeta rechazada, CVV inválido, etc.)
        trackError('payment_error', error.message, { order_id: orderId });
        setErrorMessage(error.message);
        setIsLoading(false);
      }
      // Si no hay error, Stripe redirige automáticamente a return_url
    } catch (err) {
      // 📊 EVENTO: Error inesperado en la comunicación con Stripe
      trackError('payment_error', err.message, { order_id: orderId });
      setErrorMessage('Error inesperado. Intenta de nuevo.');
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // 📊 EVENTO: Usuario canceló el pago voluntariamente
    trackEvent('payment_cancelled', { order_id: orderId });
    router.push(`/payment/cancel?order_id=${orderId}`);
  };

  return (
    <form onSubmit={handleSubmit} style={{
      background: 'rgba(26,26,26,0.7)',
      backdropFilter: 'blur(12px)',
      borderRadius: '28px',
      padding: '32px',
      border: '1px solid rgba(184,134,11,0.2)',
    }}>
      <PaymentElement />
      {errorMessage && <div style={{ color: '#ef4444', marginTop: '16px' }}>{errorMessage}</div>}
      <button
        type="submit"
        disabled={!stripe || isLoading}
        style={{
          marginTop: '24px',
          width: '100%',
          padding: '16px',
          background: `linear-gradient(135deg, #B8860B, #D4A017)`,
          color: '#000',
          fontWeight: 'bold',
          border: 'none',
          borderRadius: '40px',
          fontSize: '18px',
          cursor: 'pointer',
        }}
      >
        {isLoading ? 'Procesando pago...' : 'Pagar ahora'}
      </button>

      <button
        type="button"
        onClick={handleCancel}
        style={{
          marginTop: '12px',
          width: '100%',
          padding: '12px',
          background: 'transparent',
          border: `1px solid ${c.border}`,
          borderRadius: '40px',
          color: c.textSub,
          fontSize: '14px',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(184,134,11,0.1)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        Cancelar pago y volver al checkout
      </button>
    </form>
  );
}
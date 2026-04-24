'use client';

import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useRouter } from 'next/navigation';
import { c } from '../lib/styles';

export default function CheckoutForm({ clientSecret, orderId }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setIsLoading(true);
    setErrorMessage('');
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment/success?order_id=${orderId}`,
      },
    });
    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Opcional: llamar a una API para marcar la orden como "cancelled"
    // fetch(`${API_URL}/api/orders/${orderId}/cancel/`, { method: 'PATCH', ... })
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
      <button type="submit" disabled={!stripe || isLoading} style={{
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
      }}>
        {isLoading ? 'Procesando pago...' : 'Pagar ahora'}
      </button>
      
      {/* Botón de cancelar */}
      <button type="button" onClick={handleCancel} style={{
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
      }}>
        Cancelar pago y volver al checkout
      </button>
    </form>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { c, styles } from '../../lib/styles';
import { trackEvent } from '../../lib/analytics';

export default function PaymentCancelContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('order_id');
  const [countdown, setCountdown] = useState(10);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (orderId) {
      trackEvent('payment_cancelled', { order_id: orderId });
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setRedirecting(true);
          router.push('/checkout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [orderId, router]);

  const handleManualRedirect = () => {
    if (!redirecting) {
      setRedirecting(true);
      router.push('/checkout');
    }
  };

  return (
    <div style={styles.pageSection}>
      <div style={{
        maxWidth: '550px',
        margin: '0 auto',
        background: 'rgba(26, 26, 26, 0.6)',
        backdropFilter: 'blur(16px)',
        borderRadius: '40px',
        border: `1px solid ${c.primary}`,
        padding: '48px 32px',
        textAlign: 'center',
        animation: 'fadeInUp 0.6s ease-out',
      }}>
        <div style={{ fontSize: '80px', marginBottom: '20px' }}>❌</div>
        <h1 style={{
          ...styles.heading1,
          background: `linear-gradient(135deg, #FFFFFF, ${c.primary})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '16px',
        }}>Pago cancelado</h1>
        <p style={{ ...styles.body, color: c.textSub, marginBottom: '24px' }}>
          No se ha realizado ningún cobro. Puedes reintentar el pago cuando quieras.
        </p>
        <div style={{
          background: 'rgba(184, 134, 11, 0.15)',
          borderRadius: '60px',
          padding: '12px 24px',
          display: 'inline-block',
          marginBottom: '32px',
        }}>
          <span style={{ color: c.primary, fontWeight: 'bold' }}>Volviendo en {countdown} segundos</span>
        </div>
        <div>
          <button onClick={handleManualRedirect} style={styles.buttonPrimary}>
            Volver al checkout
          </button>
        </div>
      </div>
      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
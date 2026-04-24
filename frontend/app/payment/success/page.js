'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { c, styles } from '../../lib/styles';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function PaymentSuccess() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('order_id');
  const paymentIntentId = searchParams.get('payment_intent');
  const [status, setStatus] = useState('verifying');
  const [countdown, setCountdown] = useState(10);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!orderId || !paymentIntentId) {
      setStatus('error');
      return;
    }

    const confirmPayment = async () => {
      const token = localStorage.getItem('access');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/payments/confirm-payment/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ order_id: orderId, payment_intent_id: paymentIntentId }),
        });

        if (res.ok) {
          setStatus('success');
          const timer = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(timer);
                setRedirecting(true);
                router.push(`/order-confirmation/${orderId}`);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
          return () => clearInterval(timer);
        } else {
          setStatus('failed');
        }
      } catch (err) {
        console.error(err);
        setStatus('failed');
      }
    };

    confirmPayment();
  }, [orderId, paymentIntentId, router]);

  const handleManualRedirect = () => {
    if (!redirecting) {
      setRedirecting(true);
      router.push(`/order-confirmation/${orderId}`);
    }
  };

  // Botón premium reutilizable
  const PremiumButton = ({ onClick, children, variant = 'primary' }) => {
    const isPrimary = variant === 'primary';
    return (
      <button
        onClick={onClick}
        style={{
          background: isPrimary 
            ? `linear-gradient(135deg, ${c.primary}, #D4A017)`
            : 'rgba(255,255,255,0.05)',
          border: isPrimary ? 'none' : `1px solid ${c.border}`,
          color: isPrimary ? '#000' : c.textMain,
          padding: '14px 32px',
          borderRadius: '40px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1)',
          backdropFilter: 'blur(8px)',
          letterSpacing: '0.5px',
        }}
        onMouseEnter={(e) => {
          if (isPrimary) {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = `0 8px 20px rgba(184,134,11,0.4)`;
          } else {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            e.currentTarget.style.borderColor = c.primary;
          }
        }}
        onMouseLeave={(e) => {
          if (isPrimary) {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          } else {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            e.currentTarget.style.borderColor = c.border;
          }
        }}
      >
        {children}
      </button>
    );
  };

  if (status === 'verifying') {
    return (
      <div style={styles.pageSection}>
        <div style={{ textAlign: 'center', maxWidth: '500px', margin: '0 auto', padding: '60px 20px' }}>
          <div className="spinner" style={{
            width: '60px',
            height: '60px',
            border: `3px solid ${c.border}`,
            borderTop: `3px solid ${c.primary}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 24px',
          }} />
          <h2 style={{ color: c.textMain }}>Verificando tu pago...</h2>
          <p style={{ color: c.textSub }}>Esto tomará solo unos segundos.</p>
        </div>
        <style jsx>{` @keyframes spin { to { transform: rotate(360deg); } } `}</style>
      </div>
    );
  }

  if (status === 'success') {
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
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          animation: 'fadeInUp 0.6s ease-out',
        }}>
          <div style={{ fontSize: '80px', marginBottom: '20px' }}>✅</div>
          <h1 style={{
            ...styles.heading1,
            background: `linear-gradient(135deg, #FFFFFF, ${c.primary})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '16px',
          }}>¡Pago exitoso!</h1>
          <p style={{ ...styles.body, color: c.textSub, marginBottom: '24px' }}>
            Tu pedido <strong style={{ color: c.primary }}>#{orderId}</strong> ha sido confirmado.
          </p>
          <div style={{
            background: 'rgba(184, 134, 11, 0.15)',
            borderRadius: '60px',
            padding: '12px 24px',
            display: 'inline-block',
            marginBottom: '32px',
          }}>
            <span style={{ color: c.primary, fontWeight: 'bold' }}>Redirigiendo en {countdown} segundos</span>
          </div>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <PremiumButton onClick={handleManualRedirect} variant="primary">
              Ver mi pedido ahora
            </PremiumButton>
            <PremiumButton onClick={() => router.push('/')} variant="secondary">
              Volver al inicio
            </PremiumButton>
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

  return (
    <div style={styles.pageSection}>
      <div style={{
        maxWidth: '550px',
        margin: '0 auto',
        background: 'rgba(26, 26, 26, 0.6)',
        backdropFilter: 'blur(16px)',
        borderRadius: '40px',
        border: `1px solid #ef4444`,
        padding: '48px 32px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '80px', marginBottom: '20px' }}>⚠️</div>
        <h1 style={styles.heading1}>Error al verificar el pago</h1>
        <p style={styles.body}>No pudimos confirmar tu pago automáticamente. Por favor, contacta a soporte con el número de tu pedido.</p>
        <PremiumButton onClick={() => router.push(`/order-confirmation/${orderId}`)} variant="primary">
          Ver estado del pedido
        </PremiumButton>
      </div>
    </div>
  );
}
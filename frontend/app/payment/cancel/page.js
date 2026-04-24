'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { c, styles } from '../../lib/styles';

export default function PaymentCancel() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
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
  }, [router]);

  const handleManualRedirect = () => {
    if (!redirecting) {
      setRedirecting(true);
      router.push('/checkout');
    }
  };

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
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <PremiumButton onClick={handleManualRedirect} variant="primary">
            Volver al checkout
          </PremiumButton>
          <PremiumButton onClick={() => router.push('/')} variant="secondary">
            Ir al inicio
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
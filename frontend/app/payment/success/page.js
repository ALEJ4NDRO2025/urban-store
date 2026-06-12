// app/payment/success/page.js
import { Suspense } from 'react';
import PaymentSuccessContent from './PaymentSuccessContent';

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'white' }}>
          <div
            style={{
              width: 60,
              height: 60,
              border: '3px solid #333',
              borderTop: '3px solid gold',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 24px',
            }}
          />
          <p>Cargando confirmación...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
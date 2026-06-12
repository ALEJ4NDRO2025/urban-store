import { Suspense } from 'react';
import PaymentCancelContent from './PaymentCancelContent';

export default function PaymentCancelPage() {
  return (
    <Suspense fallback={<div style={{ color: 'white', textAlign: 'center', padding: '40px' }}>Procesando cancelación...</div>}>
      <PaymentCancelContent />
    </Suspense>
  );
}
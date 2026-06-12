// app/verify-email/page.js
import { Suspense } from 'react';
import VerifyEmailForm from './VerifyEmailForm';

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div style={{ color: 'white', textAlign: 'center', padding: '40px' }}>Cargando...</div>}>
      <VerifyEmailForm />
    </Suspense>
  );
}
// frontend/app/forgot-password/page.js
import { Suspense } from 'react';
import ForgotPasswordForm from './ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div style={{ color: 'white', textAlign: 'center', padding: '40px' }}>Cargando...</div>}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
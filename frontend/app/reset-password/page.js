// app/reset-password/page.js
import { Suspense } from 'react';
import ResetPasswordForm from './ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ color: 'white', textAlign: 'center', padding: '40px' }}>Cargando...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
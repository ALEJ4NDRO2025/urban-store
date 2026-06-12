// app/verify-email/VerifyEmailForm.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_URL } from '../lib/api';
import { c } from '../lib/styles';

export default function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const emailFromUrl = searchParams.get('email') || '';
  const [email, setEmail] = useState(emailFromUrl);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!email || !code) {
      setError('Todos los campos son obligatorios');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/users/verify-code/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/login'), 3000);
      } else {
        setError(data.error || 'Error al verificar');
        setCode('');
      }
    } catch (err) {
      setError('Error conectando con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/users/resend-verification/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        setResendCooldown(120);
        alert('Nuevo código enviado a tu correo');
      } else {
        setError(data.error || 'Error al reenviar');
      }
    } catch (err) {
      setError('Error de conexión al reenviar');
    }
  };

  return (
    <div style={{
      backgroundColor: c.bg,
      minHeight: '100vh',
      color: c.textMain,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        backgroundColor: c.card,
        padding: '40px',
        borderRadius: '12px',
        maxWidth: '400px',
        width: '90%',
      }}>
        <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>Verificar cuenta</h2>

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: c.success }}>✅ ¡Cuenta verificada!</p>
            <p style={{ color: c.textSub }}>Redirigiendo al login...</p>
          </div>
        ) : (
          <form onSubmit={handleVerify}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', color: c.textSub }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                readOnly
                disabled
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: c.input,
                  border: `1px solid ${c.border}`,
                  borderRadius: '6px',
                  color: c.textWeak,
                  cursor: 'not-allowed',
                }}
              />
              <p style={{ fontSize: '12px', color: c.textWeak, marginTop: '4px' }}>
                Este es el correo que registraste. No se puede modificar.
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '6px', color: c.textSub }}>
                Código de verificación
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: c.input,
                  border: `1px solid ${c.border}`,
                  borderRadius: '6px',
                  color: c.textMain,
                  textAlign: 'center',
                  fontSize: '24px',
                  letterSpacing: '8px',
                }}
              />
            </div>

            {error && (
              <p style={{ color: c.error, marginBottom: '16px' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: c.primary,
                color: '#000',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Verificando...' : 'Verificar cuenta'}
            </button>

            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0}
                style={{
                  background: 'none',
                  border: 'none',
                  color: resendCooldown > 0 ? c.textWeak : c.primary,
                  cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                }}
              >
                {resendCooldown > 0
                  ? `Reenviar en ${resendCooldown}s`
                  : 'Reenviar código'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
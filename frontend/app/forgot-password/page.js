'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { API_URL } from '../lib/api'
import { c } from '../lib/styles'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // ═════════════════════════════════════════════════════════════════════════
  // Obtener email de la URL (si viene del login)
  // ═════════════════════════════════════════════════════════════════════════
  const emailFromUrl = searchParams.get('email') || ''
  const [email, setEmail] = useState(emailFromUrl)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // ═════════════════════════════════════════════════════════════════════════
  // Enviar solicitud de código de reseteo
  // ═════════════════════════════════════════════════════════════════════════
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) {
      setError('El email es requerido')
      return
    }
    setLoading(true)
    setError('')

    const res = await fetch(`${API_URL}/api/users/request-password-reset/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    setLoading(false)

    if (res.ok) {
      setSuccess(true)
      // Redirigir a reset-password con el email
      setTimeout(() => {
        router.push(`/reset-password?email=${encodeURIComponent(email)}`)
      }, 3000)
    } else {
      setError(data.error || 'Error al enviar el código')
    }
  }

  return (
    <div style={{ backgroundColor: c.bg, minHeight: '100vh', color: c.textMain, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: c.card, padding: '40px', borderRadius: '12px', maxWidth: '400px', width: '90%' }}>
        <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>Recuperar contraseña</h2>

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: c.success }}>📧 Código enviado</p>
            <p style={{ color: c.textSub }}>Redirigiendo...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', color: c.textSub }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                readOnly={!!emailFromUrl}     // ⬅️ Solo lectura si vino de otra página
                disabled={!!emailFromUrl}     // ⬅️ Apariencia deshabilitada
                required
                placeholder="tu@email.com"
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: c.input,
                  border: `1px solid ${c.border}`,
                  borderRadius: '6px',
                  color: emailFromUrl ? c.textWeak : c.textMain,
                  cursor: emailFromUrl ? 'not-allowed' : 'text',
                }}
              />
              {emailFromUrl && (
                <p style={{ fontSize: '12px', color: c.textWeak, marginTop: '4px' }}>
                  Email asociado a tu cuenta. No se puede modificar.
                </p>
              )}
            </div>
            {error && <p style={{ color: c.error, marginBottom: '16px' }}>{error}</p>}
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '14px', backgroundColor: c.primary, color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {loading ? 'Enviando...' : 'Enviar código'}
            </button>
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => router.push('/login')}
                style={{ background: 'none', border: 'none', color: c.primary, cursor: 'pointer', fontSize: '14px' }}
              >
                ← Volver al login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
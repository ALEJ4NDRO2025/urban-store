'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { API_URL } from '../lib/api'
import { c } from '../lib/styles'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const emailFromUrl = searchParams.get('email') || ''

  const [email, setEmail] = useState(emailFromUrl)
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !code || !newPassword) {
      setError('Todos los campos son obligatorios')
      return
    }
    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setLoading(true)
    setError('')

    const res = await fetch(`${API_URL}/api/users/confirm-password-reset/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, new_password: newPassword }),
    })
    const data = await res.json()
    setLoading(false)

    if (res.ok) {
      setSuccess(true)
      setTimeout(() => router.push('/login'), 3000)
    } else {
      setError(data.error || 'Error al restablecer')
    }
  }

  return (
    <div style={{ backgroundColor: c.bg, minHeight: '100vh', color: c.textMain, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: c.card, padding: '40px', borderRadius: '12px', maxWidth: '400px', width: '90%' }}>
        <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>Nueva contraseña</h2>

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: c.success }}>✅ ¡Contraseña actualizada!</p>
            <p style={{ color: c.textSub }}>Redirigiendo al login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Email (solo lectura si viene de forgot-password) */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', color: c.textSub }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                readOnly={!!emailFromUrl}
                disabled={!!emailFromUrl}
                required
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
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', color: c.textSub }}>Código de reseteo</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
                required
                style={{ width: '100%', padding: '12px', backgroundColor: c.input, border: `1px solid ${c.border}`, borderRadius: '6px', color: c.textMain, textAlign: 'center', fontSize: '20px', letterSpacing: '6px' }}
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '6px', color: c.textSub }}>Nueva contraseña</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                style={{ width: '100%', padding: '12px', backgroundColor: c.input, border: `1px solid ${c.border}`, borderRadius: '6px', color: c.textMain }}
              />
            </div>
            {error && <p style={{ color: c.error, marginBottom: '16px' }}>{error}</p>}
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '14px', backgroundColor: c.primary, color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {loading ? 'Actualizando...' : 'Actualizar contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
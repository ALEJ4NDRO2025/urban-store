'use client'   // ⬅️ Obligatorio en Next.js 14 para usar hooks (useState, useEffect, etc.)

// ═══════════════════════════════════════════════════════════════════════════
// IMPORTACIONES
// ═══════════════════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { API_URL } from '../lib/api'      // URL del backend (http://localhost:8000)
import { c } from '../lib/styles'         // Colores y estilos del design system

export default function VerifyEmailPage() {
  // ═════════════════════════════════════════════════════════════════════════
  // HOOKS DE NEXT.JS
  // ═════════════════════════════════════════════════════════════════════════
  const router = useRouter()                    // Para redirigir a otras páginas
  const searchParams = useSearchParams()        // Para leer parámetros de la URL (?email=...)

  // ═════════════════════════════════════════════════════════════════════════
  // ESTADOS LOCALES (useState)
  // ═════════════════════════════════════════════════════════════════════════
  const emailFromUrl = searchParams.get('email') || ''  // Extrae el email de la URL
  const [email, setEmail] = useState(emailFromUrl)      // Email (solo lectura)
  const [code, setCode] = useState('')                  // Código de 6 dígitos ingresado
  const [loading, setLoading] = useState(false)         // ¿Está enviando la petición?
  const [error, setError] = useState('')                // Mensaje de error
  const [success, setSuccess] = useState(false)         // ¿Verificación exitosa?
  const [resendCooldown, setResendCooldown] = useState(0) // Segundos restantes para reenviar

  // ═════════════════════════════════════════════════════════════════════════
  // TEMPORIZADOR PARA EL BOTÓN "REENVIAR CÓDIGO"
  // ═════════════════════════════════════════════════════════════════════════
  // Cada vez que resendCooldown > 0, se ejecuta un setTimeout que lo reduce en 1
  // cada segundo, hasta llegar a 0. Así el botón se deshabilita durante 120 seg.
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)   // Limpieza del timer al desmontar o cambiar
    }
  }, [resendCooldown])

  // ═════════════════════════════════════════════════════════════════════════
  // FUNCIÓN PARA VERIFICAR EL CÓDIGO INGRESADO
  // ═════════════════════════════════════════════════════════════════════════
  const handleVerify = async (e) => {
    e.preventDefault()                  // Evita que el formulario recargue la página
    if (!email || !code) {
      setError('Todos los campos son obligatorios')
      return
    }
    setLoading(true)                    // Deshabilita el botón mientras se procesa
    setError('')                        // Limpia errores anteriores

    // Llamada al backend: POST /api/users/verify-code/
    const res = await fetch(`${API_URL}/api/users/verify-code/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    })
    const data = await res.json()
    setLoading(false)                   // Reactiva el botón

    if (res.ok) {
      // Código correcto → mostrar éxito y redirigir al login en 3 segundos
      setSuccess(true)
      setTimeout(() => router.push('/login'), 3000)
    } else {
      // Código incorrecto, expirado, o cuenta ya verificada
      setError(data.error || 'Error al verificar')
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // FUNCIÓN PARA REENVIAR EL CÓDIGO (RESPETANDO COOLDOWN DE 2 MINUTOS)
  // ═════════════════════════════════════════════════════════════════════════
  const handleResend = async () => {
    if (resendCooldown > 0) return       // Bloqueado por el temporizador
    setError('')                         // Limpia errores anteriores

    const res = await fetch(`${API_URL}/api/users/resend-verification/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()

    if (res.ok) {
      setResendCooldown(120)             // 120 segundos = 2 minutos de espera
      alert('Nuevo código enviado a tu correo')
    } else {
      setError(data.error || 'Error al reenviar')
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // RENDERIZADO DE LA PÁGINA
  // ═════════════════════════════════════════════════════════════════════════
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

        {/* Si la verificación fue exitosa, muestra mensaje de éxito */}
        {success ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: c.success }}>✅ ¡Cuenta verificada!</p>
            <p style={{ color: c.textSub }}>Redirigiendo al login...</p>
          </div>
        ) : (
          /* Formulario para ingresar el código */
          <form onSubmit={handleVerify}>
            {/* Campo de email (SOLO LECTURA, NO SE PUEDE EDITAR) */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', color: c.textSub }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                readOnly                      // ⬅️ El usuario no puede escribir
                disabled                      // ⬅️ Aparece visualmente deshabilitado
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: c.input,
                  border: `1px solid ${c.border}`,
                  borderRadius: '6px',
                  color: c.textWeak,
                  cursor: 'not-allowed',      // ⬅️ Cursor de "prohibido"
                }}
              />
              <p style={{ fontSize: '12px', color: c.textWeak, marginTop: '4px' }}>
                Este es el correo que registraste. No se puede modificar.
              </p>
            </div>

            {/* Campo para el código de verificación */}
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

            {/* Mensaje de error (si existe) */}
            {error && (
              <p style={{ color: c.error, marginBottom: '16px' }}>
                {error}
              </p>
            )}

            {/* Botón de verificar */}
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

            {/* Botón para reenviar código (con temporizador) */}
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
  )
}
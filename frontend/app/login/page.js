'use client'   // ⬅️ Obligatorio en Next.js 14 para usar hooks como useState, useEffect, etc.

// ═══════════════════════════════════════════════════════════════════════════
// IMPORTACIONES
// ═══════════════════════════════════════════════════════════════════════════
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { c, styles } from '../lib/styles'   // Design system (colores, estilos globales)
import { API_URL } from '../lib/api'         // URL del backend desde .env.local

export default function LoginPage() {
  // ═════════════════════════════════════════════════════════════════════════
  // HOOKS DE NEXT.JS
  // ═════════════════════════════════════════════════════════════════════════
  const router = useRouter()                // Para redirigir a otras páginas

  // ═════════════════════════════════════════════════════════════════════════
  // ESTADOS LOCALES (useState)
  // ═════════════════════════════════════════════════════════════════════════
  const [email, setEmail] = useState('')          // Email ingresado por el usuario
  const [password, setPassword] = useState('')    // Contraseña ingresada
  const [error, setError] = useState('')          // Mensaje de error para mostrar
  const [loading, setLoading] = useState(false)   // ¿Está enviando la petición?
  const [hovering, setHovering] = useState(false) // ¿El mouse está sobre el botón?

  // ═════════════════════════════════════════════════════════════════════════
  // FUNCIÓN PARA INICIAR SESIÓN
  // ═════════════════════════════════════════════════════════════════════════
  const handleLogin = async (e) => {
    e.preventDefault()            // Evita que el formulario recargue la página
    setLoading(true)              // Deshabilita el botón mientras se procesa
    setError('')                  // Limpia errores anteriores

    try {
      // Llamada al backend: POST /api/users/login/
      const res = await fetch(`${API_URL}/api/users/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()   // Parsear la respuesta JSON

      if (res.ok) {
        // ═══════════════════════════════════════════════════════════════════
        // LOGIN EXITOSO: guardar credenciales y redirigir al home
        // ═══════════════════════════════════════════════════════════════════
        localStorage.setItem('access', data.access)           // Token JWT
        localStorage.setItem('refresh', data.refresh)         // Refresh token (para futuro)
        localStorage.setItem('user', JSON.stringify({
          email: data.email || email,
          name: data.name || email
        }))

        // Guardar token en cookie para que el middleware pueda leerlo
        document.cookie = `access=${data.access}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`

        // Redirigir a la página principal (recarga completa para refrescar NavBar)
        window.location.href = '/'
      } else {
        // ═══════════════════════════════════════════════════════════════════
        // ERROR EN LOGIN: verificar si es por cuenta no verificada
        // ═══════════════════════════════════════════════════════════════════
        // Si el backend devuelve 403 Forbidden y el mensaje contiene "verificar",
        // significa que la cuenta existe pero no está verificada.
        // Redirigimos automáticamente a la página de verificación con el email.
        if (res.status === 403 && data.error?.includes('verificar')) {
          router.push(`/verify-email?email=${encodeURIComponent(email)}`)
          return
        }

        // Otro tipo de error: mostrar mensaje genérico
        setError(data.error || 'Credenciales incorrectas')
      }
    } catch (err) {
      // Error de red o servidor caído
      setError('Error conectando con el servidor')
    } finally {
      setLoading(false)   // Reactivar el botón
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // FUNCIONES PARA EFECTOS VISUALES EN LOS INPUTS
  // ═════════════════════════════════════════════════════════════════════════
  const handleFocus = (e) => (e.target.style.borderColor = c.accent)
  const handleBlur = (e) => (e.target.style.borderColor = '#2A2A2A')

  // ═════════════════════════════════════════════════════════════════════════
  // RENDERIZADO DE LA PÁGINA
  // ═════════════════════════════════════════════════════════════════════════
  return (
    <div style={styles.page}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* ─── LOGO Y TÍTULO ─── */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: '900', color: c.textMain, letterSpacing: '8px', margin: 0 }}>
            URBAN<span style={{ color: c.primary }}>STORE</span>
          </h1>
          <p style={{ color: c.textSub, marginTop: '8px', fontSize: '13px' }}>
            Inicia sesión en tu cuenta
          </p>
        </div>

        {/* ─── TARJETA DEL FORMULARIO ─── */}
        <div style={styles.card}>
          {/* Mensaje de error (si existe) */}
          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Campo de Email */}
            <div>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                required
                placeholder="tu@email.com"
                style={styles.input}
              />
            </div>

            {/* Campo de Contraseña */}
            <div>
              <label style={styles.label}>Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                required
                placeholder="••••••••"
                style={styles.input}
              />
            </div>

            {/* Enlace "¿Olvidaste tu contraseña?" */}
            <div style={{ textAlign: 'right', marginTop: '-8px' }}>
              <Link href="/forgot-password" style={{ color: c.primary, fontSize: '13px', textDecoration: 'none' }}>
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* Botón de Login */}
            <button
              type="submit"
              disabled={loading}
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => setHovering(false)}
              style={styles.button(loading, hovering)}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>

          {/* Enlace a Registro */}
          <p style={{ textAlign: 'center', color: c.textSub, fontSize: '13px', marginTop: '24px' }}>
            ¿No tienes cuenta?{' '}
            <Link href="/register" style={{ color: c.accent, textDecoration: 'none', fontWeight: '600' }}>
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
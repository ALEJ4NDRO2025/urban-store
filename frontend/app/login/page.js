'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { c, styles } from '../lib/styles'  // ← paleta y estilos globales
import { API_URL } from '../lib/api'        // ← URL del backend desde .env.local

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [hovering, setHovering] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // URL viene de .env.local — no está hardcodeada en el código
      const res = await fetch(`${API_URL}/api/users/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (res.ok) {
        localStorage.setItem('access', data.access)
        localStorage.setItem('refresh', data.refresh)
        localStorage.setItem('user', JSON.stringify({ email: data.email || email }))
        window.location.href = '/' // Redirige a la página principal después de iniciar sesión
      } else {
        setError(data.detail || 'Credenciales incorrectas')
      }
    } catch (err) {
      setError('Error conectando con el servidor')
    } finally {
      setLoading(false)
    }
  }

  const handleFocus = (e) => (e.target.style.borderColor = c.accent)
  const handleBlur  = (e) => (e.target.style.borderColor = '#2A2A2A')

  return (
    <div style={styles.page}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* ── Logo ── */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: '900', color: c.textMain, letterSpacing: '8px', margin: 0 }}>
            URBAN<span style={{ color: c.primary }}>STORE</span>
          </h1>
          <p style={{ color: c.textSub, marginTop: '8px', fontSize: '13px' }}>
            Inicia sesión en tu cuenta
          </p>
        </div>

        {/* ── Card ── */}
        <div style={styles.card}>

          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

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
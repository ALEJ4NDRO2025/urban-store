'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { c, styles } from '../lib/styles'  // ← paleta y estilos globales
import { API_URL } from '../lib/api'        // ← URL del backend desde .env.local

export default function RegisterPage() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    first_name: '',
    last_name:  '',
    email:      '',
    password:   '',
  })
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [hovering, setHovering] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // URL viene de .env.local — no está hardcodeada en el código
      const res = await fetch(`${API_URL}/api/users/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok) {
        router.push('/login')
      } else {
        setError(data.detail || 'Error al registrar usuario')
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
            Crea tu cuenta
          </p>
        </div>

        {/* ── Card ── */}
        <div style={styles.card}>

          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Nombre y Apellido en fila */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={styles.label}>Nombre</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  maxLength={30}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  required
                  placeholder="Nombre"
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>Apellido</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  maxLength={30}
                  onChange={handleChange}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  required
                  placeholder="Apellido"
                  style={styles.input}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                required
                placeholder="tu@email.com"
                style={styles.input}
              />
            </div>

            {/* Contraseña */}
            <div>
              <label style={styles.label}>Contraseña</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
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
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>

          </form>

          <p style={{ textAlign: 'center', color: c.textSub, fontSize: '13px', marginTop: '24px' }}>
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" style={{ color: c.accent, textDecoration: 'none', fontWeight: '600' }}>
              Inicia sesión
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}
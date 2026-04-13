'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { c, styles } from '../lib/styles'
import { API_URL } from '../lib/api'

export default function RegisterPage() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [hovering, setHovering] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleFocus = (e) => (e.target.style.borderColor = c.accent)
  const handleBlur = (e) => (e.target.style.borderColor = '#2A2A2A')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    console.log('1. Iniciando registro...')

    // Validaciones básicas
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (formData.first_name.length > 30) {
      setError('El nombre no puede exceder los 30 caracteres')
      return
    }

    console.log('2. Validaciones pasadas, enviando petición...')
    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/api/users/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await res.json()
      console.log('3. Respuesta del servidor:', res.status, data)

      if (res.ok) {
        console.log('4. Registro exitoso, redirigiendo a verify-email...')
        // Forzar redirección con recarga completa
        window.location.href = `/verify-email?email=${encodeURIComponent(formData.email)}`
      } else {
        console.log('5. Error en registro:', data)
        // Manejar errores del backend
        if (data.email) {
          setError(data.email[0] || 'Error en el email')
        } else if (data.password) {
          setError(data.password[0] || 'Error en la contraseña')
        } else if (data.first_name) {
          setError(data.first_name[0] || 'Error en el nombre')
        } else {
          setError(data.error || 'Error al registrarse')
        }
      }
    } catch (err) {
      console.error('6. Error de conexión:', err)
      setError('Error conectando con el servidor')
    } finally {
      setLoading(false)
      console.log('7. Fin del proceso')
    }
  }

  return (
    <div style={styles.page}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: '900', color: c.textMain, letterSpacing: '8px', margin: 0 }}>
            URBAN<span style={{ color: c.primary }}>STORE</span>
          </h1>
          <p style={{ color: c.textSub, marginTop: '8px', fontSize: '13px' }}>
            Crea tu cuenta
          </p>
        </div>

        <div style={styles.card}>
          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                  onChange={handleChange}
                  maxLength={30}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  required
                  placeholder="Apellido"
                  style={styles.input}
                />
              </div>
            </div>

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
                placeholder="Mínimo 6 caracteres"
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>Confirmar contraseña</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                required
                placeholder="Repite tu contraseña"
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
              {loading ? 'Registrando...' : 'Registrarse'}
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
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { c } from '../lib/styles'
import { API_URL } from '../lib/api'

export default function PerfilPage() {
  const router = useRouter()

  const [profile, setProfile]     = useState(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [deleting, setDeleting]   = useState(false)
  const [mensaje, setMensaje]     = useState(null)   // { tipo: 'ok'|'error', texto }
  const [confirmar, setConfirmar] = useState(false)  // modal eliminar cuenta

  // ── Carga el perfil al montar ────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('access')
    if (!token) { router.push('/login'); return }

    fetch(`${API_URL}/api/users/profile/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setProfile(data)
        setFirstName(data.first_name)
        setLastName(data.last_name)
        setLoading(false)
      })
      .catch(() => { router.push('/login') })
  }, [])

  // ── Guardar cambios ──────────────────────────────────────────────────────
  const handleGuardar = async () => {
    if (!firstName.trim()) {
      setMensaje({ tipo: 'error', texto: 'El nombre no puede estar vacío' })
      return
    }
    setSaving(true)
    setMensaje(null)
    const token = localStorage.getItem('access')

    const res = await fetch(`${API_URL}/api/users/profile/`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ first_name: firstName, last_name: lastName }),
    })
    const data = await res.json()
    setSaving(false)

    if (res.ok) {
      // Actualiza el user en localStorage para que el Navbar lo refleje
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      localStorage.setItem('user', JSON.stringify({ ...user, name: data.first_name }))
      setMensaje({ tipo: 'ok', texto: '¡Perfil actualizado correctamente!' })
    } else {
      setMensaje({ tipo: 'error', texto: data.error || 'Error al guardar' })
    }
  }

  // ── Eliminar cuenta ──────────────────────────────────────────────────────
  const handleEliminar = async () => {
    setDeleting(true)
    const token = localStorage.getItem('access')

    const res = await fetch(`${API_URL}/api/users/profile/`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })

    if (res.ok) {
      localStorage.clear()
      router.push('/register')
    } else {
      setDeleting(false)
      setMensaje({ tipo: 'error', texto: 'Error al eliminar la cuenta' })
    }
  }

  // ── UI ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ backgroundColor: c.bg, minHeight: '100vh', color: c.textMain }}>
        <div style={{ padding: '60px', textAlign: 'center', color: c.textSub }}>
          Cargando perfil...
        </div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: c.bg, minHeight: '100vh', color: c.textMain }}>
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '60px 20px' }}>

        {/* ── Título ── */}
        <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '6px' }}>
          Mi <span style={{ color: c.primary }}>Perfil</span>
        </h1>
        <p style={{ color: c.textSub, fontSize: '13px', marginBottom: '40px' }}>
          Miembro desde {new Date(profile.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long' })}
        </p>

        {/* ── Card ── */}
        <div style={{ backgroundColor: c.card, borderRadius: '12px', padding: '32px', marginBottom: '20px' }}>

          {/* Email — solo lectura */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', color: c.textSub, fontSize: '12px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
              Correo electrónico
            </label>
            <div style={{ padding: '12px 16px', backgroundColor: c.input, borderRadius: '8px', border: `1px solid ${c.border}`, color: c.textWeak, fontSize: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{profile.email}</span>
              <span style={{ fontSize: '11px', color: c.textWeak, backgroundColor: c.bgDark, padding: '3px 8px', borderRadius: '4px' }}>
                No editable
              </span>
            </div>
          </div>

          {/* Nombre */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: c.textSub, fontSize: '12px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
              Nombre
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Tu nombre"
              style={{ width: '100%', padding: '12px 16px', backgroundColor: c.input, color: c.textMain, border: `1px solid ${c.border}`, borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
              onFocus={(e) => (e.target.style.borderColor = c.primary)}
              onBlur={(e)  => (e.target.style.borderColor = c.border)}
            />
          </div>

          {/* Apellido */}
          <div style={{ marginBottom: '28px' }}>
            <label style={{ display: 'block', color: c.textSub, fontSize: '12px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
              Apellido
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Tu apellido"
              style={{ width: '100%', padding: '12px 16px', backgroundColor: c.input, color: c.textMain, border: `1px solid ${c.border}`, borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
              onFocus={(e) => (e.target.style.borderColor = c.primary)}
              onBlur={(e)  => (e.target.style.borderColor = c.border)}
            />
          </div>

          {/* Mensaje ok/error */}
          {mensaje && (
            <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', backgroundColor: mensaje.tipo === 'ok' ? '#052e16' : '#3b0a0a', color: mensaje.tipo === 'ok' ? c.success : c.error, border: `1px solid ${mensaje.tipo === 'ok' ? c.success : c.error}` }}>
              {mensaje.texto}
            </div>
          )}

          {/* Botón guardar */}
          <button
            onClick={handleGuardar}
            disabled={saving}
            style={{ width: '100%', padding: '13px', backgroundColor: c.primary, color: '#000', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, letterSpacing: '0.5px' }}
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>

        {/* ── Zona peligrosa ── */}
        <div style={{ backgroundColor: '#1a0a0a', border: `1px solid #3b0a0a`, borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ color: c.error, fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>
            Zona peligrosa
          </h3>
          <p style={{ color: c.textSub, fontSize: '13px', marginBottom: '20px' }}>
            Al eliminar tu cuenta se borran todos tus datos permanentemente. Esta acción no se puede deshacer.
          </p>
          <button
            onClick={() => setConfirmar(true)}
            style={{ padding: '10px 20px', backgroundColor: 'transparent', color: c.error, border: `1px solid ${c.error}`, borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
          >
            Eliminar mi cuenta
          </button>
        </div>

      </div>

      {/* ── Modal confirmación eliminar ── */}
      {confirmar && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ backgroundColor: c.card, borderRadius: '12px', padding: '32px', maxWidth: '400px', width: '90%', border: `1px solid ${c.error}` }}>
            <h3 style={{ color: c.error, marginBottom: '12px' }}>¿Eliminar cuenta?</h3>
            <p style={{ color: c.textSub, fontSize: '14px', marginBottom: '28px' }}>
              Esta acción borrará tu cuenta y todos tus datos. No hay vuelta atrás.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setConfirmar(false)}
                style={{ flex: 1, padding: '12px', backgroundColor: c.input, color: c.textMain, border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminar}
                disabled={deleting}
                style={{ flex: 1, padding: '12px', backgroundColor: c.error, color: '#fff', border: 'none', borderRadius: '8px', cursor: deleting ? 'not-allowed' : 'pointer', fontWeight: '700', opacity: deleting ? 0.7 : 1 }}
              >
                {deleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
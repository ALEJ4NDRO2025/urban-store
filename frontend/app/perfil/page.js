'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { c } from '../lib/styles'
import { API_URL } from '../lib/api'

export default function PerfilPage() {
  const router = useRouter()

  const [profile, setProfile] = useState(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const [confirmar, setConfirmar] = useState(false)

  const [activeTab, setActiveTab] = useState('profile')
  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)

  // Cargar perfil
  useEffect(() => {
    const token = localStorage.getItem('access')
    if (!token) {
      router.push('/login')
      return
    }

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
      .catch(() => router.push('/login'))
  }, [])

  // Cargar pedidos cuando se active la pestaña
  useEffect(() => {
    if (activeTab !== 'orders') return
    const token = localStorage.getItem('access')
    if (!token) return

    setLoadingOrders(true)
    fetch(`${API_URL}/api/orders/my-orders/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setOrders(data)
        setLoadingOrders(false)
      })
      .catch((err) => {
        console.error('Error cargando pedidos:', err)
        setLoadingOrders(false)
      })
  }, [activeTab])

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
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      localStorage.setItem('user', JSON.stringify({ ...user, name: data.first_name }))
      setMensaje({ tipo: 'ok', texto: '¡Perfil actualizado correctamente!' })
    } else {
      setMensaje({ tipo: 'error', texto: data.error || 'Error al guardar' })
    }
  }

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
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 20px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', borderBottom: `1px solid ${c.border}` }}>
          <button
            onClick={() => setActiveTab('profile')}
            style={{
              padding: '12px 0',
              background: 'none',
              border: 'none',
              color: activeTab === 'profile' ? c.primary : c.textSub,
              fontWeight: '600',
              fontSize: '16px',
              cursor: 'pointer',
              borderBottom: activeTab === 'profile' ? `2px solid ${c.primary}` : '2px solid transparent',
            }}
          >
            Mi Perfil
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            style={{
              padding: '12px 0',
              background: 'none',
              border: 'none',
              color: activeTab === 'orders' ? c.primary : c.textSub,
              fontWeight: '600',
              fontSize: '16px',
              cursor: 'pointer',
              borderBottom: activeTab === 'orders' ? `2px solid ${c.primary}` : '2px solid transparent',
            }}
          >
            Mis Pedidos
          </button>
        </div>

        {/* Contenido Perfil */}
        {activeTab === 'profile' && (
          <>
            <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '6px' }}>
              Mi <span style={{ color: c.primary }}>Perfil</span>
            </h1>
            <p style={{ color: c.textSub, fontSize: '13px', marginBottom: '40px' }}>
              Miembro desde {new Date(profile.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long' })}
            </p>

            <div style={{ backgroundColor: c.card, borderRadius: '12px', padding: '32px', marginBottom: '20px' }}>
              {/* Email */}
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
                  onBlur={(e) => (e.target.style.borderColor = c.border)}
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
                  onBlur={(e) => (e.target.style.borderColor = c.border)}
                />
              </div>

              {mensaje && (
                <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', backgroundColor: mensaje.tipo === 'ok' ? '#052e16' : '#3b0a0a', color: mensaje.tipo === 'ok' ? c.success : c.error, border: `1px solid ${mensaje.tipo === 'ok' ? c.success : c.error}` }}>
                  {mensaje.texto}
                </div>
              )}

              <button
                onClick={handleGuardar}
                disabled={saving}
                style={{ width: '100%', padding: '13px', backgroundColor: c.primary, color: '#000', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, letterSpacing: '0.5px' }}
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>

            {/* Zona peligrosa */}
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
          </>
        )}

        {/* Contenido Mis Pedidos */}
        {activeTab === 'orders' && (
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '30px' }}>
              Mis <span style={{ color: c.primary }}>Pedidos</span>
            </h1>

            {loadingOrders ? (
              <p style={{ color: c.textSub, textAlign: 'center', padding: '40px' }}>Cargando pedidos...</p>
            ) : orders.length === 0 ? (
              <div style={{ backgroundColor: c.card, borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
                <p style={{ color: c.textSub, marginBottom: '20px' }}>Aún no has realizado ningún pedido.</p>
                <button
                  onClick={() => router.push('/catalog')}
                  style={{ padding: '10px 20px', backgroundColor: c.primary, color: '#000', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Explorar catálogo
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {orders.map((order) => (
                  <div key={order.id} style={{ backgroundColor: c.card, borderRadius: '12px', padding: '24px', border: `1px solid ${c.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '18px' }}>Pedido #{order.order_number}</h3>
                        <p style={{ margin: '4px 0 0', color: c.textSub, fontSize: '13px' }}>
                          {new Date(order.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: '600',
                        backgroundColor: order.status === 'pending' ? '#fff3e0' : order.status === 'paid' ? '#e8f5e9' : '#e3f2fd',
                        color: order.status === 'pending' ? '#e65100' : order.status === 'paid' ? '#2e7d32' : '#1565c0',
                      }}>
                        {order.status === 'pending' ? 'Pendiente' : order.status === 'paid' ? 'Pagado' : 'Enviado'}
                      </span>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      {order.items.slice(0, 3).map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '4px 0' }}>
                          <span>{item.product_name} x{item.quantity}</span>
                          <span>${item.subtotal.toLocaleString()}</span>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <p style={{ color: c.textSub, fontSize: '13px', marginTop: '8px' }}>
                          +{order.items.length - 3} productos más
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${c.border}`, paddingTop: '16px' }}>
                      <span style={{ fontWeight: '600' }}>Total</span>
                      <span style={{ fontWeight: '700', color: c.primary, fontSize: '18px' }}>
                        ${order.total.toLocaleString()}
                      </span>
                    </div>

                    <button
                      onClick={() => router.push(`/order-confirmation/${order.id}`)}
                      style={{ marginTop: '16px', padding: '8px 16px', backgroundColor: 'transparent', color: c.primary, border: `1px solid ${c.primary}`, borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                    >
                      Ver detalles
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal eliminar cuenta */}
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
    </div>
  )
}
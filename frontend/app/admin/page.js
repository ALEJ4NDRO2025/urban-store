'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { c } from '../lib/styles'
import { API_URL } from '../lib/api'

export default function AdminPage() {
  const router = useRouter()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('access')
    if (!token) {
      router.push('/login')
      return
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (!payload.is_admin) {
        router.push('/')
        return
      }
    } catch (e) {
      router.push('/login')
      return
    }

    fetch(`${API_URL}/api/orders/all/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('No autorizado')
        return res.json()
      })
      .then((data) => {
        setOrders(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const handleStatusChange = async (orderId, newStatus) => {
    const token = localStorage.getItem('access')
    setUpdatingId(orderId)

    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}/status/`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) throw new Error('Error al actualizar')

      const updatedOrder = await res.json()
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)))
    } catch (err) {
      alert('No se pudo actualizar el estado')
    } finally {
      setUpdatingId(null)
    }
  }

  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending':
        return { backgroundColor: '#fff3e0', color: '#e65100' }
      case 'paid':
        return { backgroundColor: '#e8f5e9', color: '#2e7d32' }
      case 'shipped':
        return { backgroundColor: '#e3f2fd', color: '#1565c0' }
      default:
        return { backgroundColor: '#f5f5f5', color: '#666' }
    }
  }

  if (loading) {
    return (
      <div style={{ backgroundColor: c.bg, minHeight: '100vh', color: c.textMain, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Cargando panel de administración...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ backgroundColor: c.bg, minHeight: '100vh', color: c.textMain, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
        <p style={{ color: c.error }}>Error: {error}</p>
        <button onClick={() => router.push('/')} style={{ padding: '10px 20px', backgroundColor: c.primary, color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          Volver al inicio
        </button>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: c.bg, minHeight: '100vh', color: c.textMain }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(20px, 5vw, 40px) clamp(16px, 4vw, 20px)' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 'clamp(20px, 4vw, 30px)', 
          flexWrap: 'wrap', 
          gap: '15px' 
        }}>
          <h1 style={{ fontSize: 'clamp(24px, 6vw, 28px)', fontWeight: '800' }}>
            Panel de <span style={{ color: c.primary }}>Administración</span>
          </h1>
          <button
            onClick={() => router.push('/')}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: 'transparent', 
              color: c.textSub, 
              border: `1px solid ${c.border}`, 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontSize: 'clamp(12px, 3vw, 14px)'
            }}
          >
            ← Volver a la tienda
          </button>
        </div>

        <h2 style={{ fontSize: 'clamp(18px, 4vw, 20px)', marginBottom: '20px' }}>Gestión de Pedidos</h2>

        {orders.length === 0 ? (
          <div style={{ backgroundColor: c.card, borderRadius: '12px', padding: 'clamp(30px, 8vw, 40px)', textAlign: 'center' }}>
            <p style={{ color: c.textSub, fontSize: 'clamp(14px, 3vw, 16px)' }}>No hay pedidos registrados.</p>
          </div>
        ) : (
          <div style={{ backgroundColor: c.card, borderRadius: '12px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${c.border}` }}>
                  <th style={{ padding: '16px', textAlign: 'left', color: c.textSub, fontSize: '13px', fontWeight: '600' }}>Nº Orden</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: c.textSub, fontSize: '13px', fontWeight: '600' }}>Cliente</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: c.textSub, fontSize: '13px', fontWeight: '600' }}>Fecha</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: c.textSub, fontSize: '13px', fontWeight: '600' }}>Total</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: c.textSub, fontSize: '13px', fontWeight: '600' }}>Estado</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: c.textSub, fontSize: '13px', fontWeight: '600' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: `1px solid ${c.border}` }}>
                    <td style={{ padding: '16px', fontWeight: '500' }}>{order.order_number}</td>
                    <td style={{ padding: '16px' }}>
                      <div>{order.shipping_address.name}</div>
                      <div style={{ fontSize: '12px', color: c.textSub }}>{order.shipping_address.email}</div>
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px' }}>
                      {new Date(order.created_at + 'Z').toLocaleString('es-CO', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </td>
                    <td style={{ padding: '16px', fontWeight: '700', color: c.primary }}>
                      ${order.total.toLocaleString()}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        disabled={updatingId === order.id}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: getStatusStyle(order.status).backgroundColor,
                          color: getStatusStyle(order.status).color,
                          border: `1px solid ${c.border}`,
                          borderRadius: '6px',
                          fontSize: '13px',
                          cursor: 'pointer',
                          opacity: updatingId === order.id ? 0.6 : 1,
                          fontWeight: '600',
                        }}
                      >
                        <option value="pending">Pendiente</option>
                        <option value="paid">Pagado</option>
                        <option value="shipped">Enviado</option>
                      </select>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <button
                        onClick={() => router.push(`/order-confirmation/${order.id}`)}
                        style={{ padding: '6px 12px', backgroundColor: 'transparent', color: c.primary, border: `1px solid ${c.primary}`, borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
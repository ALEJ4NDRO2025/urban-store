'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { c, styles, mergeStyles } from '../../lib/styles'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function OrderConfirmationPage() {
  const { id } = useParams()
  const router = useRouter()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchOrder = async () => {
      const access = localStorage.getItem('access')
      if (!access) {
        router.push('/login')
        return
      }

      try {
        const res = await fetch(`${API_URL}/api/orders/${id}/`, {
          headers: {
            Authorization: `Bearer ${access}`,
          },
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Error al cargar la orden')
        setOrder(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [id])

  // Estados para los badges
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return { emoji: '⏳', label: 'Pendiente', bg: '#fff3e0', color: '#e65100' }
      case 'paid':
        return { emoji: '✅', label: 'Pagado', bg: '#e8f5e9', color: '#2e7d32' }
      case 'shipped':
        return { emoji: '🚚', label: 'Enviado', bg: '#e3f2fd', color: '#1565c0' }
      default:
        return { emoji: '📦', label: status, bg: '#f5f5f5', color: '#666' }
    }
  }

  if (loading) {
    return (
      <div style={{ backgroundColor: c.bg, color: c.textMain, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Cargando orden...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ backgroundColor: c.bg, color: c.textMain, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
        <p style={{ color: c.error }}>Error: {error}</p>
        <button
          onClick={() => router.push('/')}
          style={styles.buttonSmall()}
        >
          Volver al inicio
        </button>
      </div>
    )
  }

  const statusBadge = getStatusBadge(order.status)

  return (
    <div style={{ backgroundColor: c.bg, color: c.textMain, minHeight: '100vh' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
        {/* Encabezado de éxito */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 20px',
            backgroundColor: statusBadge.bg,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ fontSize: '40px' }}>{statusBadge.emoji}</span>
          </div>
          <h1 style={mergeStyles(styles.heading2, { marginBottom: '8px' })}>
            ¡Pedido confirmado!
          </h1>
          <p style={{ color: c.textSub }}>
            Gracias por tu compra. Hemos enviado un correo con los detalles.
          </p>
        </div>

        {/* Detalles de la orden */}
        <div style={mergeStyles(styles.card, { marginBottom: '30px' })}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', margin: 0 }}>Orden #{order.order_number}</h2>
            <span style={{
              padding: '8px 16px',
              borderRadius: '30px',
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: statusBadge.bg,
              color: statusBadge.color,
            }}>
              {statusBadge.emoji} {statusBadge.label}
            </span>
          </div>

          <p style={{ color: c.textSub, marginBottom: '30px' }}>
            Fecha: {new Date(order.created_at + 'Z').toLocaleString('es-CO', {
              year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
            })}
          </p>

          {/* Dirección de envío */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '12px', color: c.textMain }}>Dirección de envío</h3>
            <div style={{ backgroundColor: c.bg, padding: '16px', borderRadius: '8px' }}>
              <p style={{ margin: '4px 0', fontWeight: '500' }}>{order.shipping_address.name}</p>
              <p style={{ margin: '4px 0', color: c.textSub }}>{order.shipping_address.email}</p>
              <p style={{ margin: '4px 0', color: c.textSub }}>{order.shipping_address.phone}</p>
              <p style={{ margin: '12px 0 4px' }}>{order.shipping_address.address}</p>
              <p style={{ margin: '4px 0' }}>
                {order.shipping_address.city}, {order.shipping_address.department}
              </p>
              <p style={{ margin: '4px 0' }}>{order.shipping_address.country}</p>
              {order.notes && (
                <p style={{ margin: '12px 0 4px', fontStyle: 'italic', color: c.textSub }}>
                  Nota: {order.notes}
                </p>
              )}
            </div>
          </div>

          {/* Items */}
          <h3 style={{ fontSize: '16px', marginBottom: '16px', color: c.textMain }}>Productos</h3>
          <div style={{ marginBottom: '20px' }}>
            {order.items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  padding: '12px 0',
                  borderBottom: idx < order.items.length - 1 ? `1px solid ${c.border}` : 'none',
                }}
              >
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 4px', fontWeight: '500' }}>{item.product_name}</p>
                  <p style={{ margin: 0, fontSize: '13px', color: c.textSub }}>
                    {item.size} · {item.color} · Cantidad: {item.quantity}
                  </p>
                </div>
                <p style={{ margin: 0, fontWeight: 'bold', color: c.primary }}>
                  ${item.subtotal.toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {/* Totales */}
          <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: c.textSub }}>
              <span>Subtotal</span>
              <span>${order.subtotal.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: c.textSub }}>
              <span>Envío</span>
              <span>{order.shipping === 0 ? 'Gratis' : `$${order.shipping.toLocaleString()}`}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: c.textSub }}>
              <span>Impuestos</span>
              <span>${order.tax.toLocaleString()}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontWeight: 'bold',
              fontSize: '18px',
              color: c.primary,
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: `1px solid ${c.border}`,
            }}>
              <span>TOTAL</span>
              <span>${order.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <button
            onClick={() => router.push('/catalog')}
            style={styles.buttonSmall()}
          >
            Seguir comprando
          </button>
          <button
            onClick={() => router.push('/')}
            style={mergeStyles(styles.buttonSecondary(), { fontSize: '14px' })}
          >
            Ir al inicio
          </button>
        </div>
      </div>
    </div>
  )
}
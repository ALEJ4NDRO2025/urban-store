'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { c } from '../../lib/styles'

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
          style={{
            padding: '10px 20px',
            backgroundColor: c.primary,
            color: '#000',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          Volver al inicio
        </button>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: c.bg, color: c.textMain, minHeight: '100vh' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
        {/* Encabezado de éxito */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 20px',
            backgroundColor: '#e6f7e6',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ fontSize: '40px', color: '#2e7d32' }}>✓</span>
          </div>
          <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>¡Pedido confirmado!</h1>
          <p style={{ color: c.textSub }}>
            Gracias por tu compra. Hemos enviado un correo con los detalles.
          </p>
        </div>

        {/* Detalles de la orden */}
        <div style={{ backgroundColor: c.card, borderRadius: '12px', padding: '30px', marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', margin: 0 }}>Orden #{order.order_number}</h2>
            <span style={{
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '500',
              backgroundColor: order.status === 'pending' ? '#fff3e0' : '#e8f5e9',
              color: order.status === 'pending' ? '#e65100' : '#2e7d32',
            }}>
              {order.status === 'pending' ? 'Pendiente' : 'Pagada'}
            </span>
          </div>

          <p style={{ color: c.textSub, marginBottom: '30px' }}>
            Fecha: {new Date(order.created_at).toLocaleDateString('es-CO', {
              year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
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
                {order.shipping_address.city}, {order.shipping_address.department}  {/* ← DEPARTAMENTO AÑADIDO */}
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
            style={{
              padding: '12px 24px',
              backgroundColor: c.primary,
              color: '#000',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Seguir comprando
          </button>
          <button
            onClick={() => router.push('/')}
            style={{
              padding: '12px 24px',
              backgroundColor: 'transparent',
              color: c.textMain,
              border: `1px solid ${c.border}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Ir al inicio
          </button>
        </div>
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '../lib/cartStore.js'
import { c } from '../lib/styles.js'

export default function CartPage() {
  const router = useRouter()
  const { items, total, itemCount, fetchCart, removeItem, updateQuantity } = useCartStore()
  const [loading, setLoading] = useState(true)

  // ✅ FIX 1: localStorage SOLO dentro de useEffect (evita hydration error)
  useEffect(() => {
    const access = localStorage.getItem('access')
    if (!access) {
      router.push('/login')
      return
    }
    fetchCart().finally(() => setLoading(false))
  }, [])

  // ✅ FIX 2: Sin <Navbar /> aquí — el layout.js ya lo pone

  if (loading) {
    return (
      <div style={{ backgroundColor: c.bg, color: c.textMain, minHeight: '100vh' }}>
        <div style={{ padding: '40px', textAlign: 'center' }}>Cargando carrito...</div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div style={{ backgroundColor: c.bg, color: c.textMain, minHeight: '100vh' }}>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h2>Carrito vacío</h2>
          <p style={{ color: c.textSub, marginBottom: '20px' }}>
            Agrega productos antes de continuar
          </p>
          <button
            onClick={() => router.push('/catalog')}
            style={{
              padding: '12px 24px',
              backgroundColor: c.primary,
              color: '#000',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Volver al catálogo
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: c.bg, color: c.textMain, minHeight: '100vh' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
        <h1 style={{ marginBottom: '30px' }}>Mi Carrito ({itemCount})</h1>

        {/* ITEMS */}
        <div style={{ marginBottom: '30px' }}>
          {items.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'grid',
                gridTemplateColumns: '120px 1fr auto auto',
                gap: '20px',
                padding: '20px',
                backgroundColor: c.card,
                borderRadius: '8px',
                marginBottom: '15px',
                alignItems: 'center',
              }}
            >
              {/* IMAGEN */}
              <div style={{ width: '120px', height: '120px', backgroundColor: c.bgDark, borderRadius: '8px', overflow: 'hidden' }}>
                <img
                  src={item.image || '/placeholder.jpg'}
                  alt={item.product_name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              {/* INFO */}
              <div>
                <h3 style={{ color: c.primary, marginBottom: '8px' }}>{item.product_name}</h3>
                <p style={{ color: c.textSub, fontSize: '13px', marginBottom: '5px' }}>
                  Talla: <strong>{item.selected_size}</strong> | Color: <strong>{item.selected_color}</strong>
                </p>
                <p style={{ color: c.textWeak, fontSize: '12px' }}>
                  Precio unitario: ${item.price_at_time?.toLocaleString()}
                </p>
              </div>

              {/* CANTIDAD */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  onClick={() => updateQuantity(item.product_slug, item.selected_size, item.selected_color, item.quantity - 1)}
                  style={{ backgroundColor: c.input, color: c.textMain, border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}
                >−</button>
                <span style={{ minWidth: '30px', textAlign: 'center' }}>{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.product_slug, item.selected_size, item.selected_color, item.quantity + 1)}
                  style={{ backgroundColor: c.input, color: c.textMain, border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}
                >+</button>
              </div>

              {/* SUBTOTAL + ELIMINAR */}
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: c.primary, fontWeight: 'bold', fontSize: '16px', marginBottom: '10px' }}>
                  ${(item.price_at_time * item.quantity)?.toLocaleString()}
                </p>
                <button
                  onClick={() => removeItem(item.product_slug, item.selected_size, item.selected_color)}
                  style={{ backgroundColor: c.error, color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                >Eliminar</button>
              </div>
            </div>
          ))}
        </div>

        {/* RESUMEN */}
        <div style={{ backgroundColor: c.card, padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span>Subtotal:</span><span>${total?.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span>Impuestos:</span><span>$0</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span>Envío:</span><span>$0</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', color: c.primary, borderTop: `1px solid ${c.border}`, paddingTop: '10px' }}>
            <span>TOTAL:</span><span>${total?.toLocaleString()}</span>
          </div>
        </div>

        {/* BOTONES */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => router.push('/catalog')}
            style={{ flex: 1, padding: '14px', backgroundColor: c.input, color: c.textMain, border: `1px solid ${c.border}`, borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >Continuar comprando</button>
          <button
            onClick={() => router.push('/checkout')}
            style={{ flex: 1, padding: '14px', backgroundColor: c.primary, color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >→ Ir a Checkout</button>
        </div>
      </div>
    </div>
  )
}
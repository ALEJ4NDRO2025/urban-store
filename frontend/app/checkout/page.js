'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '../lib/cartStore'
import { c, styles, mergeStyles } from '../lib/styles'
import { departamentos, departamentosYCiudades } from '../lib/colombiaData'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, total, createOrder } = useCartStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [form, setForm] = useState({
    name: '',
    email: '',
    address: '',
    city: '',
    customCity: '',
    department: '',
    country: 'Colombia',
    notes: '',
  })

  const [phoneDigits, setPhoneDigits] = useState('')
  const [availableCities, setAvailableCities] = useState([])

  // Verificar autenticación y precargar email
  useEffect(() => {
    const access = localStorage.getItem('access')
    if (!access) {
      router.push('/login')
      return
    }
    const userRaw = localStorage.getItem('user')
    if (userRaw) {
      try {
        const user = JSON.parse(userRaw)
        setForm((prev) => ({ ...prev, email: user.email || '' }))
      } catch (_) {}
    }
  }, [])

  // Actualizar ciudades según departamento seleccionado
  useEffect(() => {
    if (form.department && departamentosYCiudades[form.department]) {
      setAvailableCities(departamentosYCiudades[form.department])
      if (form.city !== '__OTHER__' && !departamentosYCiudades[form.department].includes(form.city)) {
        setForm(prev => ({ ...prev, city: '', customCity: '' }))
      }
    } else {
      setAvailableCities([])
    }
  }, [form.department])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  const handlePhoneChange = (e) => {
    const raw = e.target.value
    const digits = raw.replace(/\D/g, '')
    const limited = digits.slice(0, 10)
    setPhoneDigits(limited)
  }

  const handleSubmit = async () => {
    const ciudadValida = form.city === '__OTHER__' ? form.customCity.trim() !== '' : form.city !== ''
    if (!form.name || !form.email || !form.address || !ciudadValida || !form.department) {
      setError('Por favor completa todos los campos obligatorios.')
      return
    }
    if (phoneDigits.trim() === '') {
      setError('El teléfono es obligatorio.')
      return
    }
    if (items.length === 0) {
      setError('Tu carrito está vacío.')
      return
    }

    const length = phoneDigits.length
    const isMobile = length === 10 && phoneDigits[0] === '3'
    const isFixed = length === 7 && phoneDigits[0] !== '3'
    if (!isMobile && !isFixed) {
      setError('Ingresa un número colombiano válido: 10 dígitos para móvil (comienza en 3) o 7 dígitos para fijo.')
      return
    }

    setLoading(true)
    setError(null)

    const fullPhone = `+57 ${phoneDigits}`

    const shippingAddress = {
      email: form.email,
      name: form.name,
      phone: fullPhone,
      address: form.address,
      city: form.city === '__OTHER__' ? form.customCity : form.city,
      department: form.department,
      country: form.country,
    }

    const order = await createOrder(shippingAddress, form.notes)

    if (!order || order.error) {
      setError(order?.error || 'No se pudo crear la orden. Intenta de nuevo.')
      setLoading(false)
      return
    }

    router.push(`/order-confirmation/${order.id}`)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ESTILOS MEJORADOS (Glassmorphism sutil)
  // ═══════════════════════════════════════════════════════════════════════════
  const containerStyle = {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: 'clamp(20px, 5vw, 40px) clamp(16px, 4vw, 20px)',
  }

  const formCardStyle = {
    backgroundColor: 'rgba(26, 26, 26, 0.4)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(184, 134, 11, 0.15)',
    borderRadius: '24px',
    padding: 'clamp(20px, 4vw, 32px)',
  }

  const summaryCardStyle = {
    backgroundColor: 'rgba(26, 26, 26, 0.4)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(184, 134, 11, 0.2)',
    borderRadius: '24px',
    padding: 'clamp(20px, 4vw, 28px)',
    position: 'sticky',
    top: '20px',
  }

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    backgroundColor: 'rgba(38, 38, 38, 0.6)',
    backdropFilter: 'blur(8px)',
    border: `1px solid ${c.border}`,
    borderRadius: '14px',
    color: c.textMain,
    fontSize: '15px',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  }

  const labelStyle = {
    display: 'block',
    color: c.textSub,
    fontSize: '13px',
    marginBottom: '6px',
    fontWeight: '500',
    letterSpacing: '0.3px',
  }

  return (
    <div style={{ ...styles.page, display: 'block', padding: 0 }}>
      <div style={containerStyle}>
        <h1 style={{ ...styles.heading2, fontSize: 'clamp(28px, 6vw, 36px)' }}>Checkout</h1>
        <p style={{ ...styles.body, marginBottom: 'clamp(30px, 6vw, 40px)' }}>
          Completa tus datos para finalizar el pedido
        </p>

        <div className="checkout-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 380px',
          gap: 'clamp(20px, 4vw, 40px)',
        }}>
          {/* ─── FORMULARIO ─── */}
          <div style={formCardStyle}>
            <h2 style={{ fontSize: '20px', marginBottom: '24px', color: c.textMain, fontWeight: '700' }}>
              Datos de envío
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Nombre */}
              <div>
                <label style={labelStyle}>Nombre completo *</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="Wilson Mejía" style={inputStyle} />
              </div>

              {/* Email (SOLO LECTURA) */}
              <div>
                <label style={labelStyle}>Email *</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  readOnly
                  style={{
                    ...inputStyle,
                    backgroundColor: 'rgba(51,51,51,0.5)',
                    cursor: 'not-allowed',
                    color: c.textWeak,
                  }}
                />
                <p style={{ fontSize: '11px', color: c.textWeak, marginTop: '4px' }}>
                  El correo asociado a tu cuenta no se puede modificar.
                </p>
              </div>

              {/* Teléfono */}
              <div>
                <label style={labelStyle}>Teléfono *</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: '16px', color: c.textSub, pointerEvents: 'none', zIndex: 1 }}>+57</span>
                  <input
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    value={phoneDigits}
                    onChange={handlePhoneChange}
                    placeholder="300 123 4567"
                    style={{ ...inputStyle, paddingLeft: '52px' }}
                  />
                </div>
                <p style={{ fontSize: '11px', color: c.textWeak, marginTop: '4px' }}>
                  Móvil: 10 dígitos comenzando en 3 · Fijo: 7 dígitos
                </p>
              </div>

              {/* Dirección */}
              <div>
                <label style={labelStyle}>Dirección *</label>
                <input name="address" value={form.address} onChange={handleChange} placeholder="Calle 123 # 45-67, Apto 8" style={inputStyle} />
              </div>

              {/* Departamento */}
              <div>
                <label style={labelStyle}>Departamento *</label>
                <select name="department" value={form.department} onChange={handleChange} style={inputStyle}>
                  <option value="">Selecciona un departamento</option>
                  {departamentos.map(depto => <option key={depto} value={depto}>{depto}</option>)}
                </select>
              </div>

              {/* Ciudad */}
              <div>
                <label style={labelStyle}>Ciudad *</label>
                <select
                  name="city"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value, customCity: '' })}
                  style={inputStyle}
                  disabled={!form.department}
                >
                  <option value="">Selecciona una ciudad</option>
                  {availableCities.map(ciudad => <option key={ciudad} value={ciudad}>{ciudad}</option>)}
                  <option value="__OTHER__">Otro municipio (especificar)</option>
                </select>
              </div>

              {form.city === '__OTHER__' && (
                <div>
                  <label style={labelStyle}>Especifica el municipio *</label>
                  <input name="customCity" value={form.customCity} onChange={handleChange} placeholder="Ej: San Vicente de Chucurí" style={inputStyle} />
                </div>
              )}

              {/* País */}
              <div>
                <label style={labelStyle}>País</label>
                <input name="country" value={form.country} readOnly style={{ ...inputStyle, backgroundColor: 'rgba(51,51,51,0.5)', cursor: 'not-allowed' }} />
              </div>

              {/* Notas */}
              <div>
                <label style={labelStyle}>Notas del pedido (opcional)</label>
                <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Instrucciones especiales de entrega..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
            </div>
          </div>

          {/* ─── RESUMEN ─── */}
          <div style={summaryCardStyle}>
            <h2 style={{ fontSize: '20px', marginBottom: '20px', fontWeight: '700' }}>Tu pedido</h2>

            <div style={{ marginBottom: '20px' }}>
              {items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${c.border}` }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>{item.product_name}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: c.textSub }}>{item.selected_size} · {item.selected_color} · x{item.quantity}</p>
                  </div>
                  <p style={{ margin: 0, color: c.primary, fontWeight: 'bold', fontSize: '14px' }}>${(item.price_at_time * item.quantity).toLocaleString()}</p>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: c.textSub, fontSize: '14px' }}><span>Subtotal</span><span>${total?.toLocaleString()}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: c.textSub, fontSize: '14px' }}><span>Impuestos</span><span>$0</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: c.textSub, fontSize: '14px' }}><span>Envío</span><span>Gratis</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '18px', color: c.primary, borderTop: `1px solid ${c.border}`, paddingTop: '12px', marginTop: '4px' }}><span>TOTAL</span><span>${total?.toLocaleString()}</span></div>
            </div>

            {error && <div style={{ ...styles.error, marginBottom: '16px' }}>{error}</div>}

            <button onClick={handleSubmit} disabled={loading} style={styles.button(loading)}>
              {loading ? 'Procesando...' : 'Confirmar pedido'}
            </button>

            <button onClick={() => router.push('/carrito')} style={mergeStyles(styles.buttonSecondary(), { marginTop: '10px' })}>
              ← Volver al carrito
            </button>
          </div>
        </div>
      </div>

      {/* Responsive */}
      <style jsx>{`
        @media (max-width: 768px) {
          .checkout-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
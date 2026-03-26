'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { c } from '../lib/styles'

const CATEGORIES = ['todos', 'hoodies', 'gorras', 'camisetas', 'accesorios']
const SIZES      = ['todas', 'S', 'M', 'L', 'XL']
const PRICES     = [
  { label: 'Menos de $50.000',    value: 'menos-50' },
  { label: '$50.000 – $100.000',  value: '50-100'   },
  { label: 'Más de $100.000',     value: 'mas-100'  },
]

const sectionTitle = {
  color: c.textMain,
  fontSize: '10px',
  fontWeight: '700',
  letterSpacing: '2px',
  textTransform: 'uppercase',
  marginBottom: '12px',
  paddingBottom: '8px',
  borderBottom: `2px solid ${c.primary}`,
  display: 'inline-block',
}

const divider = {
  border: 'none',
  borderTop: `1px solid ${c.border}`,
  margin: '22px 0',
}

export default function CatalogFilters() {
  const router = useRouter()
  const params = useSearchParams()

  const activeCategory = params.get('category') || 'todos'
  const activeSize     = params.get('size')     || 'todas'
  const activePrice    = params.get('precio')   || ''

  function applyFilter(type, value) {
    const newParams = new URLSearchParams(params.toString())
    const empty = value === 'todos' || value === 'todas' || value === ''
    if (empty) { newParams.delete(type) } else { newParams.set(type, value) }
    router.push(`/catalog?${newParams.toString()}`)
  }

  function clearAll() {
    router.push('/catalog')
  }

  const hasFilters = activeCategory !== 'todos' || activeSize !== 'todas' || activePrice !== ''

  return (
    <aside style={{ width: '210px', flexShrink: 0, paddingRight: '32px' }}>

      {/* Header sidebar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px',
      }}>
        <span style={{ color: c.textMain, fontSize: '13px', fontWeight: '600' }}>Filtros</span>
        {hasFilters && (
          <button onClick={clearAll} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: c.primary, fontSize: '11px', fontWeight: '600',
            textDecoration: 'underline', padding: 0,
          }}>
            Limpiar
          </button>
        )}
      </div>

      {/* Categoría */}
      <div style={{ marginBottom: '4px' }}>
        <p style={sectionTitle}>Categoría</p>
        {CATEGORIES.map((cat) => {
          const active = activeCategory === cat
          return (
            <button key={cat} onClick={() => applyFilter('category', cat)} style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '9px 12px', borderRadius: '8px', marginBottom: '5px',
              fontSize: '13px', fontWeight: active ? '600' : '400',
              cursor: 'pointer', transition: 'all 0.15s',
              textTransform: 'capitalize',
              backgroundColor: active ? c.primary : 'transparent',
              color:           active ? c.white   : c.textMain,
              border:          active ? `1.5px solid ${c.primary}` : `1.5px solid transparent`,
            }}>
              {cat}
            </button>
          )
        })}
      </div>

      <hr style={divider} />

      {/* Talla */}
      <div style={{ marginBottom: '4px' }}>
        <p style={sectionTitle}>Talla</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {SIZES.map((size) => {
            const active = activeSize === size
            return (
              <button key={size} onClick={() => applyFilter('size', size)} style={{
                width: '40px', height: '40px', borderRadius: '8px',
                fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
                backgroundColor: active ? c.primary : c.card,
                color:           active ? c.white   : c.textMain,
                border:          active ? `1.5px solid ${c.primary}` : `1.5px solid ${c.border}`,
                boxShadow: active ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
              }}>
                {size}
              </button>
            )
          })}
        </div>
      </div>

      <hr style={divider} />

      {/* Precio */}
      <div>
        <p style={sectionTitle}>Precio</p>
        {PRICES.map(({ label, value }) => {
          const active = activePrice === value
          return (
            <button key={value} onClick={() => applyFilter('precio', value)} style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '9px 12px', borderRadius: '8px', marginBottom: '5px',
              fontSize: '13px', fontWeight: active ? '600' : '400',
              cursor: 'pointer', transition: 'all 0.15s',
              backgroundColor: active ? c.primary : 'transparent',
              color:           active ? c.white   : c.textMain,
              border:          active ? `1.5px solid ${c.primary}` : `1.5px solid transparent`,
            }}>
              {label}
            </button>
          )
        })}
      </div>

    </aside>
  )
}

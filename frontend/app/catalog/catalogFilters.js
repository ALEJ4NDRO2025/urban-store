'use client'
// app/catalog/catalogFilters.js
// Botones de filtro — necesita 'use client' porque el usuario hace clic

import { useRouter, useSearchParams } from 'next/navigation'
import { c } from '../lib/styles'

// Opciones fijas de filtro
const CATEGORIES = ['todos', 'hoodies', 'gorras', 'camisetas', 'accesorios']
const SIZES      = ['todas', 'S', 'M', 'L', 'XL']

export default function CatalogFilters() {
  const router     = useRouter()      // para cambiar la URL
  const params     = useSearchParams() // para leer la URL actual

  // Lee qué filtro está activo ahora mismo en la URL
  const activeCategory = params.get('category') || 'todos'
  const activeSize     = params.get('size')     || 'todas'

  // Cuando el usuario hace clic en un filtro, cambia la URL
  function applyFilter(type, value) {
    const newParams = new URLSearchParams(params.toString())

    if (value === 'todos' || value === 'todas') {
      newParams.delete(type)  // quita el filtro si elige "todos"
    } else {
      newParams.set(type, value)  // agrega o cambia el filtro
    }

    router.push(`/catalog?${newParams.toString()}`)
  }

  return (
    <div style={{ marginBottom: '32px' }}>

      {/* Filtro por categoría */}
      <div style={{ marginBottom: '16px' }}>
        <p style={{ color: c.textSub, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
          Categoría
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => applyFilter('category', cat)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: '1px solid',
                fontSize: '13px',
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.2s',
                // Si está activo → fondo rosa, si no → transparente
                backgroundColor: activeCategory === cat ? c.primary : 'transparent',
                borderColor:     activeCategory === cat ? c.primary : '#333',
                color:           activeCategory === cat ? '#fff'     : c.textSub,
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Filtro por talla */}
      <div>
        <p style={{ color: c.textSub, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
          Tallaa
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {SIZES.map((size) => (
            <button
              key={size}
              onClick={() => applyFilter('size', size)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: '1px solid',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: activeSize === size ? c.accent : 'transparent',
                borderColor:     activeSize === size ? c.accent : '#333',
                color:           activeSize === size ? '#000'   : c.textSub,
              }}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}
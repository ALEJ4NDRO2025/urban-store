'use client'
import { c } from '../lib/styles'

export default function ProductCard({ product }) {
  const imageUrl = product.images?.[0] || null

  return (
    <a href={`/catalog/${product.slug}`} style={{ textDecoration: 'none' }}>
      <div
        style={{ backgroundColor: c.card, borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
      >
        {/* Imagen */}
        <div style={{ width: '100%', height: '220px', backgroundColor: '#2A2A2A', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {imageUrl ? (
            <img src={imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ color: c.textSub, fontSize: '14px' }}>Sin imagen</span>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '16px' }}>
          <span style={{ color: c.accent, fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {product.category}
          </span>
          <h3 style={{ color: c.textMain, fontSize: '16px', fontWeight: '600', margin: '6px 0 8px', lineHeight: '1.3' }}>
            {product.name}
          </h3>
          <p style={{ color: c.primary, fontSize: '18px', fontWeight: '700', margin: '0' }}>
            ${Number(product.price).toLocaleString('es-CO')}
          </p>
          {product.stock <= 5 && product.stock > 0 && (
            <p style={{ color: '#FF6B35', fontSize: '12px', marginTop: '6px' }}>¡Solo quedan {product.stock}!</p>
          )}
          {product.stock === 0 && (
            <p style={{ color: c.textSub, fontSize: '12px', marginTop: '6px' }}>Agotado</p>
          )}
        </div>
      </div>
    </a>
  )
}
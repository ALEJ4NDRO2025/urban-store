'use client'
import { c } from '../lib/styles'

export default function ProductCard({ product }) {
  const imageUrl = product.images?.[0] || null

  return (
    <a href={`/catalog/${product.slug}`} style={{ textDecoration: 'none' }}>
      <div
        style={{
          backgroundColor: c.card,
          borderRadius: '14px',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s',
          border: `1px solid ${c.border}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-5px)'
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(192,154,58,0.15)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'
        }}
      >
        {/* Imagen */}
        <div style={{
          width: '100%',
          height: '240px',
          backgroundColor: c.input,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
        }}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{ color: c.textSub, fontSize: '32px', opacity: 0.4 }}>👕</span>
          )}

          {/* Badge stock bajo */}
          {product.stock <= 5 && product.stock > 0 && (
            <div style={{
              position: 'absolute', top: '10px', right: '10px',
              backgroundColor: c.primary, color: c.white,
              fontSize: '10px', fontWeight: '700',
              padding: '4px 8px', borderRadius: '20px',
              letterSpacing: '0.5px',
            }}>
              ¡Últimas {product.stock}!
            </div>
          )}

          {/* Badge agotado */}
          {product.stock === 0 && (
            <div style={{
              position: 'absolute', inset: 0,
              backgroundColor: 'rgba(242,237,230,0.75)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{
                color: c.textSub, fontSize: '12px', fontWeight: '600',
                letterSpacing: '2px', textTransform: 'uppercase',
              }}>Agotado</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '16px 18px 18px' }}>
          <span style={{
            color: c.primary, fontSize: '10px', fontWeight: '700',
            textTransform: 'uppercase', letterSpacing: '1.5px',
          }}>
            {product.category}
          </span>

          <h3 style={{
            color: c.textMain, fontSize: '15px', fontWeight: '600',
            margin: '5px 0 10px', lineHeight: '1.3',
          }}>
            {product.name}
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ color: c.textMain, fontSize: '18px', fontWeight: '700', margin: 0 }}>
              ${Number(product.price).toLocaleString('es-CO')}
            </p>

            {/* Mini tallas disponibles */}
            {product.sizes?.length > 0 && (
              <div style={{ display: 'flex', gap: '4px' }}>
                {product.sizes.slice(0, 3).map(size => (
                  <span key={size} style={{
                    fontSize: '10px', color: c.textSub,
                    border: `1px solid ${c.border}`,
                    borderRadius: '4px', padding: '2px 5px',
                  }}>
                    {size}
                  </span>
                ))}
                {product.sizes.length > 3 && (
                  <span style={{ fontSize: '10px', color: c.textSub }}>+{product.sizes.length - 3}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </a>
  )
}

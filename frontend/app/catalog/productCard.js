'use client'

import { useState } from 'react'
import Link from 'next/link'
import { c, styles } from '../lib/styles'

export default function ProductCard({ product }) {
  const [hovering, setHovering] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  const inStock = product.stock > 0
  const stockMessage = inStock 
    ? `${product.stock} disponibles` 
    : 'Agotado'

  return (
    <Link 
      href={`/catalog/${product.slug}`}
      style={{ textDecoration: 'none', outline: 'none' }}
    >
      <div
        style={{
          // Mantenemos la estructura base de styles.productCard
          ...styles.productCard,
          ...(hovering && styles.productCardHover),
          // Aplicamos Glassmorphism por encima (sobrescribe fondo y borde)
          backgroundColor: hovering ? 'rgba(26, 26, 26, 0.9)' : 'rgba(26, 26, 26, 0.6)',
          backdropFilter: 'blur(12px)',
          border: hovering 
            ? '1px solid rgba(184, 134, 11, 0.5)' 
            : '1px solid rgba(184, 134, 11, 0.15)',
          borderRadius: '20px',
          outline: 'none',
        }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        data-aos="fade-up"
      >
        {/* IMAGEN CON OVERLAY */}
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: c.bgDark,
            height: '280px',
          }}
        >
          {imageLoading && (
            <div
              style={{
                ...styles.skeleton,
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
          )}

          <img
            src={product.images?.[0] || '/placeholder.jpg'}
            alt={product.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: hovering ? 'scale(1.08)' : 'scale(1)',
              transition: 'transform 0.3s ease-in-out',
            }}
            onLoad={() => setImageLoading(false)}
          />

          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              backgroundColor: inStock ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)',
              color: '#FFFFFF',
              padding: '6px 14px',
              borderRadius: '30px',
              fontSize: '12px',
              fontWeight: '600',
              backdropFilter: 'blur(8px)',
            }}
          >
            {inStock ? '✓ En stock' : '✕ Agotado'}
          </div>

          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: hovering ? 'rgba(184, 134, 11, 0.08)' : 'rgba(184, 134, 11, 0)',
              transition: 'background-color 0.3s ease-in-out',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* INFO DEL PRODUCTO */}
        <div style={styles.productInfo}>
          <div style={styles.productCategory}>
            {product.category || 'Sin categoría'}
          </div>

          <h3
            style={{
              ...styles.productName,
              color: hovering ? c.primary : c.textMain,
            }}
          >
            {product.name}
          </h3>

          {product.description && (
            <p
              style={{
                fontSize: '13px',
                color: c.textWeak,
                marginBottom: '8px',
                lineHeight: '1.4',
                maxHeight: hovering ? '40px' : '0px',
                overflow: 'hidden',
                opacity: hovering ? 1 : 0,
                transition: 'all 0.3s ease-in-out',
              }}
            >
              {product.description.substring(0, 50)}...
            </p>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 'auto',
              paddingTop: '12px',
              borderTop: `1px solid ${hovering ? c.border : c.border}`,
            }}
          >
            <div style={styles.productPrice}>
              ${product.price?.toLocaleString()}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: inStock ? c.success : c.error,
                fontWeight: '500',
              }}
            >
              {stockMessage}
            </div>
          </div>

          <button
            style={styles.productButton(hovering)}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            onClick={(e) => {
              e.preventDefault()
              console.log('Agregar al carrito:', product.slug)
            }}
          >
            {inStock ? 'Ver Detalles' : 'No Disponible'}
          </button>
        </div>
      </div>
    </Link>
  )
}
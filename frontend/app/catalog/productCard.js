'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { c, styles } from '../lib/styles'

export default function ProductCard({ product }) {
  const [hovering, setHovering] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  // Determinar disponibilidad
  const inStock = product.stock > 0
  const stockMessage = inStock 
    ? `${product.stock} disponibles` 
    : 'Agotado'

  return (
    <Link href={`/catalog/${product.slug}`}>
      <div
        style={{
          ...styles.productCard,
          ...(hovering && styles.productCardHover),
        }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
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
          {/* Skeleton mientras carga */}
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

          {/* Imagen */}
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

          {/* OVERLAY CON BADGE DE STOCK */}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              backgroundColor: inStock ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)',
              color: '#FFFFFF',
              padding: '6px 12px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              backdropFilter: 'blur(4px)',
              animation: hovering ? 'slideInRight 0.3s ease-in-out' : 'none',
            }}
          >
            {inStock ? '✓ En stock' : '✕ Agotado'}
          </div>

          {/* OVERLAY DORADO AL HOVER */}
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
          {/* CATEGORÍA */}
          <div style={styles.productCategory}>
            {product.category || 'Sin categoría'}
          </div>

          {/* NOMBRE */}
          <h3
            style={{
              ...styles.productName,
              color: hovering ? c.primary : c.textMain,
            }}
          >
            {product.name}
          </h3>

          {/* DESCRIPCIÓN CORTA (si existe) */}
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

          {/* PRECIO Y STOCK */}
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

          {/* BOTÓN */}
          <button
            style={styles.productButton(hovering)}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            onClick={(e) => {
              e.preventDefault()
              // Aquí irá la lógica de "agregar al carrito"
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
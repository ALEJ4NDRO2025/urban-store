'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import ProductCard from './productCard'
import CatalogFilters from './catalogFilters'
import { c, styles } from '../lib/styles'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function CatalogPage() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filtering, setFiltering] = useState(false)

  // Parámetros de filtro
  const category = searchParams.get('category')
  const size = searchParams.get('size')
  const minPrice = searchParams.get('min_price')
  const maxPrice = searchParams.get('max_price')

  // Fetch de productos
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setFiltering(true)
        setLoading(true)

        // Construir URL con parámetros
        const params = new URLSearchParams()
        if (category) params.append('category', category)
        if (size) params.append('size', size)
        if (minPrice) params.append('min_price', minPrice)
        if (maxPrice) params.append('max_price', maxPrice)

        const url = `${API_URL}/api/products/?${params.toString()}`
        const response = await fetch(url)

        if (!response.ok) {
          throw new Error('Error al cargar productos')
        }

        const data = await response.json()
        setProducts(data.results || data || [])
        setError(null)
      } catch (err) {
        console.error('Error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
        setFiltering(false)
      }
    }

    fetchProducts()
  }, [category, size, minPrice, maxPrice])

  return (
    <div style={styles.pageSection}>
      <style>{`
        /* Animación para la carga de filtros */
        .loading-shimmer {
          animation: shimmer 2s infinite;
          background-image: linear-gradient(
            90deg,
            ${c.bgDark} 0%,
            ${c.card} 50%,
            ${c.bgDark} 100%
          );
          background-size: 1000px 100%;
        }
      `}</style>

      {/* HEADER */}
      <div
        style={{
          marginBottom: '40px',
          animation: 'fadeIn 0.6s ease-in-out',
        }}
      >
        <h1 style={styles.heading1}>Catálogo</h1>
        <p style={styles.body}>
          Descubre nuestra colección de ropa urbana y accesorios premium
        </p>
      </div>

      {/* FILTROS */}
      <div
        style={{
          marginBottom: '32px',
          animation: 'slideInLeft 0.5s ease-in-out',
        }}
      >
        <CatalogFilters />
      </div>

      {/* ESTADO DE CARGA */}
      {loading && (
        <div
          style={{
            textAlign: 'center',
            padding: '40px',
            animation: 'fadeIn 0.3s ease-in-out',
          }}
        >
          <div
            style={{
              display: 'inline-block',
              width: '40px',
              height: '40px',
              border: `3px solid ${c.border}`,
              borderTop: `3px solid ${c.primary}`,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          <p style={{ ...styles.body, marginTop: '16px' }}>
            Cargando productos...
          </p>
        </div>
      )}

      {/* ESTADO DE ERROR */}
      {error && !loading && (
        <div style={styles.error}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* RESULTADOS */}
      {!loading && products.length > 0 && (
        <div>
          {/* CONTADOR */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              padding: '16px',
              backgroundColor: c.bgDark,
              borderRadius: '8px',
              border: `1px solid ${c.border}`,
              animation: 'slideInRight 0.4s ease-in-out',
            }}
          >
            <p style={styles.body}>
              <span style={{ color: c.primary, fontWeight: '700' }}>
                {products.length}
              </span>{' '}
              producto{products.length !== 1 ? 's' : ''} encontrado
              {products.length !== 1 ? 's' : ''}
            </p>
            <div
              style={{
                fontSize: '12px',
                color: c.textWeak,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {filtering ? 'Filtrando...' : 'Listo'}
            </div>
          </div>

          {/* GRID DE PRODUCTOS */}
          <div
            style={{
              ...styles.gridContainer,
              animation: 'fadeIn 0.5s ease-in-out',
            }}
          >
            {products.map((product, index) => (
              <div
                key={product._id || index}
                style={{
                  animation: `scaleUp 0.4s ease-in-out ${index * 0.05}s backwards`,
                }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SIN RESULTADOS */}
      {!loading && products.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            animation: 'fadeIn 0.5s ease-in-out',
          }}
        >
          <div
            style={{
              fontSize: '48px',
              marginBottom: '16px',
              opacity: 0.5,
            }}
          >
            ✗
          </div>
          <h2 style={styles.heading2}>No hay productos</h2>
          <p style={styles.body}>
            Intenta ajustar tus filtros o explora otras categorías
          </p>
        </div>
      )}

      {/* ANIMACIÓN SPINNER */}
      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}
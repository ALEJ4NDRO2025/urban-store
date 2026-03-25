import { c } from '../lib/styles'
import ProductCard from './productCard'
import CatalogFilters from './catalogFilters'
import { Suspense } from 'react'

// searchParams llega automático en Next.js — son los ?category=hoodies de la URL
async function getProducts(searchParams) {
  try {
    const params = new URLSearchParams()
    if (searchParams.category) params.set('category', searchParams.category)
    if (searchParams.size)     params.set('size',     searchParams.size)
    if (searchParams.minPrice) params.set('min_price', searchParams.minPrice)
    if (searchParams.maxPrice) params.set('max_price', searchParams.maxPrice)

    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/products/?${params.toString()}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return []
    return await res.json()
  } catch (error) {
    console.error('Error cargando productos:', error)
    return []
  }
}

export default async function CatalogPage({ searchParams }) {
  const products = await getProducts(searchParams)

  return (
    <main style={{ backgroundColor: c.bg, minHeight: '100vh', padding: '40px 24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ color: c.textMain, fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
          Catálogo
        </h1>
        <p style={{ color: c.textSub, marginBottom: '32px' }}>
          {products.length} productos disponibles
        </p>

        {/* Filtros — Suspense es necesario porque usa useSearchParams */}
        <Suspense fallback={<div style={{ color: c.textSub }}>Cargando filtros...</div>}>
          <CatalogFilters />
        </Suspense>

        {/* Grid de productos */}
        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: c.textSub }}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>👕</p>
            <p style={{ fontSize: '18px' }}>No hay productos con ese filtro</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
            {products.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
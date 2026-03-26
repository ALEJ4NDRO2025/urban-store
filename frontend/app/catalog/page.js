import Navbar from '../Navbar'
import { c } from '../lib/styles'
import ProductCard from './productCard'
import CatalogFilters from './catalogFilters'
import { Suspense } from 'react'

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
    <div style={{ backgroundColor: c.bg, minHeight: '100vh' }}>

      {/* Navbar */}
      <Navbar  cartCount={0}/>

      {/* Hero strip */}
      <div style={{
        backgroundColor: c.bgDark,
        padding: '48px 40px 40px',
        borderBottom: `1px solid #3A342B`,
      }}>
        <p style={{
          color: c.primary, fontSize: '11px', fontWeight: '700',
          letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '10px',
        }}>
          Colección 2026
        </p>
        <h1 style={{
          color: '#F2EDE6', fontSize: '30px', fontWeight: '700',
          margin: '0 0 8px', letterSpacing: '-0.5px',
        }}>
          Catálogo Streetwear
        </h1>
        <p style={{ color: 'rgba(242,237,230,0.45)', fontSize: '14px', margin: 0 }}>
          Ropa y accesorios de cultura urbana
        </p>
      </div>

      {/* Layout principal */}
      <div style={{
        display: 'flex',
        gap: '0',
        alignItems: 'flex-start',
        paddingLeft: '24px',
      }}>

        {/* Sidebar filtros */}
        <Suspense fallback={
          <div style={{ width: '220px', flexShrink: 0, paddingLeft: '32px', paddingRight: '24px' }}>
            <div style={{ color: c.textSub, fontSize: '13px' }}>Cargando filtros...</div>
          </div>
        }>
          <CatalogFilters />
        </Suspense>

        {/* Contenido principal */}
        <div style={{ flex: 1, padding: '40px 40px 40px 32px' }}>

          {/* Barra superior */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '24px',
            paddingBottom: '16px', borderBottom: `1px solid ${c.border}`,
          }}>
            <span style={{ color: c.textSub, fontSize: '13px' }}>
              <span style={{ color: c.textMain, fontWeight: '600' }}>{products.length}</span> productos disponibles
            </span>
            <span style={{
              color: c.textSub, fontSize: '12px',
              backgroundColor: c.card, padding: '6px 14px',
              borderRadius: '20px', border: `1px solid ${c.border}`,
            }}>
              Más recientes primero
            </span>
          </div>

          {/* Estado vacío */}
          {products.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '80px 0',
              backgroundColor: c.card, borderRadius: '16px',
              border: `1px solid ${c.border}`,
            }}>
              <p style={{ fontSize: '48px', marginBottom: '16px' }}>👕</p>
              <p style={{ color: c.textMain, fontSize: '16px', fontWeight: '600', marginBottom: '6px' }}>
                Sin resultados
              </p>
              <p style={{ color: c.textSub, fontSize: '13px' }}>
                No hay productos con ese filtro
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '20px',
            }}>
              {products.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
import { c } from '../lib/styles'
import ProductCard from './productCard'


//get products es un send a postman
async function getProducts() {
  try {

    //aqui esta el fetch- esta linea de comunica con django
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/`, {
      //pedir datos frescos
      cache: 'no-store'
    })
    if (!res.ok) return []
    return await res.json()
  } catch (error) {
    console.error('Error cargando productos:', error)
    return []
  }
}

export default async function CatalogPage() {
  //espera la contsante qu habla con django y que traiga los productos
  const products = await getProducts()

  return (
    <main style={{ backgroundColor: c.bg, minHeight: '100vh', padding: '40px 24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ color: c.textMain, fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
          Catálogo
        </h1>
        <p style={{ color: c.textSub, marginBottom: '32px' }}>
          {products.length} productos disponibles
        </p>

        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: c.textSub }}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>👕</p>
            <p style={{ fontSize: '18px' }}>No hay productos disponibles aún</p>
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
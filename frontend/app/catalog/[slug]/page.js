'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { styles, c } from '../../lib/styles'

export default function ProductPage() {
  const { slug } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [selectedImage, setSelectedImage] = useState(0)  // índice de la imagen activa
  const [selectedSize, setSelectedSize] = useState(null) // talla seleccionada
  const [selectedColor, setSelectedColor] = useState(null)
  const [hovering, setHovering] = useState(null)
  const [added, setAdded] = useState(false)              // feedback del botón

  // Traer el producto del backend
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/${slug}/`)
        if (!res.ok) throw new Error('Producto no encontrado')
        const data = await res.json()
        setProduct(data)
        // Preseleccionar primera talla y color si existen
        if (data.sizes?.length > 0) setSelectedSize(data.sizes[0])
        if (data.colors?.length > 0) setSelectedColor(data.colors[0])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [slug])

  // Simula agregar al carrito (S4 lo conecta de verdad)
  const handleAddToCart = () => {
    if (!selectedSize) return
    setAdded(true)
    setTimeout(() => setAdded(false), 2000) // vuelve al texto normal después de 2s
  }

  // ── ESTADOS DE CARGA Y ERROR ──
  if (loading) return (
    <div style={{ ...styles.pageSection, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <p style={{ color: c.textSub }}>Cargando producto...</p>
    </div>
  )

  if (error) return (
    <div style={{ ...styles.pageSection, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <p style={{ color: c.error }}>{error}</p>
    </div>
  )

  // ── RENDER PRINCIPAL ──
  return (
    <div style={{ ...styles.pageSection, maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' }}>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px' }}>

        {/* ── COLUMNA IZQUIERDA: Galería ── */}
        <div>

          {/* Imagen principal */}
          <div style={{
            width: '100%',
            aspectRatio: '1/1',
            backgroundColor: c.card,
            borderRadius: '8px',
            border: `1.5px solid ${c.border}`,
            overflow: 'hidden',
            marginBottom: '16px',
          }}>
            {product.images?.length > 0 ? (
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              // Placeholder si no hay imágenes
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: c.textWeak, fontSize: '14px' }}>Sin imagen</span>
              </div>
            )}
          </div>

          {/* Miniaturas — solo si hay más de 1 imagen */}
          {product.images?.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {product.images.map((img, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: `2px solid ${selectedImage === index ? c.primary : c.border}`,
                    opacity: selectedImage === index ? 1 : 0.6,
                  }}
                >
                  <img src={img} alt={`Vista ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}

        </div>

        {/* ── COLUMNA DERECHA: Info del producto ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Categoría */}
          <span style={styles.productCategory}>{product.category}</span>

          {/* Nombre */}
          <h1 style={{ ...styles.heading2, marginBottom: 0 }}>{product.name}</h1>

          {/* Precio */}
          <p style={{ fontSize: '28px', fontWeight: '800', color: c.primary, margin: 0 }}>
            ${product.price?.toLocaleString('es-CO')} COP
          </p>

          {/* Stock */}
          <p style={{ color: product.stock > 0 ? c.success : c.error, fontSize: '13px', fontWeight: '600', margin: 0 }}>
            {product.stock > 0 ? `${product.stock} unidades disponibles` : 'Agotado'}
          </p>

          {/* Selector de tallas */}
          {product.sizes?.length > 0 && (
            <div>
              <p style={{ ...styles.label, marginBottom: '10px' }}>Talla</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    style={styles.filterButton(selectedSize === size, hovering === `size-${size}`)}
                    onMouseEnter={() => setHovering(`size-${size}`)}
                    onMouseLeave={() => setHovering(null)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selector de colores */}
          {product.colors?.length > 0 && (
            <div>
              <p style={{ ...styles.label, marginBottom: '10px' }}>Color</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    style={styles.filterButton(selectedColor === color, hovering === `color-${color}`)}
                    onMouseEnter={() => setHovering(`color-${color}`)}
                    onMouseLeave={() => setHovering(null)}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Advertencia si no seleccionó talla */}
          {!selectedSize && product.sizes?.length > 0 && (
            <p style={{ color: c.warning, fontSize: '13px', margin: 0 }}>
              Selecciona una talla para continuar
            </p>
          )}

          {/* Botón agregar al carrito */}
          <button
            onClick={handleAddToCart}
            disabled={!selectedSize || product.stock === 0}
            style={{
              ...styles.button(false, hovering === 'cart'),
              opacity: (!selectedSize || product.stock === 0) ? 0.4 : 1,
              cursor: (!selectedSize || product.stock === 0) ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={() => setHovering('cart')}
            onMouseLeave={() => setHovering(null)}
          >
            {added ? '✓ Agregado al carrito' : 'Agregar al carrito'}
          </button>

        </div>
      </div>
    </div>
  )
}
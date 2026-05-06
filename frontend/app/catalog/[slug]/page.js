'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { c } from '../../lib/styles';
import { useCartStore } from '../../lib/cartStore';
import { trackEvent } from '../../lib/analytics'; // ← importar analíticas

export default function ProductPage() {
  const { slug } = useParams();
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [hovering, setHovering] = useState(null);
  const [added, setAdded] = useState(false);
  const [addingError, setAddingError] = useState(null);

  // ============================================================
  // 1. Cargar producto y registrar evento de vista
  // ============================================================
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/${slug}/`);
        if (!res.ok) throw new Error('Producto no encontrado');
        const data = await res.json();
        setProduct(data);
        if (data.sizes?.length > 0) setSelectedSize(data.sizes[0]);
        if (data.colors?.length > 0) setSelectedColor(data.colors[0]);

        // 📊 Registrar evento de vista de producto (solo cuando se carga)
        trackEvent('product_view', {
          product_slug: data.slug,
          product_name: data.name,
          price: data.price?.toString(),
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  // ============================================================
  // 2. Manejador de agregar al carrito (con evento)
  // ============================================================
  const handleAddToCart = async () => {
    const token = localStorage.getItem('access');
    if (!token) {
      router.push('/login');
      return;
    }
    if (!selectedSize || !selectedColor) return;
    setAddingError(null);

    await addItem({
      product_slug: product.slug,
      product_name: product.name,
      quantity: 1,
      selected_size: selectedSize,
      selected_color: selectedColor,
      price_at_time: parseFloat(product.price),
      image: product.images?.[0] || '',
    });

    // 📊 Registrar evento de añadir al carrito
    trackEvent('add_to_cart', {
      product_slug: product.slug,
      product_name: product.name,
      price: product.price?.toString(),
      metadata: {
        quantity: 1,
        size: selectedSize,
        color: selectedColor,
      },
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) return (
    <div style={{ background: 'radial-gradient(circle at 30% 20%, #1a1a1a, #0D0D0D 80%)', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <p style={{ color: c.textSub }}>Cargando producto...</p>
    </div>
  );

  if (error) return (
    <div style={{ background: 'radial-gradient(circle at 30% 20%, #1a1a1a, #0D0D0D 80%)', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <p style={{ color: c.error }}>{error}</p>
    </div>
  );

  return (
    <div style={{ background: 'radial-gradient(circle at 30% 20%, #1a1a1a, #0D0D0D 80%)', minHeight: '100vh', color: c.textMain, padding: 'clamp(20px, 5vw, 40px) 24px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div className="product-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(24px, 5vw, 48px)' }}>

          {/* GALERÍA (sin cambios) */}
          <div>
            <div style={{
              width: '100%',
              aspectRatio: '1/1',
              backgroundColor: 'rgba(26, 26, 26, 0.4)',
              backdropFilter: 'blur(12px)',
              borderRadius: '24px',
              border: '1px solid rgba(184, 134, 11, 0.15)',
              overflow: 'hidden',
              marginBottom: '16px',
              boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
            }}>
              {product.images?.length > 0 ? (
                <img src={product.images[selectedImage]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: c.textWeak, fontSize: '14px' }}>Sin imagen</span>
                </div>
              )}
            </div>

            {product.images?.length > 1 && (
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {product.images.map((img, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    style={{
                      width: 'clamp(60px, 10vw, 80px)',
                      height: 'clamp(60px, 10vw, 80px)',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: `2px solid ${selectedImage === index ? c.primary : 'rgba(184, 134, 11, 0.2)'}`,
                      opacity: selectedImage === index ? 1 : 0.7,
                      transition: 'all 0.2s',
                    }}
                  >
                    <img src={img} alt={`Vista ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* INFO */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 4vw, 24px)' }}>
            <span style={{ fontSize: '12px', color: c.textWeak, textTransform: 'uppercase', letterSpacing: '1px' }}>{product.category}</span>
            <h1 style={{ fontSize: 'clamp(28px, 8vw, 40px)', fontWeight: '800', margin: 0, lineHeight: '1.1' }}>{product.name}</h1>
            <p style={{ fontSize: 'clamp(24px, 6vw, 32px)', fontWeight: '800', color: c.primary, margin: 0 }}>
              ${parseFloat(product.price)?.toLocaleString('es-CO')} COP
            </p>
            <p style={{ color: product.stock > 0 ? c.success : c.error, fontSize: '14px', fontWeight: '600', margin: 0 }}>
              {product.stock > 0 ? `${product.stock} unidades disponibles` : 'Agotado'}
            </p>

            {/* Tallas */}
            {product.sizes?.length > 0 && (
              <div>
                <p style={{ color: c.textSub, fontSize: '13px', marginBottom: '12px', fontWeight: '500' }}>Talla</p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      style={{
                        padding: 'clamp(10px, 3vw, 12px) clamp(16px, 4vw, 20px)',
                        backgroundColor: selectedSize === size ? c.primary : 'rgba(38, 38, 38, 0.6)',
                        backdropFilter: 'blur(8px)',
                        border: `1px solid ${selectedSize === size ? c.primary : c.border}`,
                        borderRadius: '14px',
                        color: selectedSize === size ? '#000' : c.textMain,
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={() => setHovering(`size-${size}`)}
                      onMouseLeave={() => setHovering(null)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Colores */}
            {product.colors?.length > 0 && (
              <div>
                <p style={{ color: c.textSub, fontSize: '13px', marginBottom: '12px', fontWeight: '500' }}>Color</p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      style={{
                        padding: 'clamp(10px, 3vw, 12px) clamp(16px, 4vw, 20px)',
                        backgroundColor: selectedColor === color ? c.primary : 'rgba(38, 38, 38, 0.6)',
                        backdropFilter: 'blur(8px)',
                        border: `1px solid ${selectedColor === color ? c.primary : c.border}`,
                        borderRadius: '14px',
                        color: selectedColor === color ? '#000' : c.textMain,
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={() => setHovering(`color-${color}`)}
                      onMouseLeave={() => setHovering(null)}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!selectedSize && product.sizes?.length > 0 && (
              <p style={{ color: c.warning, fontSize: '13px', margin: 0 }}>Selecciona una talla para continuar</p>
            )}

            {addingError && <p style={{ color: c.error, fontSize: '13px', margin: 0 }}>{addingError}</p>}

            <button
              onClick={handleAddToCart}
              disabled={!selectedSize || product.stock === 0}
              style={{
                padding: 'clamp(14px, 4vw, 16px) clamp(24px, 6vw, 32px)',
                backgroundColor: added ? c.success : c.primary,
                color: '#000',
                border: 'none',
                borderRadius: '40px',
                fontWeight: 'bold',
                fontSize: 'clamp(14px, 4vw, 16px)',
                cursor: (!selectedSize || product.stock === 0) ? 'not-allowed' : 'pointer',
                opacity: (!selectedSize || product.stock === 0) ? 0.5 : 1,
                transition: 'all 0.2s',
                boxShadow: '0 8px 20px rgba(184, 134, 11, 0.3)',
              }}
            >
              {added ? '✓ Agregado al carrito' : 'Agregar al carrito'}
            </button>

            {added && (
              <button
                onClick={() => router.push('/carrito')}
                style={{
                  padding: '14px',
                  backgroundColor: 'transparent',
                  color: c.primary,
                  border: `1px solid ${c.primary}`,
                  borderRadius: '40px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: 'clamp(13px, 3.5vw, 15px)',
                }}
              >
                Ver carrito →
              </button>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .product-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
        }
      `}</style>
    </div>
  );
}
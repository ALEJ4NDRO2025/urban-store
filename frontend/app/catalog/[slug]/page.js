'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { c, styles } from '../../lib/styles';
import { useCartStore } from '../../lib/cartStore';
import { trackEvent } from '../../lib/analytics';
import toast, { Toaster } from 'react-hot-toast';

export default function ProductPage() {
  const { slug } = useParams();
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const updateItemQuantity = useCartStore((state) => state.updateItemQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const cartItems = useCartStore((state) => state.items);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [isHovered, setIsHovered] = useState(false);

  const viewTracked = useRef(false);
  const [cartQuantity, setCartQuantity] = useState(0);

  // Sincronizar cantidad del carrito
  useEffect(() => {
    if (!product) return;
    const existingItem = cartItems.find(
      (item) =>
        item.product_slug === product.slug &&
        item.selected_size === selectedSize &&
        item.selected_color === selectedColor
    );
    setCartQuantity(existingItem ? existingItem.quantity : 0);
  }, [cartItems, product, selectedSize, selectedColor]);

  // Cargar producto y registrar vista
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/${slug}/`);
        if (!res.ok) throw new Error('Producto no encontrado');
        const data = await res.json();
        setProduct(data);
        if (data.sizes?.length > 0) setSelectedSize(data.sizes[0]);
        else setSelectedSize(null);
        if (data.colors?.length > 0) setSelectedColor(data.colors[0]);
        else setSelectedColor(null);

        if (!viewTracked.current) {
          viewTracked.current = true;
          trackEvent('product_view', {
            product_slug: data.slug,
            product_name: data.name,
            price: data.price?.toString(),
            metadata: {
              category: data.category,
              stock: data.stock,
            },
          });
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  // ============================================================
  // CÁLCULO DE STOCK (TOTAL Y POR VARIANTE)
  // ============================================================
  const getCurrentStock = () => {
    if (!product) return 0;
    const size = selectedSize || '';
    const color = selectedColor || '';

    // Si hay stock_by_variant y hay variante seleccionada, usar ese valor
    if (product.stock_by_variant && size && color) {
      const key = `${size}|${color}`;
      if (key in product.stock_by_variant) {
        return product.stock_by_variant[key] ?? 0;
      }
    }

    // Si hay stock_by_variant pero no hay selección o no coincide la clave,
    // sumamos todo el stock disponible entre todas las variantes
    if (product.stock_by_variant && Object.keys(product.stock_by_variant).length > 0) {
      return Object.values(product.stock_by_variant).reduce((a, b) => a + b, 0);
    }

    // Fallback al stock genérico
    return product.stock || 0;
  };

  const currentStock = getCurrentStock();

  // Stock total (suma de todas las variantes o fallback genérico)
  const totalStock = (() => {
    if (!product) return 0;
    if (product.stock_by_variant && Object.keys(product.stock_by_variant).length > 0) {
      return Object.values(product.stock_by_variant).reduce((a, b) => a + b, 0);
    }
    return product.stock || 0;
  })();

  // ============================================================
  // Acciones del carrito
  // ============================================================
  const handleIncrease = async () => {
    if (!product) return;
    const token = localStorage.getItem('access');
    if (!token) {
      router.push('/login');
      return;
    }

    const sizeRequired = product.sizes?.length > 0;
    const colorRequired = product.colors?.length > 0;
    if (sizeRequired && !selectedSize) {
      toast.error('Seleccioná una talla');
      return;
    }
    if (colorRequired && !selectedColor) {
      toast.error('Seleccioná un color');
      return;
    }

    if (cartQuantity === 0) {
      await addItem({
        product_slug: product.slug,
        product_name: product.name,
        quantity: 1,
        selected_size: selectedSize || '',
        selected_color: selectedColor || '',
        price_at_time: parseFloat(product.price),
        image: product.images?.[0] || '',
      });
      toast.success('Producto agregado al carrito');
    } else {
      await updateItemQuantity(
        product.slug,
        selectedSize || '',
        selectedColor || '',
        cartQuantity + 1
      );
      toast.success('Cantidad actualizada');
    }

    trackEvent('add_to_cart', {
      product_slug: product.slug,
      product_name: product.name,
      price: product.price?.toString(),
      metadata: {
        size: selectedSize,
        color: selectedColor,
        quantity: cartQuantity === 0 ? 1 : cartQuantity + 1,
      },
    });
  };

  const handleDecrease = async () => {
    if (!product) return;
    if (cartQuantity <= 0) return;

    if (cartQuantity === 1) {
      await removeItem(product.slug, selectedSize || '', selectedColor || '');
      toast.error('Producto eliminado del carrito');
    } else {
      await updateItemQuantity(
        product.slug,
        selectedSize || '',
        selectedColor || '',
        cartQuantity - 1
      );
      toast.success('Cantidad actualizada');
    }
  };

  // ============================================================
  // Loader / Error
  // ============================================================
  if (loading) {
    return (
      <div style={{ background: c.bg, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: `3px solid ${c.border}`,
          borderTop: `3px solid ${c.primary}`,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: c.bg, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '24px' }}>
        <p style={{ color: c.error, fontSize: '18px' }}>{error}</p>
        <button onClick={() => router.back()} style={{
          padding: '12px 24px',
          background: 'transparent',
          border: `1px solid ${c.border}`,
          borderRadius: '40px',
          color: c.textSub,
          cursor: 'pointer',
        }}>← Volver</button>
      </div>
    );
  }

  // Determinar disponibilidad
  const price = parseFloat(product.price) || 0;
  const hasSizes = product.sizes?.length > 0;
  const hasColors = product.colors?.length > 0;
  const hasVariantSelected = (hasSizes || hasColors) && selectedSize && selectedColor;
  const isSizeMissing = hasSizes && !selectedSize;
  const isColorMissing = hasColors && !selectedColor;
  const isOutOfStock = currentStock === 0;
  const isAvailable = !isSizeMissing && !isColorMissing && !isOutOfStock;

  return (
    <div style={{
      background: 'radial-gradient(circle at 30% 20%, #1a1a1a, #0D0D0D 80%)',
      minHeight: '100vh',
      color: c.textMain,
      padding: 'clamp(20px, 5vw, 48px) 24px',
    }}>
      <Toaster position="top-right" toastOptions={{ style: { background: c.card, color: c.textMain, border: `1px solid ${c.border}` } }} />
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className="product-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'clamp(32px, 6vw, 60px)',
          alignItems: 'start',
        }}>

          {/* ========== GALERÍA ========== */}
          <div>
            <div
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              style={{
                width: '100%',
                aspectRatio: '1/1',
                backgroundColor: 'rgba(26, 26, 26, 0.4)',
                backdropFilter: 'blur(16px)',
                borderRadius: '32px',
                border: `1px solid ${isHovered ? c.primary : 'rgba(184, 134, 11, 0.2)'}`,
                overflow: 'hidden',
                marginBottom: '20px',
                position: 'relative',
                transition: 'all 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1)',
                boxShadow: isHovered
                  ? '0 25px 50px rgba(184,134,11,0.15), 0 0 30px rgba(184,134,11,0.1)'
                  : '0 8px 24px rgba(0,0,0,0.3)',
              }}
            >
              {product.images?.length > 0 ? (
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                  }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: c.textWeak }}>Sin imagen disponible</span>
                </div>
              )}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: `radial-gradient(circle at 50% 50%, ${c.primary}20, transparent 70%)`,
                opacity: isHovered ? 1 : 0,
                transition: 'opacity 0.4s',
                pointerEvents: 'none',
              }} />
            </div>

            {product.images?.length > 1 && (
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {product.images.map((img, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: '18px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: `2px solid ${selectedImage === index ? c.primary : 'rgba(184, 134, 11, 0.15)'}`,
                      opacity: selectedImage === index ? 1 : 0.6,
                      transition: 'all 0.25s',
                      transform: selectedImage === index ? 'translateY(-4px)' : 'translateY(0)',
                      boxShadow: selectedImage === index ? `0 8px 16px rgba(184,134,11,0.2)` : 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedImage !== index) {
                        e.currentTarget.style.opacity = '0.9';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedImage !== index) {
                        e.currentTarget.style.opacity = '0.6';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    <img src={img} alt={`Vista ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ========== INFORMACIÓN ========== */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            background: 'rgba(26, 26, 26, 0.3)',
            backdropFilter: 'blur(12px)',
            borderRadius: '28px',
            padding: '32px',
            border: '1px solid rgba(184, 134, 11, 0.1)',
          }}>
            {/* Categoría */}
            <span style={{
              fontSize: '12px',
              color: c.primary,
              textTransform: 'uppercase',
              letterSpacing: '2px',
              fontWeight: '600',
              background: 'rgba(184,134,11,0.1)',
              padding: '6px 16px',
              borderRadius: '30px',
              alignSelf: 'flex-start',
            }}>
              {product.category || 'Urban'}
            </span>

            {/* Nombre */}
            <h1 style={{
              fontSize: 'clamp(32px, 6vw, 44px)',
              fontWeight: '800',
              lineHeight: '1.1',
              margin: 0,
              background: `linear-gradient(135deg, #FFFFFF 0%, #C0C0C0 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              {product.name}
            </h1>

            {/* Precio */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: 'clamp(28px, 5vw, 36px)', fontWeight: '800', color: c.primary }}>
                ${price.toLocaleString('es-CO')}
              </span>
              <span style={{ color: c.textWeak, fontSize: '14px' }}>COP</span>
            </div>

            {/* Stock (nueva presentación) */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              background: totalStock > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              borderRadius: '12px',
              padding: '12px 16px',
              width: 'fit-content',
            }}>
              {/* Línea principal: stock total o variante seleccionada */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: totalStock > 0 ? c.success : c.error,
                  boxShadow: `0 0 6px ${totalStock > 0 ? c.success : c.error}`,
                }} />
                <span style={{ fontSize: '14px', fontWeight: '600', color: totalStock > 0 ? c.success : c.error }}>
                  {hasVariantSelected
                    ? `${currentStock} disponible${currentStock !== 1 ? 's' : ''} en ${selectedSize} / ${selectedColor}`
                    : `${totalStock} disponible${totalStock !== 1 ? 's' : ''}`
                  }
                </span>
              </div>

              {/* Línea secundaria: cuando hay variante seleccionada, mostrar el total general */}
              {hasVariantSelected && (
                <div style={{ fontSize: '12px', color: c.textSub, marginLeft: '16px' }}>
                  ({totalStock} en total)
                </div>
              )}
            </div>

            {/* Descripción */}
            {product.description && (
              <p style={{ color: c.textSub, fontSize: '15px', lineHeight: '1.7', margin: 0, borderLeft: `2px solid ${c.primary}`, paddingLeft: '16px' }}>
                {product.description}
              </p>
            )}

            {/* Tallas */}
            {hasSizes && (
              <div>
                <p style={{ color: c.textSub, fontSize: '13px', marginBottom: '12px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>📏</span> Talla
                </p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      style={{
                        padding: '12px 20px',
                        backgroundColor: selectedSize === size ? c.primary : 'rgba(38, 38, 38, 0.6)',
                        backdropFilter: 'blur(8px)',
                        border: `1px solid ${selectedSize === size ? c.primary : c.border}`,
                        borderRadius: '14px',
                        color: selectedSize === size ? '#000' : c.textMain,
                        fontWeight: '600',
                        fontSize: '15px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: selectedSize === size ? `0 4px 12px rgba(184,134,11,0.3)` : 'none',
                      }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Colores */}
            {hasColors && (
              <div>
                <p style={{ color: c.textSub, fontSize: '13px', marginBottom: '12px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>🎨</span> Color
                </p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      style={{
                        padding: '12px 20px',
                        backgroundColor: selectedColor === color ? c.primary : 'rgba(38, 38, 38, 0.6)',
                        backdropFilter: 'blur(8px)',
                        border: `1px solid ${selectedColor === color ? c.primary : c.border}`,
                        borderRadius: '14px',
                        color: selectedColor === color ? '#000' : c.textMain,
                        fontWeight: '600',
                        fontSize: '15px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textTransform: 'capitalize',
                        boxShadow: selectedColor === color ? `0 4px 12px rgba(184,134,11,0.3)` : 'none',
                      }}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Advertencias */}
            {isSizeMissing && (
              <p style={{ color: c.warning, fontSize: '13px', margin: 0 }}>⚠️ Seleccioná una talla para continuar</p>
            )}
            {isColorMissing && (
              <p style={{ color: c.warning, fontSize: '13px', margin: 0 }}>⚠️ Seleccioná un color para continuar</p>
            )}
            {isOutOfStock && (
              <p style={{ color: c.error, fontSize: '13px', margin: 0 }}>🚫 Producto agotado temporalmente</p>
            )}

            {/* ========== CONTROLES DE CANTIDAD ========== */}
            <div style={{ marginTop: '8px' }}>
              {cartQuantity > 0 ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  backgroundColor: 'rgba(38, 38, 38, 0.6)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '40px',
                  padding: '8px 8px 8px 20px',
                  border: `1px solid ${c.border}`,
                  width: 'fit-content',
                }}>
                  <span style={{ color: c.textSub, fontSize: '14px' }}>Cantidad:</span>
                  <button
                    onClick={handleDecrease}
                    disabled={cartQuantity <= 0}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      border: `1px solid ${c.border}`,
                      background: 'transparent',
                      color: c.textMain,
                      fontSize: '18px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(184,134,11,0.2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    −
                  </button>
                  <span style={{ fontSize: '18px', fontWeight: 'bold', color: c.textMain, minWidth: '24px', textAlign: 'center' }}>
                    {cartQuantity}
                  </span>
                  <button
                    onClick={handleIncrease}
                    disabled={!isAvailable || cartQuantity >= currentStock}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      border: `1px solid ${c.border}`,
                      background: 'transparent',
                      color: c.textMain,
                      fontSize: '18px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(184,134,11,0.2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    +
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleIncrease}
                  disabled={!isAvailable}
                  style={{
                    width: '100%',
                    padding: '16px 32px',
                    backgroundColor: isAvailable ? c.primary : 'transparent',
                    color: isAvailable ? '#000' : c.textWeak,
                    border: `1px solid ${isAvailable ? c.primary : c.border}`,
                    borderRadius: '40px',
                    fontWeight: '700',
                    fontSize: '16px',
                    cursor: isAvailable ? 'pointer' : 'not-allowed',
                    opacity: isAvailable ? 1 : 0.5,
                    transition: 'all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1)',
                    boxShadow: isAvailable ? '0 8px 20px rgba(184, 134, 11, 0.3)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                  }}
                >
                  <span style={{ fontSize: '18px' }}>🛒</span>
                  Agregar al carrito
                </button>
              )}
            </div>

            {/* Botón de ver carrito */}
            {cartQuantity > 0 && (
              <button
                onClick={() => router.push('/carrito')}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: 'transparent',
                  color: c.primary,
                  border: `1px solid ${c.primary}`,
                  borderRadius: '40px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '15px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = c.primary;
                  e.currentTarget.style.color = '#000';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = c.primary;
                }}
              >
                Ver carrito →
              </button>
            )}

            {/* Volver */}
            <button
              onClick={() => router.back()}
              style={{
                padding: '10px',
                background: 'transparent',
                border: 'none',
                color: c.textWeak,
                cursor: 'pointer',
                fontSize: '14px',
                alignSelf: 'flex-start',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = c.textSub}
              onMouseLeave={(e) => e.currentTarget.style.color = c.textWeak}
            >
              ← Volver al catálogo
            </button>
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
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '../lib/cartStore';
import { trackEvent } from '../lib/analytics';

const PLACEHOLDER_IMG = 'https://placehold.co/600x600/1a1a1a/B8860B?text=Urban+Store';

export default function ProductCard({ product }) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  if (!product) return null;

  const inStock = product.stock > 0;
  const productLink = product.slug ? `/catalog/${product.slug}` : `/catalog/${product._id}`;
  const imageUrl = product.images?.[0] || PLACEHOLDER_IMG;

  // ============================================================
  // Obtener el primer color y la primera talla disponibles
  // (esto es para la tarjeta; en la página de detalle se puede elegir)
  // ============================================================
  const defaultColor = product.colors?.[0] || 'negro';
  const defaultSize = product.sizes?.[0] || 'M';

  // ============================================================
  // Manejador para agregar al carrito + evento analytics
  // ============================================================
  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();   // evita que el Link navegue al detalle

    const token = localStorage.getItem('access');
    if (!token) {
      router.push('/login?redirect=/catalog');
      return;
    }

    setAdding(true);

    const cartItem = {
      product_slug: product.slug,
      product_name: product.name,
      quantity: 1,
      selected_size: defaultSize,
      selected_color: defaultColor,
      price_at_time: product.price,
    };

    await addItem(cartItem);

    // 📊 Registrar evento de analíticas (con los valores reales)
    trackEvent('add_to_cart', {
      product_slug: product.slug,
      product_name: product.name,
      price: product.price?.toString(),
      metadata: {
        quantity: 1,
        size: defaultSize,
        color: defaultColor,
      },
    });

    setAdding(false);
  };

  return (
    <Link href={productLink} style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          background: 'rgba(26, 26, 26, 0.5)',
          backdropFilter: 'blur(12px)',
          borderRadius: '28px',
          border: `1px solid ${isHovered ? '#B8860B' : 'rgba(184, 134, 11, 0.15)'}`,
          overflow: 'hidden',
          transition: 'all 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1)',
          transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
          boxShadow: isHovered ? '0 25px 40px rgba(0,0,0,0.5), 0 0 20px rgba(184,134,11,0.2)' : 'none',
          cursor: 'pointer',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* IMAGEN (igual que antes) */}
        <div style={{ position: 'relative', aspectRatio: '1/1', overflow: 'hidden', background: '#1a1a1a' }}>
          {imageLoading && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(90deg, #2a2a2a, #3a3a3a, #2a2a2a)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
              }}
            />
          )}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(circle at 30% 30%, #B8860B20, transparent 70%)`,
              zIndex: 1,
              opacity: isHovered ? 0.6 : 0,
              transition: 'opacity 0.3s',
              pointerEvents: 'none',
            }}
          />
          <img
            src={imageUrl}
            alt={product.name}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: isHovered ? 'scale(1.08) rotate(1deg)' : 'scale(1)',
            }}
            onLoad={() => setImageLoading(false)}
            onError={(e) => {
              e.currentTarget.src = PLACEHOLDER_IMG;
              setImageLoading(false);
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: inStock ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)',
              color: '#fff',
              fontSize: '11px',
              fontWeight: '600',
              padding: '4px 12px',
              borderRadius: '30px',
              backdropFilter: 'blur(4px)',
              zIndex: 2,
            }}
          >
            {inStock ? 'En stock' : 'Agotado'}
          </div>
        </div>

        {/* INFORMACIÓN (igual que antes) */}
        <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: '12px',
              color: '#B8860B',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              marginBottom: '8px',
              fontWeight: 600,
            }}
          >
            {product.category || 'Urban'}
          </div>
          <h3
            style={{
              fontSize: 'clamp(18px, 3vw, 22px)',
              fontWeight: '700',
              margin: '0 0 12px',
              color: '#fff',
              lineHeight: 1.3,
            }}
          >
            {product.name}
          </h3>
          <div
            style={{
              fontSize: 'clamp(22px, 4vw, 28px)',
              fontWeight: '800',
              background: `linear-gradient(135deg, #B8860B, #FFD700)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginTop: 'auto',
            }}
          >
            ${product.price?.toLocaleString()}
          </div>

          {/* BOTÓN AGREGAR */}
          <button
            onClick={handleAddToCart}
            disabled={adding || !inStock}
            style={{
              marginTop: '16px',
              width: '100%',
              padding: '10px 0',
              background: isHovered ? `linear-gradient(135deg, #B8860B, #D4A017)` : 'rgba(255,255,255,0.05)',
              border: isHovered ? 'none' : `1px solid rgba(184, 134, 11, 0.3)`,
              color: isHovered ? '#000' : '#fff',
              fontWeight: '600',
              borderRadius: '40px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {adding ? 'Agregando...' : 'Agregar al carrito 🛒'}
          </button>
        </div>

        {/* ANIMACIÓN SHIMMER */}
        <style jsx>{`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `}</style>
      </div>
    </Link>
  );
}
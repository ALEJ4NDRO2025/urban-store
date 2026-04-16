'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from './productCard';
import CatalogFilters from './catalogFilters';
import { c, styles } from '../lib/styles';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function CatalogPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtering, setFiltering] = useState(false);

  const category = searchParams.get('category');
  const size = searchParams.get('size');
  const minPrice = searchParams.get('min_price');
  const maxPrice = searchParams.get('max_price');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setFiltering(true);
        setLoading(true);

        const params = new URLSearchParams();
        if (category) params.append('category', category);
        if (size) params.append('size', size);
        if (minPrice) params.append('min_price', minPrice);
        if (maxPrice) params.append('max_price', maxPrice);

        const url = `${API_URL}/api/products/?${params.toString()}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Error al cargar productos');
        }

        const data = await response.json();
        setProducts(data.results || data || []);
        setError(null);
      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
        setFiltering(false);
      }
    };

    fetchProducts();
  }, [category, size, minPrice, maxPrice]);

  return (
    <div
      style={{
        background: '#0D0D0D',
        color: c.textMain,
        minHeight: '100vh',
        padding: 'clamp(40px, 5vw, 60px) 24px',
      }}
    >
      {/* ESTILOS GLOBALES (igual que en el home) */}
      <style jsx global>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .loading-shimmer {
          background: linear-gradient(90deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
      `}</style>

      {/* HEADER CON GRADIENTE ANIMADO (como el título del home) */}
      <div
        style={{
          marginBottom: '48px',
          textAlign: 'center',
          animation: 'fadeInDown 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <h1
          style={{
            fontSize: 'clamp(36px, 8vw, 56px)',
            fontWeight: '900',
            marginBottom: '16px',
            background: `linear-gradient(135deg, #FFFFFF 0%, ${c.primary} 40%, #FFD700 80%, #FFFFFF 100%)`,
            backgroundSize: '300% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'gradientShift 8s ease infinite',
            letterSpacing: '2px',
          }}
        >
          Catálogo
        </h1>
        <p
          style={{
            fontSize: 'clamp(16px, 2vw, 20px)',
            color: c.textSub,
            maxWidth: '600px',
            margin: '0 auto',
            fontWeight: 300,
          }}
        >
          Descubre nuestra colección de ropa urbana y accesorios premium
        </p>
      </div>

      {/* FILTROS (con glassmorphism ya aplicado en CatalogFilters) */}
      <div
        style={{
          marginBottom: '40px',
          animation: 'fadeInUp 0.6s ease-out',
        }}
      >
        <CatalogFilters />
      </div>

      {/* ESTADO DE CARGA (skeleton más elegante) */}
      {loading && (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
          }}
        >
          <div
            className="loading-shimmer"
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              margin: '0 auto 24px',
            }}
          />
          <p style={{ color: c.textSub, fontSize: '16px' }}>
            Cargando productos únicos...
          </p>
        </div>
      )}

      {/* ESTADO DE ERROR (con botón de reintento) */}
      {error && !loading && (
        <div
          style={{
            background: 'rgba(220, 38, 38, 0.1)',
            border: `1px solid #dc2626`,
            borderRadius: '16px',
            padding: '24px',
            textAlign: 'center',
            marginBottom: '32px',
          }}
        >
          <p style={{ color: '#dc2626', fontWeight: 500 }}>⚠️ {error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '12px',
              background: c.primary,
              color: '#000',
              border: 'none',
              borderRadius: '40px',
              padding: '8px 24px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Reintentar
          </button>
        </div>
      )}

      {/* RESULTADOS */}
      {!loading && products.length > 0 && (
        <div>
          {/* CONTADOR CON GLASSMORPHISM */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
              marginBottom: '32px',
              padding: '16px 24px',
              background: 'rgba(26, 26, 26, 0.6)',
              backdropFilter: 'blur(12px)',
              borderRadius: '60px',
              border: `1px solid ${c.border}`,
              animation: 'fadeInUp 0.5s ease-out',
            }}
          >
            <p style={{ margin: 0, color: c.textSub }}>
              <span style={{ color: c.primary, fontWeight: 'bold', fontSize: '1.2rem' }}>
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
                letterSpacing: '1px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {filtering && (
                <>
                  <span
                    style={{
                      display: 'inline-block',
                      width: '12px',
                      height: '12px',
                      border: `2px solid ${c.primary}`,
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                  <span>Filtrando...</span>
                </>
              )}
              {!filtering && <span>✓ Listo</span>}
            </div>
          </div>

          {/* GRID DE PRODUCTOS (con animación escalonada) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '32px',
            }}
          >
            {products.map((product, index) => (
              <div
                key={product._id || index}
                style={{
                  animation: `fadeInUp 0.5s ease-out ${index * 0.05}s backwards`,
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
            padding: '80px 20px',
            background: 'rgba(184, 134, 11, 0.05)',
            borderRadius: '40px',
            border: `1px dashed ${c.primary}`,
            animation: 'fadeInUp 0.5s ease-out',
          }}
        >
          <div style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.6 }}>✨</div>
          <h2
            style={{
              fontSize: 'clamp(28px, 5vw, 36px)',
              fontWeight: '800',
              color: c.primary,
              marginBottom: '12px',
            }}
          >
            No hay productos
          </h2>
          <p style={{ color: c.textSub, fontSize: '16px' }}>
            Intenta ajustar tus filtros o explora otras categorías
          </p>
        </div>
      )}
    </div>
  );
}
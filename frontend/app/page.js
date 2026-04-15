'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { c } from './lib/styles'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [loading, setLoading] = useState(true)

  // Cargar productos destacados (primeros 4 del catálogo)
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_URL}/api/products/`)
        const data = await res.json()
        // Tomar solo los primeros 4 para mostrar
        setFeaturedProducts(data.slice(0, 4))
      } catch (error) {
        console.error('Error cargando productos destacados:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  // Categorías (estáticas, puedes cambiarlas)
  const categories = [
    { name: 'Camisetas', icon: '👕', slug: 'camisetas' },
    { name: 'Hoodies', icon: '🧥', slug: 'hoodies' },
    { name: 'Gorras', icon: '🧢', slug: 'gorras' },
    { name: 'Accesorios', icon: '💎', slug: 'accesorios' },
  ]

  return (
    <div style={{ background: 'radial-gradient(circle at 30% 20%, #1a1a1a, #0D0D0D 80%)', color: c.textMain }}>
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* HERO SECTION */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      <section style={{
        position: 'relative',
        minHeight: '90vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: 'url("/hero-bg.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed', // Efecto parallax sutil
      }}>
        {/* Overlay oscuro con gradiente */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(13,13,13,0.9) 0%, rgba(13,13,13,0.4) 100%)',
          backdropFilter: 'blur(4px)',
        }} />

        <div style={{
          position: 'relative',
          textAlign: 'center',
          maxWidth: '900px',
          padding: '0 24px',
        }} data-aos="fade-up">
          <h1 style={{
            fontSize: 'clamp(42px, 12vw, 80px)',
            fontWeight: '900',
            marginBottom: '20px',
            lineHeight: '1.1',
            textTransform: 'uppercase',
            letterSpacing: '4px',
          }}>
            <span style={{ color: c.primary }}>Urban</span> Store
          </h1>
          <p style={{
            fontSize: 'clamp(18px, 5vw, 24px)',
            color: c.textSub,
            marginBottom: '40px',
            fontWeight: '400',
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            Viste tu actitud. Descubre la nueva colección de streetwear.
          </p>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/catalog" className="shimmer-btn" style={{
              padding: '16px 40px',
              backgroundColor: c.primary,
              color: '#000',
              fontWeight: 'bold',
              borderRadius: '40px',
              textDecoration: 'none',
              fontSize: '18px',
              boxShadow: '0 8px 20px rgba(184, 134, 11, 0.3)',
              transition: 'transform 0.2s',
              display: 'inline-block',
            }}>
              Explorar catálogo
            </Link>
            <Link href="/register" style={{
              padding: '16px 40px',
              backgroundColor: 'transparent',
              color: c.textMain,
              fontWeight: 'bold',
              borderRadius: '40px',
              textDecoration: 'none',
              fontSize: '18px',
              border: `1px solid ${c.primary}`,
              backdropFilter: 'blur(8px)',
              transition: 'all 0.2s',
            }}>
              Registrarse
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* CATEGORÍAS DESTACADAS */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      <section style={{ padding: '80px 24px', maxWidth: '1200px', margin: '0 auto' }} data-aos="fade-up">
        <h2 style={{
          fontSize: 'clamp(32px, 6vw, 48px)',
          fontWeight: '800',
          textAlign: 'center',
          marginBottom: '50px',
        }}>
          Explora por <span style={{ color: c.primary }}>categoría</span>
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '30px',
        }}>
          {categories.map((cat) => (
            <Link key={cat.slug} href={`/catalog?category=${cat.slug}`} style={{ textDecoration: 'none' }}>
              <div style={{
                backgroundColor: 'rgba(26, 26, 26, 0.5)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(184, 134, 11, 0.2)',
                borderRadius: '30px',
                padding: '40px 20px',
                textAlign: 'center',
                transition: 'transform 0.3s, box-shadow 0.3s',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)'
                e.currentTarget.style.boxShadow = '0 20px 30px rgba(0,0,0,0.5), 0 0 0 1px rgba(184,134,11,0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>{cat.icon}</div>
                <h3 style={{ color: c.textMain, fontSize: '20px', fontWeight: '700' }}>{cat.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* PRODUCTOS POPULARES */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      <section style={{ padding: '80px 24px', maxWidth: '1200px', margin: '0 auto' }} data-aos="fade-up">
        <h2 style={{
          fontSize: 'clamp(32px, 6vw, 48px)',
          fontWeight: '800',
          textAlign: 'center',
          marginBottom: '50px',
        }}>
          Lo más <span style={{ color: c.primary }}>popular</span>
        </h2>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <p style={{ color: c.textSub }}>Cargando productos...</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '30px',
          }}>
            {featuredProducts.map((product) => (
              <Link key={product.slug} href={`/catalog/${product.slug}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  backgroundColor: 'rgba(26, 26, 26, 0.5)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(184, 134, 11, 0.15)',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)'
                  e.currentTarget.style.boxShadow = '0 15px 30px rgba(0,0,0,0.6), 0 0 0 1px rgba(184,134,11,0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}>
                  <div style={{ aspectRatio: '1/1', overflow: 'hidden' }}>
                    <img
                      src={product.images?.[0] || '/placeholder.jpg'}
                      alt={product.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    />
                  </div>
                  <div style={{ padding: '20px', flex: 1 }}>
                    <div style={{ fontSize: '12px', color: c.textWeak, textTransform: 'uppercase', marginBottom: '8px' }}>
                      {product.category}
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 12px', color: c.textMain }}>
                      {product.name}
                    </h3>
                    <div style={{ fontSize: '22px', fontWeight: '800', color: c.primary }}>
                      ${product.price?.toLocaleString()}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <Link href="/catalog" style={{
            padding: '14px 32px',
            backgroundColor: 'transparent',
            color: c.primary,
            border: `1px solid ${c.primary}`,
            borderRadius: '40px',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '16px',
            transition: 'all 0.2s',
            display: 'inline-block',
          }}>
            Ver todo el catálogo →
          </Link>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* FOOTER SIMPLE */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      <footer style={{
        borderTop: `1px solid ${c.border}`,
        padding: '40px 24px',
        marginTop: '60px',
        backgroundColor: 'rgba(13,13,13,0.8)',
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center', color: c.textSub }}>
          <p>© 2026 Urban Store. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
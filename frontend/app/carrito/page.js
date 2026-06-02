'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '../lib/cartStore.js';
import { c } from '../lib/styles.js';
import { trackEvent } from '../lib/analytics';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ─── Número de WhatsApp Business ──────────────────────────
const WHATSAPP_NUMBER = '573118540079'; // ← Tu número real

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, updateItemQuantity } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasItems, setHasItems] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  // ─── Calcular total de forma robusta ───────────────
  const realTotal = items.reduce((sum, item) => {
    const price = parseFloat(item.price_at_time) || 0;
    return sum + price * item.quantity;
  }, 0);

  // ============================================================
  // 1. Montaje e hidratación
  // ============================================================
  useEffect(() => {
    setMounted(true);
    const access = localStorage.getItem('access');
    if (!access) {
      router.push('/login');
      return;
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const has = items.length > 0;
    setHasItems(has);
    if (has && !loading) {
      trackEvent('view_cart', {
        metadata: { item_count: items.length, cart_total: realTotal },
      });
    }
  }, [items, loading, mounted]);

  // ============================================================
  // 2. Detectar abandono por cierre de pestaña
  // ============================================================
  useEffect(() => {
    if (!mounted || !hasItems) return;
    const sendAbandonEvent = () => {
      const sessionId = localStorage.getItem('session_id') || crypto.randomUUID();
      if (!localStorage.getItem('session_id')) localStorage.setItem('session_id', sessionId);
      const payload = {
        event_type: 'cart_abandon',
        session_id: sessionId,
        metadata: { item_count: items.length, cart_total: realTotal, reason: 'page_closed' },
      };
      fetch(`${API_URL}/api/analytics/track/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
      navigator.sendBeacon(`${API_URL}/api/analytics/track/`, JSON.stringify(payload));
    };
    window.addEventListener('pagehide', sendAbandonEvent);
    return () => window.removeEventListener('pagehide', sendAbandonEvent);
  }, [hasItems, items.length, realTotal, mounted]);

  // ============================================================
  // 3. Eliminar producto
  // ============================================================
  const handleRemoveItem = async (item) => {
    setRemovingId(item.product_slug + item.selected_size + item.selected_color);
    try {
      await removeItem(item.product_slug, item.selected_size, item.selected_color);
      const newItemCount = items.length - 1;
      if (newItemCount === 0) {
        await trackEvent('cart_abandon', {
          metadata: {
            item_count: 1,
            cart_total: realTotal - item.price_at_time * item.quantity,
            reason: 'user_removed_all_items',
          },
        });
      }
      await trackEvent('remove_from_cart', {
        product_slug: item.product_slug,
        product_name: item.product_name,
        price: item.price_at_time?.toString(),
        metadata: { quantity: item.quantity, size: item.selected_size, color: item.selected_color },
      });
    } catch (error) {
      console.error('Error en handleRemoveItem:', error);
    }
    setRemovingId(null);
  };

  const handleUpdateQuantity = (item, newQuantity) => {
    if (newQuantity < 1) return;
    updateItemQuantity(item.product_slug, item.selected_size, item.selected_color, newQuantity);
  };

  // ─── Generar mensaje prearmado para WhatsApp (formato simple) ────
  const generateWhatsAppMessage = () => {
    if (!items || items.length === 0) return '';

    const itemsText = items
      .map(
        (item) =>
          `-${item.product_name} (${item.selected_size || 'Talle único'} / ${item.selected_color || 'Color único'}) x${item.quantity} - $${(item.price_at_time * item.quantity).toLocaleString()}`
      )
      .join('\n'); // salto de línea real

    const totalLine = `\n--Total: $${realTotal.toLocaleString()}`;
    return `Hola Equipo Urban Store! Me gustaría comprar:\n\n${itemsText}${totalLine}\n\n¿Me ayudan con el pedido?`;
  };

  // ============================================================
  // ESTILOS PREMIUM (se mantienen igual)
  // ============================================================
  const glassCard = {
    background: 'rgba(26, 26, 26, 0.5)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(184, 134, 11, 0.15)',
    borderRadius: '28px',
    padding: '24px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
    transition: 'all 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1)',
  };

  const goldText = {
    background: `linear-gradient(135deg, ${c.primary} 0%, #D4A017 50%, #FFD700 100%)`,
    backgroundSize: '200% auto',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    animation: 'gradientShift 6s ease infinite',
  };

  const primaryBtn = (hovering = false) => ({
    padding: '16px 36px',
    background: `linear-gradient(135deg, ${c.primary} 0%, #D4A017 50%, #FFD700 100%)`,
    backgroundSize: '200% auto',
    color: '#0D0D0D',
    fontWeight: '700',
    border: 'none',
    borderRadius: '50px',
    fontSize: '16px',
    cursor: 'pointer',
    boxShadow: hovering ? '0 12px 28px rgba(184,134,11,0.45)' : '0 8px 20px rgba(184,134,11,0.3)',
    transition: 'all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1)',
    transform: hovering ? 'translateY(-2px)' : 'translateY(0)',
    letterSpacing: '0.5px',
  });

  const secondaryBtn = (hovering = false) => ({
    padding: '14px 32px',
    background: hovering ? c.primary : 'transparent',
    color: hovering ? '#000' : c.primary,
    border: `1px solid ${c.primary}`,
    borderRadius: '50px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: hovering ? `0 6px 16px rgba(184,134,11,0.3)` : 'none',
  });

  const quantityBtn = {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: `1px solid rgba(184,134,11,0.3)`,
    background: 'rgba(38,38,38,0.6)',
    backdropFilter: 'blur(8px)',
    color: c.textMain,
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    fontWeight: 'bold',
  };

  // ============================================================
  // RENDER
  // ============================================================
  if (!mounted || loading) {
    return (
      <div style={{
        background: 'radial-gradient(circle at 30% 20%, #1a1a1a, #0D0D0D 80%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: c.textMain,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: `3px solid ${c.border}`,
            borderTop: `3px solid ${c.primary}`,
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 20px',
          }} />
          <p style={{ color: c.textSub, fontSize: '16px' }}>Preparando carrito…</p>
        </div>
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div style={{
        background: 'radial-gradient(circle at 30% 20%, #1a1a1a, #0D0D0D 80%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: c.textMain,
        padding: '20px',
      }}>
        <div style={{
          ...glassCard,
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          padding: '60px 40px',
        }}>
          <div style={{ fontSize: '80px', marginBottom: '24px' }}>🛒</div>
          <h2 style={{ ...goldText, fontSize: '32px', fontWeight: '900', marginBottom: '16px' }}>Carrito vacío</h2>
          <p style={{ color: c.textSub, marginBottom: '32px', fontSize: '16px', lineHeight: 1.6 }}>
            Agrega productos antes de continuar
          </p>
          <button
            onClick={() => router.push('/catalog')}
            style={primaryBtn()}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 28px rgba(184,134,11,0.45)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(184,134,11,0.3)';
            }}
          >
            Explorar productos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'radial-gradient(circle at 30% 20%, #1a1a1a, #0D0D0D 80%)',
      minHeight: '100vh',
      color: c.textMain,
      padding: '40px 20px 80px',
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{
            fontSize: 'clamp(28px, 7vw, 44px)',
            fontWeight: '900',
            marginBottom: '8px',
            ...goldText,
            letterSpacing: '1px',
          }}>
            Mi Carrito
          </h1>
          <p style={{ color: c.textSub, fontSize: '15px', fontWeight: '500' }}>
            {items.reduce((sum, i) => sum + i.quantity, 0)} producto{items.reduce((sum, i) => sum + i.quantity, 0) !== 1 ? 's' : ''} en tu pedido
          </p>
        </div>

        <div style={{ marginBottom: '32px' }}>
          {items.map((item, idx) => (
            <div
              key={idx}
              style={{
                ...glassCard,
                display: 'grid',
                gridTemplateColumns: '120px 1fr auto',
                gap: '24px',
                alignItems: 'center',
                marginBottom: '20px',
                opacity: removingId === item.product_slug + item.selected_size + item.selected_color ? 0.5 : 1,
                transition: 'all 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1), opacity 0.3s ease',
                animation: `fadeInUp 0.5s cubic-bezier(0.2, 0.9, 0.4, 1.1) ${idx * 0.08}s both`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 16px 32px rgba(0,0,0,0.4)';
                e.currentTarget.style.borderColor = c.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
                e.currentTarget.style.borderColor = 'rgba(184, 134, 11, 0.15)';
              }}
            >
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '20px',
                overflow: 'hidden',
                backgroundColor: '#1a1a1a',
                position: 'relative',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: `radial-gradient(circle at 30% 30%, ${c.primary}15, transparent 70%)`,
                  zIndex: 1,
                }} />
                <img
                  src={item.image || 'https://placehold.co/600x600/1a1a1a/B8860B?text=Urban'}
                  alt={item.product_name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.4s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                />
              </div>

              <div>
                <a
                  href={`/catalog/${item.product_slug}`}
                  style={{
                    textDecoration: 'none',
                    color: c.primary,
                    fontSize: '18px',
                    fontWeight: '700',
                    marginBottom: '8px',
                    display: 'block',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#FFD700'}
                  onMouseLeave={(e) => e.currentTarget.style.color = c.primary}
                >
                  {item.product_name}
                </a>
                <div style={{ color: c.textSub, fontSize: '13px', marginBottom: '12px' }}>
                  <span>Talla: <strong style={{ color: c.textMain }}>{item.selected_size}</strong></span>
                  <span style={{ margin: '0 12px' }}>|</span>
                  <span>Color: <strong style={{ color: c.textMain, textTransform: 'capitalize' }}>{item.selected_color}</strong></span>
                </div>
                <p style={{ color: c.textWeak, fontSize: '13px', marginBottom: '0' }}>
                  Precio unitario: ${Number(item.price_at_time).toLocaleString()}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    onClick={() => handleUpdateQuantity(item, item.quantity - 1)}
                    style={quantityBtn}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(184,134,11,0.2)';
                      e.currentTarget.style.borderColor = c.primary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(38,38,38,0.6)';
                      e.currentTarget.style.borderColor = 'rgba(184,134,11,0.3)';
                    }}
                  >
                    −
                  </button>
                  <span style={{
                    minWidth: '32px',
                    textAlign: 'center',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: c.textMain,
                  }}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => handleUpdateQuantity(item, item.quantity + 1)}
                    style={quantityBtn}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(184,134,11,0.2)';
                      e.currentTarget.style.borderColor = c.primary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(38,38,38,0.6)';
                      e.currentTarget.style.borderColor = 'rgba(184,134,11,0.3)';
                    }}
                  >
                    +
                  </button>
                </div>

                <p style={{
                  color: c.primary,
                  fontWeight: 'bold',
                  fontSize: '18px',
                  margin: 0,
                  ...goldText,
                }}>
                  ${(Number(item.price_at_time) * item.quantity).toLocaleString()}
                </p>

                <button
                  onClick={() => handleRemoveItem(item)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: c.error,
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  🗑 Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          ...glassCard,
          marginBottom: '32px',
          padding: '28px',
          border: `1px solid rgba(184, 134, 11, 0.25)`,
          boxShadow: '0 12px 28px rgba(0,0,0,0.4)',
        }}>
          <h3 style={{
            fontSize: '22px',
            fontWeight: '800',
            marginBottom: '24px',
            color: c.textMain,
            letterSpacing: '0.5px',
          }}>
            Resumen del pedido
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: c.textSub, fontSize: '15px' }}>
              <span>Subtotal</span>
              <span>${realTotal.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: c.textSub, fontSize: '15px' }}>
              <span>Impuestos</span>
              <span>$0</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: c.textSub, fontSize: '15px' }}>
              <span>Envío</span>
              <span>Gratis</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontWeight: 'bold',
              fontSize: '20px',
              marginTop: '8px',
              borderTop: `1px solid ${c.border}`,
              paddingTop: '16px',
            }}>
              <span style={{ color: c.textMain }}>TOTAL</span>
              <span style={goldText}>${realTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* ─── BOTONES DE ACCIÓN ──────────────────────────── */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <button
            onClick={() => router.push('/catalog')}
            style={secondaryBtn()}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = c.primary;
              e.currentTarget.style.color = '#000';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(184,134,11,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = c.primary;
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            ← Continuar comprando
          </button>
          <button
            onClick={() => router.push('/checkout')}
            style={{ ...primaryBtn(), flex: 1, textAlign: 'center' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 28px rgba(184,134,11,0.45)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(184,134,11,0.3)';
            }}
          >
            Ir a Checkout →
          </button>
        </div>

        {/* 🆕 BOTÓN DE WHATSAPP (ICONO OFICIAL + MENSAJE PERSONALIZADO) ── */}
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(generateWhatsAppMessage())}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            trackEvent('whatsapp_cart_click', {
              metadata: {
                cart_items: items.map(item => item.product_name).join(', '),
                total: realTotal,
                items_count: items.length,
              },
            });
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            width: '100%',
            padding: '14px 24px',
            marginTop: '16px',
            backgroundColor: '#25D366',
            color: '#fff',
            border: 'none',
            borderRadius: '50px',
            fontWeight: '700',
            fontSize: '16px',
            textDecoration: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#20ba5a';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 16px rgba(37, 211, 102, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#25D366';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 211, 102, 0.3)';
          }}
        >
          {/* Icono oficial de WhatsApp */}
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="#fff">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
          </svg>
          Comprar por WhatsApp
        </a>

        <div style={{
          marginTop: '60px',
          textAlign: 'center',
          borderTop: `1px solid rgba(184,134,11,0.15)`,
          paddingTop: '32px',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${c.primary}, transparent)`,
            animation: 'shimmer 3s ease-in-out infinite',
          }} />
          <p style={{ color: c.textWeak, fontSize: '13px', fontWeight: '500' }}>
            URBAN STORE ✨
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
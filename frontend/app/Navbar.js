'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { c } from './lib/styles'

const NAV_LINKS = [
  { label: 'Inicio',    href: '/'        },
  { label: 'Catálogo',  href: '/catalog' },
]

export default function Navbar({ cartCount = 0 }) {
  const pathname   = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  // Sombra al hacer scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <nav style={{
        position:        'sticky',
        top:             0,
        zIndex:          200,
        backgroundColor: c.bgDark,
        height:          '64px',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'space-between',
        padding:         '0 32px',
        transition:      'box-shadow 0.25s',
        boxShadow:       scrolled
          ? '0 4px 24px rgba(0,0,0,0.45)'
          : '0 1px 0 rgba(255,255,255,0.06)',
      }}>

        {/* ── Logo ── */}
        <a href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <span style={{
            color:       '#F2EDE6',
            fontSize:    '18px',
            fontWeight:  '800',
            letterSpacing: '4px',
            lineHeight:  1,
          }}>
            URBAN
            <span style={{ color: c.primary }}>STORE</span>
          </span>
        </a>

        {/* ── Links centro — ocultos en móvil ── */}
        <div style={{
          display:    'flex',
          gap:        '8px',
          position:   'absolute',
          left:       '50%',
          transform:  'translateX(-50%)',
        }}
          className="nav-links-desktop"
        >
          {NAV_LINKS.map(({ label, href }) => {
            const active = pathname === href
            return (
              <a key={href} href={href} style={{
                color:          active ? c.primary : 'rgba(242,237,230,0.55)',
                fontSize:       '13px',
                fontWeight:     active ? '700' : '400',
                textDecoration: 'none',
                letterSpacing:  '0.5px',
                padding:        '6px 14px',
                borderRadius:   '8px',
                transition:     'all 0.15s',
                backgroundColor: active ? 'rgba(192,154,58,0.12)' : 'transparent',
                borderBottom:   active ? `2px solid ${c.primary}` : '2px solid transparent',
              }}>
                {label}
              </a>
            )
          })}
        </div>

        {/* ── Acciones derecha ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>

          {/* Carrito */}
          <a href="/cart" style={{
            position:       'relative',
            textDecoration: 'none',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            width:          '40px',
            height:         '40px',
            borderRadius:   '10px',
            backgroundColor: 'rgba(242,237,230,0.07)',
            border:         '1px solid rgba(242,237,230,0.1)',
            transition:     'background-color 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(192,154,58,0.15)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(242,237,230,0.07)'}
          >
            {/* Ícono carrito SVG */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="#F2EDE6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>

            {/* Badge contador */}
            {cartCount > 0 && (
              <span style={{
                position:        'absolute',
                top:             '-6px',
                right:           '-6px',
                backgroundColor: c.primary,
                color:           c.bgDark,
                fontSize:        '10px',
                fontWeight:      '800',
                width:           '18px',
                height:          '18px',
                borderRadius:    '50%',
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
                border:          `2px solid ${c.bgDark}`,
              }}>
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </a>

          {/* Mi cuenta */}
          <a href="/login" style={{
            backgroundColor: c.primary,
            color:           c.bgDark,
            fontSize:        '12px',
            fontWeight:      '700',
            padding:         '10px 20px',
            borderRadius:    '8px',
            textDecoration:  'none',
            letterSpacing:   '1px',
            textTransform:   'uppercase',
            transition:      'background-color 0.2s, transform 0.15s',
            whiteSpace:      'nowrap',
          }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = c.primaryHover
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = c.primary
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            Mi cuenta
          </a>

          {/* Hamburger — solo móvil */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              display:         'none',
              background:      'none',
              border:          'none',
              cursor:          'pointer',
              padding:         '6px',
              color:           '#F2EDE6',
            }}
            className="nav-hamburger"
            aria-label="Menú"
          >
            {menuOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            )}
          </button>

        </div>
      </nav>

      {/* ── Menú móvil desplegable ── */}
      {menuOpen && (
        <div style={{
          position:        'fixed',
          top:             '64px',
          left:            0,
          right:           0,
          zIndex:          199,
          backgroundColor: c.bgDark,
          borderTop:       '1px solid rgba(255,255,255,0.08)',
          padding:         '16px 24px 24px',
          boxShadow:       '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          {NAV_LINKS.map(({ label, href }) => (
            <a key={href} href={href} style={{
              display:        'block',
              color:          pathname === href ? c.primary : '#F2EDE6',
              fontSize:       '15px',
              fontWeight:     pathname === href ? '700' : '400',
              textDecoration: 'none',
              padding:        '14px 0',
              borderBottom:   '1px solid rgba(255,255,255,0.06)',
            }}>
              {label}
            </a>
          ))}
        </div>
      )}

      {/* ── Estilos responsive ── */}
      <style>{`
        @media (max-width: 640px) {
          .nav-links-desktop { display: none !important; }
          .nav-hamburger     { display: flex !important; }
        }
      `}</style>
    </>
  )
}
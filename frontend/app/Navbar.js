'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useCartStore } from '../lib/cartStore'
import { c } from '../lib/styles'

export default function NavBar() {
  const router = useRouter()
  const pathname = usePathname()
  const { itemCount, fetchCart } = useCartStore()

  // Estados
  const [loggedIn, setLoggedIn] = useState(false)
  const [userName, setUserName] = useState('')
  const [userInitial, setUserInitial] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const dropdownRef = useRef(null)

  // Cargar datos del usuario
  const loadUserFromStorage = () => {
    const token = localStorage.getItem('access')
    if (!token) {
      setLoggedIn(false)
      setUserName('')
      setUserInitial('')
      setIsAdmin(false)
      return
    }
    setLoggedIn(true)
    const userRaw = localStorage.getItem('user')
    let name = 'Usuario'
    if (userRaw) {
      try {
        const user = JSON.parse(userRaw)
        name = user.name || user.email || 'Usuario'
      } catch { name = 'Usuario' }
    }
    setUserName(name)
    setUserInitial(name.charAt(0).toUpperCase())
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      setIsAdmin(payload.is_admin || false)
    } catch { setIsAdmin(false) }
  }

  // Efectos iniciales
  useEffect(() => {
    loadUserFromStorage()
    fetchCart()
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    window.addEventListener('userUpdated', loadUserFromStorage)
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMobileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('userUpdated', loadUserFromStorage)
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    localStorage.removeItem('user')
    document.cookie = 'access=; path=/; max-age=0'
    setLoggedIn(false)
    setUserName('')
    setUserInitial('')
    setIsAdmin(false)
    setMobileMenuOpen(false)
    router.push('/login')
  }

  // Estilos base
  const navStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    padding: '0 24px',
    height: 'clamp(60px, 10vw, 80px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: scrolled ? 'rgba(13,13,13,0.8)' : 'rgba(13,13,13,0.4)',
    backdropFilter: 'blur(16px)',
    borderBottom: scrolled ? '1px solid rgba(184,134,11,0.3)' : '1px solid transparent',
    transition: 'all 0.3s ease',
    boxShadow: scrolled ? '0 8px 32px rgba(0,0,0,0.3)' : 'none',
  }

  // Logo (centrado en móvil, izquierda en escritorio)
  const logoStyle = {
    fontSize: 'clamp(22px, 5vw, 28px)',
    fontWeight: '900',
    letterSpacing: '4px',
    background: `linear-gradient(135deg, #FFF 0%, ${c.primary} 50%, #FFF 100%)`,
    backgroundSize: '200% auto',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    animation: 'gradientShift 4s linear infinite',
    textDecoration: 'none',
    filter: 'drop-shadow(0 0 15px rgba(184,134,11,0.5))',
    position: isMobile ? 'absolute' : 'static',
    left: isMobile ? '50%' : 'auto',
    transform: isMobile ? 'translateX(-50%)' : 'none',
  }

  // Iconos de acción
  const iconButtonStyle = {
    background: 'transparent',
    border: 'none',
    color: c.textMain,
    fontSize: '24px',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    backdropFilter: 'blur(4px)',
  }

  // Avatar
  const avatarStyle = {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${c.primary} 0%, #D4A017 100%)`,
    color: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '18px',
    boxShadow: '0 4px 12px rgba(184,134,11,0.4)',
    cursor: 'pointer',
  }

  return (
    <>
      <nav style={navStyle}>
        {/* Espacio izquierdo (menú hamburguesa en escritorio) */}
        <div style={{ width: '40px' }}>
          {!isMobile && (
            <button
              style={iconButtonStyle}
              onClick={() => setMobileMenuOpen(true)}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(184,134,11,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              ☰
            </button>
          )}
        </div>

        {/* Logo centrado (móvil) / izquierda (escritorio) */}
        <Link href="/" style={logoStyle}>
          URBAN
        </Link>

        {/* Acciones derechas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {loggedIn ? (
            <>
              {/* Carrito */}
              <Link href="/carrito" style={{ position: 'relative', textDecoration: 'none' }}>
                <button style={iconButtonStyle}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(184,134,11,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  🛒
                </button>
                {itemCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '-4px', right: '-4px',
                    background: c.primary, color: '#000', fontSize: '12px', fontWeight: 'bold',
                    padding: '2px 6px', borderRadius: '12px',
                  }}>{itemCount}</span>
                )}
              </Link>

              {/* Avatar (abre menú lateral) */}
              <button
                style={{ ...iconButtonStyle, padding: 0 }}
                onClick={() => setMobileMenuOpen(true)}
              >
                <div style={avatarStyle}>{userInitial}</div>
              </button>
            </>
          ) : (
            <>
              <Link href="/login">
                <button style={iconButtonStyle}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(184,134,11,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  👤
                </button>
              </Link>
              <Link href="/register">
                <button style={{
                  ...iconButtonStyle,
                  background: c.primary,
                  color: '#000',
                  borderRadius: '30px',
                  padding: '8px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  width: 'auto',
                }}>
                  Registrarse
                </button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* MENÚ LATERAL (DRAWER) - UNIFICADO */}
      {mobileMenuOpen && (
        <>
          <div
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(8px)', zIndex: 200,
            }}
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed', top: 0, right: 0, width: 'min(320px, 85vw)', height: '100%',
              background: 'rgba(20,20,20,0.95)', backdropFilter: 'blur(24px)',
              borderLeft: '1px solid rgba(184,134,11,0.3)', zIndex: 201,
              padding: '28px 20px', display: 'flex', flexDirection: 'column', gap: '24px',
              boxShadow: '-20px 0 40px rgba(0,0,0,0.5)',
            }}
          >
            {/* Cabecera del menú */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '22px', fontWeight: '700', color: c.primary }}>MENÚ</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                style={{ background: 'none', border: 'none', color: c.textSub, fontSize: '28px', cursor: 'pointer' }}
              >✕</button>
            </div>

            {/* Avatar y nombre (si logueado) */}
            {loggedIn && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '16px', borderBottom: `1px solid ${c.border}` }}>
                <div style={avatarStyle}>{userInitial}</div>
                <span style={{ color: c.textMain, fontSize: '18px', fontWeight: '600' }}>{userName}</span>
              </div>
            )}

            {/* Enlaces principales */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link href="/catalog" onClick={() => setMobileMenuOpen(false)}
                style={{ padding: '14px 16px', color: pathname.startsWith('/catalog') ? c.primary : c.textMain,
                  textDecoration: 'none', fontSize: '18px', fontWeight: '500', borderRadius: '16px',
                  background: pathname.startsWith('/catalog') ? 'rgba(184,134,11,0.1)' : 'transparent' }}>
                🛍️ Catálogo
              </Link>
              {isAdmin && (
                <Link href="/admin" onClick={() => setMobileMenuOpen(false)}
                  style={{ padding: '14px 16px', color: pathname === '/admin' ? c.primary : c.textMain,
                    textDecoration: 'none', fontSize: '18px', fontWeight: '500', borderRadius: '16px',
                    background: pathname === '/admin' ? 'rgba(184,134,11,0.1)' : 'transparent' }}>
                  📊 Admin
                </Link>
              )}
              {loggedIn && (
                <Link href="/perfil" onClick={() => setMobileMenuOpen(false)}
                  style={{ padding: '14px 16px', color: pathname === '/perfil' ? c.primary : c.textMain,
                    textDecoration: 'none', fontSize: '18px', fontWeight: '500', borderRadius: '16px',
                    background: pathname === '/perfil' ? 'rgba(184,134,11,0.1)' : 'transparent' }}>
                  👤 Mi Perfil
                </Link>
              )}
            </nav>

            {/* Footer del menú */}
            <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: `1px solid ${c.border}` }}>
              {loggedIn ? (
                <button onClick={handleLogout}
                  style={{ width: '100%', padding: '14px', background: 'transparent', border: `1px solid ${c.error}`,
                    borderRadius: '40px', color: c.error, fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}>
                  🚪 Cerrar sesión
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}
                    style={{ display: 'block', textAlign: 'center', padding: '14px', background: 'transparent',
                      border: `1px solid ${c.primary}`, borderRadius: '40px', color: c.primary, textDecoration: 'none', fontWeight: '600' }}>
                    Iniciar sesión
                  </Link>
                  <Link href="/register" onClick={() => setMobileMenuOpen(false)}
                    style={{ display: 'block', textAlign: 'center', padding: '14px',
                      background: `linear-gradient(135deg, ${c.primary} 0%, #D4A017 100%)`,
                      border: 'none', borderRadius: '40px', color: '#000', textDecoration: 'none', fontWeight: '600' }}>
                    Registrarse
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Animación del gradiente */}
      <style jsx global>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
    </>
  )
}
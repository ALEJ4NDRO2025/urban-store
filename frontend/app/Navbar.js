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

  const [loggedIn, setLoggedIn] = useState(false)
  const [userName, setUserName] = useState('')
  const [userInitial, setUserInitial] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Estados para responsive
  const [isMobile, setIsMobile] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // ═══════════════════════════════════════════════════════════════════════════
  // Cargar datos del usuario desde localStorage
  // ═══════════════════════════════════════════════════════════════════════════
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
      } catch {
        name = 'Usuario'
      }
    }
    setUserName(name)
    setUserInitial(name.charAt(0).toUpperCase())

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      setIsAdmin(payload.is_admin || false)
    } catch {
      setIsAdmin(false)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Efecto inicial y listeners
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    loadUserFromStorage()
    fetchCart()

    // Detectar si es móvil
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)

    const handleUserUpdate = () => loadUserFromStorage()
    window.addEventListener('userUpdated', handleUserUpdate)

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('userUpdated', handleUserUpdate)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // ═══════════════════════════════════════════════════════════════════════════
  // Cerrar sesión
  // ═══════════════════════════════════════════════════════════════════════════
  const handleLogout = () => {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    localStorage.removeItem('user')
    document.cookie = 'access=; path=/; max-age=0'
    setLoggedIn(false)
    setUserName('')
    setUserInitial('')
    setIsAdmin(false)
    setDropdownOpen(false)
    setMobileMenuOpen(false)
    router.push('/login')
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Estilos
  // ═══════════════════════════════════════════════════════════════════════════
  const navStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 24px',
    height: '70px',
    backgroundColor: c.card,
    borderBottom: `1px solid ${c.border}`,
    position: 'sticky',
    top: 0,
    zIndex: 100,
  }

  const linkStyle = {
    color: c.textSub,
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    padding: '8px 12px',
    borderRadius: '6px',
    transition: 'all 0.2s',
  }

  const activeLinkStyle = {
    ...linkStyle,
    color: c.primary,
    backgroundColor: 'rgba(184,134,11,0.1)',
  }

  const avatarStyle = {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: c.primary,
    color: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <>
      <nav style={navStyle}>
        {/* Logo */}
        <Link href="/" style={{ fontSize: '24px', fontWeight: '800', color: c.primary, textDecoration: 'none' }}>
          URBAN
        </Link>

        {/* Menú central (solo visible en escritorio) */}
        {!isMobile && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href="/catalog" style={pathname.startsWith('/catalog') ? activeLinkStyle : linkStyle}>
              Catálogo
            </Link>
            {isAdmin && (
              <Link href="/admin" style={pathname === '/admin' ? activeLinkStyle : linkStyle}>
                Admin
              </Link>
            )}
          </div>
        )}

        {/* Lado derecho */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {loggedIn ? (
            <>
              {/* Carrito */}
              <Link href="/carrito" style={{ position: 'relative', color: c.textMain, textDecoration: 'none' }}>
                🛒
                {itemCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-12px',
                    backgroundColor: c.primary,
                    color: '#000',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    padding: '2px 6px',
                    borderRadius: '12px',
                  }}>
                    {itemCount}
                  </span>
                )}
              </Link>

              {!isMobile ? (
                /* Escritorio: Avatar + Dropdown */
                <div style={{ position: 'relative' }} ref={dropdownRef}>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    <div style={avatarStyle}>{userInitial}</div>
                    <span style={{ color: c.textMain, fontSize: '14px', fontWeight: '500' }}>
                      {userName.split(' ')[0]}
                    </span>
                    <span style={{ color: c.textSub, fontSize: '12px' }}>▼</span>
                  </div>

                  {dropdownOpen && (
                    <div style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      backgroundColor: c.card,
                      border: `1px solid ${c.border}`,
                      borderRadius: '8px',
                      minWidth: '160px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      zIndex: 200,
                      overflow: 'hidden',
                    }}>
                      <Link
                        href="/perfil"
                        onClick={() => setDropdownOpen(false)}
                        style={{
                          display: 'block',
                          padding: '12px 16px',
                          color: c.textMain,
                          textDecoration: 'none',
                          fontSize: '14px',
                          transition: 'background 0.2s',
                          borderBottom: `1px solid ${c.border}`,
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = c.bgDark}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        👤 Mi Perfil
                      </Link>
                      <button
                        onClick={handleLogout}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          padding: '12px 16px',
                          background: 'none',
                          border: 'none',
                          color: c.error,
                          fontSize: '14px',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = c.bgDark}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        🚪 Cerrar sesión
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Móvil: Botón hamburguesa */
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: c.textMain,
                    fontSize: '24px',
                    cursor: 'pointer',
                    padding: '8px',
                  }}
                >
                  ☰
                </button>
              )}
            </>
          ) : (
            <>
              <Link href="/login" style={linkStyle}>Iniciar sesión</Link>
              <Link href="/register" style={{
                ...linkStyle,
                backgroundColor: c.primary,
                color: '#000',
                padding: '8px 16px',
              }}>
                Registrarse
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Menú lateral móvil */}
      {isMobile && mobileMenuOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 300,
            }}
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: '250px',
              height: '100%',
              backgroundColor: c.card,
              zIndex: 301,
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <button
              onClick={() => setMobileMenuOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: c.textMain,
                fontSize: '24px',
                cursor: 'pointer',
                alignSelf: 'flex-end',
              }}
            >
              ✕
            </button>
            <Link
              href="/catalog"
              onClick={() => setMobileMenuOpen(false)}
              style={{ color: c.textMain, textDecoration: 'none', fontSize: '18px' }}
            >
              Catálogo
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                style={{ color: c.textMain, textDecoration: 'none', fontSize: '18px' }}
              >
                Admin
              </Link>
            )}
            <Link
              href="/perfil"
              onClick={() => setMobileMenuOpen(false)}
              style={{ color: c.textMain, textDecoration: 'none', fontSize: '18px' }}
            >
              Mi Perfil
            </Link>
            <button
              onClick={handleLogout}
              style={{
                background: 'none',
                border: 'none',
                color: c.error,
                fontSize: '18px',
                textAlign: 'left',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Cerrar sesión
            </button>
          </div>
        </>
      )}
    </>
  )
}
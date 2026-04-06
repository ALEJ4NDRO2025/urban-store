'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { styles, c } from '../lib/styles'
import { useCartStore } from '../lib/cartStore'

export default function Navbar() {
  const pathname  = usePathname()
  const [loggedIn, setLoggedIn] = useState(false)
  const [email, setEmail]       = useState('')
  const [hovering, setHovering] = useState(null)

  const itemCount  = useCartStore((state) => state.itemCount)
  const fetchCart  = useCartStore((state) => state.fetchCart)

  useEffect(() => {
    const token = localStorage.getItem('access')
    if (token) {
      setLoggedIn(true)
      // ✅ Carga el carrito al montar — así el badge aparece en todas las páginas
      fetchCart()
      const userData = localStorage.getItem('user')
      if (userData) {
        try { setEmail(JSON.parse(userData).email || '') } catch {}
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  const links = [
    { href: '/', label: 'Inicio' },
    { href: '/catalog', label: 'Catálogo' },
  ]

  return (
    <nav style={styles.navbar}>

      <Link href="/" style={{ textDecoration: 'none' }}>
        <span style={{ fontSize: '20px', fontWeight: '800', color: c.primary, letterSpacing: '2px', textTransform: 'uppercase' }}>
          Urban<span style={{ color: c.textMain }}>Store</span>
        </span>
      </Link>

      <div style={{ display: 'flex', gap: '8px' }}>
        {links.map((link) => (
          <Link key={link.href} href={link.href}
            style={styles.navLink(pathname === link.href, hovering === link.href)}
            onMouseEnter={() => setHovering(link.href)}
            onMouseLeave={() => setHovering(null)}>
            {link.label}
          </Link>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        {loggedIn ? (
          <>
            {/* 🛒 Carrito con badge */}
            <Link href="/carrito" style={{ textDecoration: 'none', position: 'relative', display: 'inline-block' }}>
              <span
                style={{ fontSize: '22px', cursor: 'pointer', color: hovering === 'carrito' ? c.primary : c.textMain, transition: 'color 0.2s' }}
                onMouseEnter={() => setHovering('carrito')}
                onMouseLeave={() => setHovering(null)}
              >🛒</span>
              {itemCount > 0 && (
                <span style={{ position: 'absolute', top: '-8px', right: '-8px', backgroundColor: c.primary, color: '#000', borderRadius: '50%', width: '18px', height: '18px', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>

            {/* Perfil */}
            <Link href="/perfil"
              style={{ ...styles.navLink(pathname === '/perfil', hovering === 'perfil'), padding: '8px 16px' }}
              onMouseEnter={() => setHovering('perfil')}
              onMouseLeave={() => setHovering(null)}>
              {email ? email.split('@')[0] : 'Mi perfil'}
            </Link>

            {/* Salir */}
            <button onClick={handleLogout}
              style={{ ...styles.buttonSmall(false, hovering === 'logout'), width: 'auto' }}
              onMouseEnter={() => setHovering('logout')}
              onMouseLeave={() => setHovering(null)}>
              Salir
            </button>
          </>
        ) : (
          <>
            <Link href="/login"
              style={{ ...styles.navLink(false, hovering === 'login'), padding: '8px 16px' }}
              onMouseEnter={() => setHovering('login')}
              onMouseLeave={() => setHovering(null)}>
              Login
            </Link>
            <Link href="/register"
              style={{ ...styles.buttonSmall(false, hovering === 'register'), width: 'auto', textDecoration: 'none', display: 'inline-block' }}
              onMouseEnter={() => setHovering('register')}
              onMouseLeave={() => setHovering(null)}>
              Registro
            </Link>
          </>
        )}
      </div>

    </nav>
  )
}
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { styles, c } from '../lib/styles'
import { href } from 'react-router-dom'

export default function Navbar() {
  const pathname = usePathname()
  const [user, setUser] = useState(null)
  const [hovering, setHovering] = useState(null) // guarda qué link está en hover

  // Leer el usuario del token guardado en localStorage
  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (token && userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    window.location.href = '/login'
  }

  const links = [
    { href: '/', label: 'Inicio' },
    { href: '/catalog', label: 'Catálogo' },
    
  ]

  return (
    <nav style={styles.navbar}>
      
      {/* Logo */}
      <Link href="/" style={{ textDecoration: 'none' }}>
        <span style={{
          fontSize: '20px',
          fontWeight: '800',
          color: c.primary,          // dorado
          letterSpacing: '2px',
          textTransform: 'uppercase',
        }}>
          Urban<span style={{ color: c.textMain }}>Store</span>
        </span>
      </Link>

      {/* Links del centro */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            style={styles.navLink(
              pathname === link.href,   // active si estamos en esa ruta
              hovering === link.href    // hover
            )}
            onMouseEnter={() => setHovering(link.href)}
            onMouseLeave={() => setHovering(null)}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Derecha: usuario o botones login/register */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        {user ? (
          // Usuario logueado → mostrar email y cerrar sesión
          <>
            <span style={{ color: c.textSub, fontSize: '13px' }}>
              {user.email}
            </span>
            <button
              onClick={handleLogout}
              style={{
                ...styles.buttonSmall(false, hovering === 'logout'),
                width: 'auto',
              }}
              onMouseEnter={() => setHovering('logout')}
              onMouseLeave={() => setHovering(null)}
            >
              Salir
            </button>
          </>
        ) : (
          // Sin sesión → botones login y register
          <>
            <Link
              href="/login"
              style={{
                ...styles.navLink(false, hovering === 'login'),
                padding: '8px 16px',
              }}
              onMouseEnter={() => setHovering('login')}
              onMouseLeave={() => setHovering(null)}
            >
              Login
            </Link>
            <Link
              href="/register"
              style={{
                ...styles.buttonSmall(false, hovering === 'register'),
                width: 'auto',
                textDecoration: 'none',
                display: 'inline-block',
              }}
              onMouseEnter={() => setHovering('register')}
              onMouseLeave={() => setHovering(null)}
            >
              Registro
            </Link>
          </>
        )}
      </div>

    </nav>
  )
}
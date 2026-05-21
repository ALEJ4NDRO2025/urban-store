'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useCartStore } from '../lib/cartStore';
import { c, withAlpha } from '../lib/styles';

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();

  // ─── Estados ───────────────────────────────────────
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userInitial, setUserInitial] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const userMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // ─── Carrito ───────────────────────────────────────
  const items = useCartStore((state) => state.items);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // ─── Cargar usuario ────────────────────────────────
  const loadUserFromStorage = () => {
    const token = localStorage.getItem('access');
    if (!token) {
      setLoggedIn(false);
      setUserName('');
      setUserInitial('');
      setIsAdmin(false);
      return;
    }
    setLoggedIn(true);
    const userRaw = localStorage.getItem('user');
    let name = 'Usuario';
    if (userRaw) {
      try {
        const user = JSON.parse(userRaw);
        name = user.name || user.email || 'Usuario';
      } catch {
        name = 'Usuario';
      }
    }
    setUserName(name);
    setUserInitial(name.charAt(0).toUpperCase());
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setIsAdmin(payload.is_admin || false);
    } catch {
      setIsAdmin(false);
    }
  };

  // ─── Efectos iniciales ─────────────────────────────
  useEffect(() => {
    loadUserFromStorage();

    // Carga futura desde backend (opcional)
    // const loadCartFromBackend = async () => { ... };
    // loadCartFromBackend();

    const handleScroll = () => setScrolled(window.scrollY > 20);
    const handleUserUpdate = () => loadUserFromStorage();
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('userUpdated', handleUserUpdate);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('userUpdated', handleUserUpdate);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // ─── Cerrar sesión ─────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');
    document.cookie = 'access=; path=/; max-age=0';
    setLoggedIn(false);
    setUserName('');
    setUserInitial('');
    setIsAdmin(false);
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
    router.push('/login');
  };

  // ─── Estilos reutilizables ─────────────────────────
  const navStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    height: 'clamp(64px, 10vw, 80px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 clamp(16px, 4vw, 40px)',
    background: scrolled
      ? 'rgba(10, 10, 10, 0.8)'
      : 'rgba(10, 10, 10, 0.4)',
    backdropFilter: 'blur(20px)',
    borderBottom: scrolled
      ? `1px solid ${withAlpha(c.primary, 0.3)}`
      : '1px solid transparent',
    transition: 'background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease',
    boxShadow: scrolled
      ? '0 8px 32px rgba(0,0,0,0.5)'
      : 'none',
  };

  const logoStyle = {
    fontSize: 'clamp(24px, 6vw, 32px)',
    fontWeight: '900',
    letterSpacing: '5px',
    background: `linear-gradient(135deg, #FFFFFF 0%, ${c.primary} 40%, #FFFFFF 100%)`,
    backgroundSize: '200% auto',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    animation: 'gradientShift 4s linear infinite',
    textDecoration: 'none',
    filter: 'drop-shadow(0 0 10px rgba(184,134,11,0.5))',
    cursor: 'pointer',
  };

  const underlineStyle = (active) => ({
    position: 'absolute',
    bottom: 0,
    left: '50%',
    transform: active ? 'translateX(-50%) scaleX(1)' : 'translateX(-50%) scaleX(0)',
    width: '100%',
    height: '2px',
    background: c.primary,
    borderRadius: '2px',
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: active ? `0 0 8px ${c.primary}` : 'none',
  });

  const iconButton = (extra = {}) => ({
    background: 'transparent',
    border: 'none',
    color: c.textMain,
    fontSize: '20px',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.25s',
    backdropFilter: 'blur(4px)',
    ...extra,
  });

  const avatarCircle = {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${c.primary} 0%, #D4A017 100%)`,
    color: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '16px',
    boxShadow: '0 4px 12px rgba(184,134,11,0.3)',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  };

  const badgeStyle = {
    position: 'absolute',
    top: '-2px',
    right: '-2px',
    background: c.primary,
    color: '#000',
    fontSize: '11px',
    fontWeight: 'bold',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(184,134,11,0.6)',
    transform: itemCount > 0 ? 'scale(1)' : 'scale(0)',
    transition: 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  };

  const navLink = (path, label) => (
    <Link
      href={path}
      style={{
        color: pathname === path ? c.primary : c.textSub,
        textDecoration: 'none',
        fontSize: '15px',
        fontWeight: '600',
        padding: '8px 0',
        margin: '0 16px',
        position: 'relative',
        transition: 'color 0.3s',
        letterSpacing: '0.5px',
      }}
      onMouseEnter={(e) => {
        if (pathname !== path) e.currentTarget.style.color = c.primary;
      }}
      onMouseLeave={(e) => {
        if (pathname !== path) e.currentTarget.style.color = c.textSub;
      }}
    >
      {label}
      <span style={underlineStyle(pathname === path)} />
    </Link>
  );

  // ─── Render ────────────────────────────────────────
  return (
    <>
      <nav style={navStyle}>
        {/* Logo + enlaces de escritorio */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(24px, 8vw, 64px)' }}>
          <Link href="/" style={logoStyle}>
            URBAN
          </Link>
          <div className="desktop-only" style={{ display: 'flex', alignItems: 'center' }}>
            {navLink('/catalog', 'Catálogo')}
            {isAdmin && navLink('/admin', 'Admin')}
            {loggedIn && navLink('/perfil', 'Mi Perfil')}
          </div>
        </div>

        {/* Acciones derechas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {loggedIn ? (
            <>
              {/* Carrito */}
              <Link href="/carrito" style={{ position: 'relative', textDecoration: 'none' }}>
                <button
                  style={iconButton()}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'rgba(184,134,11,0.1)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = 'transparent')
                  }
                  aria-label="Carrito"
                >
                  <span style={{ fontSize: '22px' }}>🛒</span>
                  <span style={badgeStyle}>{itemCount}</span>
                </button>
              </Link>

              {/* Avatar y dropdown */}
              <div ref={userMenuRef} style={{ position: 'relative' }}>
                <button
                  style={{ ...iconButton(), padding: 0 }}
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <div style={avatarCircle}>{userInitial}</div>
                </button>
                {userMenuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 14px)',
                      right: 0,
                      width: '220px',
                      background: 'rgba(16,16,16,0.95)',
                      backdropFilter: 'blur(24px)',
                      border: `1px solid ${c.border}`,
                      borderRadius: '22px',
                      padding: '8px',
                      boxShadow: '0 25px 45px rgba(0,0,0,0.7)',
                      animation: 'fadeInUp 0.2s ease-out',
                      transformOrigin: 'top right',
                      zIndex: 110,
                    }}
                  >
                    <div
                      style={{
                        padding: '14px 16px',
                        borderBottom: `1px solid ${c.border}`,
                        color: c.textMain,
                        fontSize: '15px',
                        fontWeight: '600',
                      }}
                    >
                      {userName}
                    </div>
                    <Link
                      href="/perfil"
                      onClick={() => setUserMenuOpen(false)}
                      style={{
                        display: 'block',
                        padding: '12px 16px',
                        color: c.textSub,
                        textDecoration: 'none',
                        borderRadius: '14px',
                        transition: 'background 0.2s, color 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(184,134,11,0.1)';
                        e.currentTarget.style.color = c.primary;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = c.textSub;
                      }}
                    >
                      👤 Mi Perfil
                    </Link>
                    <button
                      onClick={handleLogout}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'transparent',
                        border: 'none',
                        color: c.error,
                        textAlign: 'left',
                        cursor: 'pointer',
                        borderRadius: '14px',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = 'transparent')
                      }
                    >
                      🚪 Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login">
                <button
                  style={{
                    ...iconButton(),
                    fontSize: '14px',
                    fontWeight: '600',
                    padding: '8px 20px',
                    borderRadius: '30px',
                    width: 'auto',
                    border: `1px solid ${c.primary}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = c.primary;
                    e.currentTarget.style.color = '#000';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = c.primary;
                  }}
                >
                  Iniciar sesión
                </button>
              </Link>
              <Link href="/register">
                <button
                  style={{
                    background: c.primary,
                    color: '#000',
                    border: 'none',
                    borderRadius: '30px',
                    padding: '8px 20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    boxShadow: '0 4px 14px rgba(184,134,11,0.35)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow =
                      '0 8px 22px rgba(184,134,11,0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow =
                      '0 4px 14px rgba(184,134,11,0.35)';
                  }}
                >
                  Registrarse
                </button>
              </Link>
            </>
          )}

          {/* Hamburguesa (móvil) */}
          <button
            className="hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              ...iconButton(),
              display: 'none',
              marginLeft: '4px',
            }}
            aria-label="Menú"
          >
            <div style={{ width: '22px', height: '18px', position: 'relative' }}>
              <span
                className={`hamburger-line ${mobileMenuOpen ? 'open' : ''}`}
                style={{ top: 0 }}
              />
              <span
                className={`hamburger-line ${mobileMenuOpen ? 'open' : ''}`}
                style={{ top: '8px' }}
              />
              <span
                className={`hamburger-line ${mobileMenuOpen ? 'open' : ''}`}
                style={{ top: '16px' }}
              />
            </div>
          </button>
        </div>
      </nav>

      {/* Overlay y menú lateral móvil (sin cambios) */}
      {/* ... conserva el mismo código del overlay y drawer ... */}

      {/* Estilos globales */}
      <style jsx global>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .hamburger-line {
          position: absolute;
          left: 0;
          width: 100%;
          height: 2px;
          background-color: ${c.textMain};
          border-radius: 2px;
          transition: all 0.3s ease;
        }
        .hamburger-line.open:nth-child(1) {
          top: 8px;
          transform: rotate(45deg);
        }
        .hamburger-line.open:nth-child(2) {
          opacity: 0;
        }
        .hamburger-line.open:nth-child(3) {
          top: 8px;
          transform: rotate(-45deg);
        }
        @media (max-width: 768px) {
          .desktop-only { display: none !important; }
          .hamburger-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}
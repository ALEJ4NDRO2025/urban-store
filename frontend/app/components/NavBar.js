'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useCartStore } from '../lib/cartStore';
import { c, withAlpha } from '../lib/styles';

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();

  // ─── Estados locales ──────────────────────────────
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userInitial, setUserInitial] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const userMenuRef = useRef(null);
  const searchInputRef = useRef(null);

  // ─── Carrito desde Zustand ────────────────────────
  const items = useCartStore((state) => state.items);
  const fetchCart = useCartStore((state) => state.fetchCart);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // ─── Cargar datos del usuario ─────────────────────
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

  // ─── Efectos iniciales ────────────────────────────
  useEffect(() => {
    loadUserFromStorage();
    fetchCart();

    const handleScroll = () => setScrolled(window.scrollY > 20);
    const handleUserUpdate = () => loadUserFromStorage();
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (searchOpen && searchInputRef.current && !searchInputRef.current.contains(e.target)) {
        setSearchOpen(false);
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
  }, [searchOpen]);

  // ─── Handlers ──────────────────────────────────────
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

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/catalog?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchOpen(false);
      setSearchTerm('');
    }
  };

  // ─── Estilos dinámicos ────────────────────────────
  const navBackground = scrolled
    ? 'rgba(10, 10, 10, 0.8)'
    : 'rgba(10, 10, 10, 0.4)';

  const glassBorder = scrolled
    ? `1px solid ${withAlpha(c.primary, 0.25)}`
    : `1px solid ${withAlpha(c.primary, 0.1)}`;

  const logoTextStyle = {
    fontSize: 'clamp(26px, 7vw, 34px)',
    fontWeight: '900',
    letterSpacing: '6px',
    background: `linear-gradient(135deg, #FFFFFF 0%, ${c.primary} 40%, #FFFFFF 100%)`,
    backgroundSize: '200% auto',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    animation: 'gradientShift 4s linear infinite',
    textDecoration: 'none',
    filter: 'drop-shadow(0 0 10px rgba(184,134,11,0.5))',
    cursor: 'pointer',
  };

  const underlineAnimation = (isActive) => ({
    position: 'relative',
    color: isActive ? c.primary : c.textSub,
    textDecoration: 'none',
    fontSize: '15px',
    fontWeight: '600',
    padding: '8px 4px',
    margin: '0 14px',
    transition: 'color 0.3s',
    letterSpacing: '0.4px',
    whiteSpace: 'nowrap',
  });

  const Underline = ({ active }) => (
    <span
      style={{
        position: 'absolute',
        bottom: 0,
        left: '50%',
        transform: active ? 'translateX(-50%) scaleX(1)' : 'translateX(-50%) scaleX(0)',
        transformOrigin: 'center',
        width: '100%',
        height: '2px',
        background: c.primary,
        borderRadius: '2px',
        transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: active ? `0 0 8px ${c.primary}` : 'none',
      }}
    />
  );

  const iconButtonStyle = (extra = {}) => ({
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
    transition: 'all 0.3s',
    position: 'relative',
    ...extra,
  });

  const avatarStyle = {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${c.primary} 0%, #D4A017 100%)`,
    color: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '17px',
    boxShadow: '0 4px 14px rgba(184,134,11,0.35)',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  };

  const badgeAnimation = itemCount > 0 ? 'cartBounce 0.4s ease-out' : 'none';

  return (
    <>
      <nav
        style={{
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
          background: navBackground,
          backdropFilter: 'blur(18px)',
          borderBottom: glassBorder,
          transition: 'background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease',
          boxShadow: scrolled
            ? '0 8px 32px rgba(0,0,0,0.5)'
            : 'none',
        }}
      >
        {/* ─── Logo + Enlaces ────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(24px, 8vw, 64px)' }}>
          <Link href="/" style={logoTextStyle}>
            URBAN
          </Link>

          {/* Enlaces de escritorio */}
          <div className="desktop-only" style={{ display: 'flex', alignItems: 'center' }}>
            <Link href="/catalog" style={underlineAnimation(pathname.startsWith('/catalog'))}
              onMouseEnter={(e) => { if (!pathname.startsWith('/catalog')) e.currentTarget.style.color = c.primary; }}
              onMouseLeave={(e) => { if (!pathname.startsWith('/catalog')) e.currentTarget.style.color = c.textSub; }}>
              Catálogo
              <Underline active={pathname.startsWith('/catalog')} />
            </Link>
            {isAdmin && (
              <Link href="/admin" style={underlineAnimation(pathname === '/admin')}
                onMouseEnter={(e) => { if (pathname !== '/admin') e.currentTarget.style.color = c.primary; }}
                onMouseLeave={(e) => { if (pathname !== '/admin') e.currentTarget.style.color = c.textSub; }}>
                Admin
                <Underline active={pathname === '/admin'} />
              </Link>
            )}
            {loggedIn && (
              <Link href="/perfil" style={underlineAnimation(pathname === '/perfil')}
                onMouseEnter={(e) => { if (pathname !== '/perfil') e.currentTarget.style.color = c.primary; }}
                onMouseLeave={(e) => { if (pathname !== '/perfil') e.currentTarget.style.color = c.textSub; }}>
                Mi Perfil
                <Underline active={pathname === '/perfil'} />
              </Link>
            )}
          </div>
        </div>

        {/* ─── Acciones derechas ──────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Búsqueda (opcional, solo visual) */}
          <div ref={searchInputRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <button
              style={iconButtonStyle()}
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Buscar"
            >
              🔍
            </button>
            {searchOpen && (
              <form onSubmit={handleSearch} style={{ position: 'absolute', right: '40px', top: '50%', transform: 'translateY(-50%)', animation: 'fadeInLeft 0.2s ease-out' }}>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar..."
                  autoFocus
                  style={{
                    width: '200px',
                    padding: '10px 16px',
                    background: 'rgba(20,20,20,0.9)',
                    backdropFilter: 'blur(12px)',
                    border: `1px solid ${c.border}`,
                    borderRadius: '30px',
                    color: c.textMain,
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </form>
            )}
          </div>

          {loggedIn ? (
            <>
              {/* Carrito */}
              <Link href="/carrito" style={{ textDecoration: 'none' }}>
                <button
                  style={iconButtonStyle()}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(184,134,11,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  aria-label="Carrito"
                >
                  <span style={{ fontSize: '22px' }}>🛒</span>
                  <span
                    style={{
                      position: 'absolute',
                      top: '0px',
                      right: '0px',
                      background: c.primary,
                      color: '#000',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(184,134,11,0.7)',
                      transform: itemCount > 0 ? 'scale(1)' : 'scale(0)',
                      transition: 'transform 0.25s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                      animation: itemCount > 0 ? badgeAnimation : 'none',
                    }}
                  >
                    {itemCount}
                  </span>
                </button>
              </Link>

              {/* Avatar y dropdown */}
              <div ref={userMenuRef} style={{ position: 'relative' }}>
                <button
                  style={{ ...iconButtonStyle(), padding: 0 }}
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <div style={avatarStyle}>{userInitial}</div>
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
                    <div style={{ padding: '14px 16px', borderBottom: `1px solid ${c.border}`, color: c.textMain, fontSize: '15px', fontWeight: '600' }}>
                      {userName}
                    </div>
                    <Link href="/perfil"
                      onClick={() => setUserMenuOpen(false)}
                      style={{ display: 'block', padding: '12px 16px', color: c.textSub, textDecoration: 'none', borderRadius: '14px', transition: 'background 0.2s, color 0.2s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(184,134,11,0.1)'; e.currentTarget.style.color = c.primary; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = c.textSub; }}
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
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
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
                    ...iconButtonStyle(),
                    fontSize: '14px',
                    fontWeight: '600',
                    padding: '8px 20px',
                    borderRadius: '30px',
                    width: 'auto',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(184,134,11,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
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
                    e.currentTarget.style.boxShadow = '0 8px 22px rgba(184,134,11,0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(184,134,11,0.35)';
                  }}
                >
                  Registrarse
                </button>
              </Link>
            </>
          )}

          {/* ─── Hamburguesa móvil ──────────────────────── */}
          <button
            className="hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              ...iconButtonStyle(),
              display: 'none',
              marginLeft: '4px',
            }}
            aria-label="Menú"
          >
            <div style={{ width: '22px', height: '18px', position: 'relative' }}>
              <span className={`hamburger-line ${mobileMenuOpen ? 'open' : ''}`} style={{ top: 0 }} />
              <span className={`hamburger-line ${mobileMenuOpen ? 'open' : ''}`} style={{ top: '8px' }} />
              <span className={`hamburger-line ${mobileMenuOpen ? 'open' : ''}`} style={{ top: '16px' }} />
            </div>
          </button>
        </div>
      </nav>

      {/* Overlay móvil y menú lateral */}
      <div
        className={`mobile-overlay ${mobileMenuOpen ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          zIndex: 120,
          opacity: mobileMenuOpen ? 1 : 0,
          pointerEvents: mobileMenuOpen ? 'auto' : 'none',
          transition: 'opacity 0.35s ease',
        }}
      />

      <div
        className={`mobile-drawer ${mobileMenuOpen ? 'active' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 'min(320px, 85vw)',
          height: '100%',
          background: 'rgba(12,12,12,0.98)',
          backdropFilter: 'blur(30px)',
          borderLeft: `1px solid ${c.border}`,
          zIndex: 121,
          padding: '36px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '28px',
          transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.45s cubic-bezier(0.22, 0.61, 0.36, 1)',
          boxShadow: '-30px 0 50px rgba(0,0,0,0.7)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '26px', fontWeight: '800', color: c.primary }}>URBAN</span>
          <button
            onClick={() => setMobileMenuOpen(false)}
            style={{ background: 'none', border: 'none', color: c.textSub, fontSize: '26px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {loggedIn && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={avatarStyle}>{userInitial}</div>
            <span style={{ color: c.textMain, fontSize: '18px', fontWeight: '600' }}>{userName}</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link href="/catalog" onClick={() => setMobileMenuOpen(false)}
            style={{ padding: '14px 0', color: pathname.startsWith('/catalog') ? c.primary : c.textMain, textDecoration: 'none', fontSize: '18px', fontWeight: '500', borderBottom: `1px solid ${c.border}` }}>
            🛍️ Catálogo
          </Link>
          {isAdmin && (
            <Link href="/admin" onClick={() => setMobileMenuOpen(false)}
              style={{ padding: '14px 0', color: pathname === '/admin' ? c.primary : c.textMain, textDecoration: 'none', fontSize: '18px', fontWeight: '500', borderBottom: `1px solid ${c.border}` }}>
              📊 Admin
            </Link>
          )}
          {loggedIn && (
            <Link href="/perfil" onClick={() => setMobileMenuOpen(false)}
              style={{ padding: '14px 0', color: pathname === '/perfil' ? c.primary : c.textMain, textDecoration: 'none', fontSize: '18px', fontWeight: '500', borderBottom: `1px solid ${c.border}` }}>
              👤 Mi Perfil
            </Link>
          )}
        </div>

        <div style={{ marginTop: 'auto', borderTop: `1px solid ${c.border}`, paddingTop: '24px' }}>
          {loggedIn ? (
            <button onClick={handleLogout}
              style={{ width: '100%', padding: '14px', background: 'transparent', border: `1px solid ${c.error}`, borderRadius: '40px', color: c.error, fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}>
              Cerrar sesión
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}
                style={{ display: 'block', textAlign: 'center', padding: '14px', background: 'transparent', border: `1px solid ${c.primary}`, borderRadius: '40px', color: c.primary, textDecoration: 'none', fontWeight: '600' }}>
                Iniciar sesión
              </Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)}
                style={{ display: 'block', textAlign: 'center', padding: '14px', background: `linear-gradient(135deg, ${c.primary} 0%, #D4A017 100%)`, border: 'none', borderRadius: '40px', color: '#000', textDecoration: 'none', fontWeight: '600' }}>
                Registrarse
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Estilos globales críticos */}
      <style jsx global>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeInLeft {
          from { opacity: 0; transform: translateX(10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes cartBounce {
          0% { transform: scale(0); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); }
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
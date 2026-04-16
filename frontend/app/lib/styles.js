// ═══════════════════════════════════════════════════════════════════════════
// URBAN STORE — Golden Ash Design System (Glassmorphism Edition)
// Streetwear Premium, Minimalista, Oscuro, Vidrio Esmerilado
// Incluye animaciones globales y efectos interactivos
// ═══════════════════════════════════════════════════════════════════════════

export const c = {
  bg:           '#0D0D0D',      // Onyx Black — fondo principal
  bgDark:       '#1A1A1A',      // Gris muy oscuro — tarjetas, acentos oscuros
  card:         '#1A1A1A',      // Gris muy oscuro — tarjetas de producto
  input:        '#262626',      // Gris oscuro — inputs, textareas
  primary:      '#B8860B',      // Antique Gold — botones CTA principal
  primaryHover: '#D4A017',      // Gold hover — estado hover botones
  primaryActive: '#8B6914',     // Gold active — estado activo
  accent:       '#C0C0C0',      // Silver Ash — bordes, acentos, textos secundarios
  textMain:     '#FFFFFF',      // Pure White — títulos, texto principal
  textSub:      '#C0C0C0',      // Silver Ash — párrafos, labels, textos secundarios
  textWeak:     '#808080',      // Gris medio — placeholders, hints
  border:       '#333333',      // Concrete Grey — bordes normales
  borderDark:   '#4A4A4A',      // Gris más claro — bordes hover
  white:        '#FFFFFF',      // Pure White — utilidad
  
  // Utilidades
  success:      '#10B981',      // Verde
  warning:      '#F59E0B',      // Ámbar
  error:        '#EF4444',      // Rojo
}

// ─── ANIMACIONES CSS GLOBALES ───────────────────────────────────────────────
export const animations = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideInLeft {
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
  @keyframes shimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
  }
  @keyframes scaleUp {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  @keyframes goldGlow {
    0%, 100% { box-shadow: 0 0 10px rgba(184, 134, 11, 0.2); }
    50% { box-shadow: 0 0 20px rgba(184, 134, 11, 0.4); }
  }
  * {
    transition: color 0.25s ease-in-out, 
                background-color 0.25s ease-in-out,
                border-color 0.25s ease-in-out,
                box-shadow 0.25s ease-in-out,
                transform 0.25s ease-in-out;
  }
`

// ═══════════════════════════════════════════════════════════════════════════
// ESTILOS BASE (ahora con Glassmorphism)
// ═══════════════════════════════════════════════════════════════════════════
export const styles = {
  // ─── PAGE ────────────────────────────────────────────────────────────────
  page: {
    minHeight: '100vh',
    background: 'radial-gradient(circle at 30% 20%, #1a1a1a, #0D0D0D 80%)',
    color: c.textMain,
    padding: '0 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: 'fadeIn 0.5s ease-in-out',
  },
  pageSection: {
    minHeight: '100vh',
    background: 'radial-gradient(circle at 30% 20%, #1a1a1a, #0D0D0D 80%)',
    color: c.textMain,
    padding: '24px 16px',
    animation: 'fadeIn 0.5s ease-in-out',
  },

  // ─── CARD (Glassmorphism) ────────────────────────────────────────────────
  card: {
    backgroundColor: 'rgba(26, 26, 26, 0.5)',
    backdropFilter: 'blur(12px)',
    borderRadius: '24px',
    padding: '32px',
    border: '1px solid rgba(184, 134, 11, 0.15)',
    boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
    animation: 'fadeIn 0.5s ease-in-out',
  },
  cardHover: {
    backgroundColor: 'rgba(26, 26, 26, 0.7)',
    borderColor: 'rgba(184, 134, 11, 0.4)',
    boxShadow: '0 15px 30px rgba(0,0,0,0.5), 0 0 0 1px rgba(184,134,11,0.2)',
    transform: 'translateY(-6px)',
  },

  // ─── LABELS ──────────────────────────────────────────────────────────────
  label: {
    color: c.textSub,
    fontSize: '13px',
    marginBottom: '6px',
    display: 'block',
    fontWeight: '500',
    letterSpacing: '0.3px',
  },

  // ─── INPUTS (Glass) ──────────────────────────────────────────────────────
  input: {
    width: '100%',
    backgroundColor: 'rgba(38, 38, 38, 0.6)',
    backdropFilter: 'blur(8px)',
    color: c.textMain,
    border: `1px solid ${c.border}`,
    borderRadius: '14px',
    padding: '14px 16px',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  inputFocus: {
    borderColor: c.primary,
    boxShadow: `0 0 0 3px rgba(184, 134, 11, 0.2)`,
  },
  inputError: {
    borderColor: c.error,
    boxShadow: `0 0 0 3px rgba(239, 68, 68, 0.15)`,
  },
  textarea: {
    width: '100%',
    backgroundColor: 'rgba(38, 38, 38, 0.6)',
    backdropFilter: 'blur(8px)',
    color: c.textMain,
    border: `1px solid ${c.border}`,
    borderRadius: '14px',
    padding: '14px 16px',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    minHeight: '120px',
    resize: 'vertical',
  },

  // ─── BUTTONS (con sombras doradas) ───────────────────────────────────────
  button: (loading = false, hovering = false) => ({
    width: '100%',
    background: loading
      ? c.primaryActive
      : hovering
        ? 'linear-gradient(135deg, #D4A017 0%, #B8860B 100%)'
        : 'linear-gradient(135deg, #B8860B 0%, #D4A017 100%)',
    color: '#000',
    fontWeight: '700',
    padding: '16px',
    borderRadius: '40px',
    fontSize: '16px',
    border: 'none',
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.7 : 1,
    boxShadow: hovering
      ? '0 12px 28px rgba(184, 134, 11, 0.5)'
      : '0 8px 20px rgba(184, 134, 11, 0.3)',
    transform: hovering ? 'scale(1.02)' : 'scale(1)',
    transition: 'all 0.2s',
  }),
  buttonSecondary: (hovering = false) => ({
    width: '100%',
    backgroundColor: 'transparent',
    color: hovering ? '#000' : c.primary,
    fontWeight: '700',
    padding: '14px',
    border: `1px solid ${c.primary}`,
    borderRadius: '40px',
    fontSize: '16px',
    cursor: 'pointer',
    background: hovering ? c.primary : 'transparent',
    transition: 'all 0.3s',
  }),
  buttonSmall: (loading = false, hovering = false) => ({
    background: loading
      ? c.primaryActive
      : hovering
        ? 'linear-gradient(135deg, #D4A017 0%, #B8860B 100%)'
        : 'linear-gradient(135deg, #B8860B 0%, #D4A017 100%)',
    color: '#000',
    fontWeight: '600',
    padding: '10px 20px',
    borderRadius: '30px',
    fontSize: '14px',
    border: 'none',
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.7 : 1,
    boxShadow: hovering ? '0 0 15px rgba(184, 134, 11, 0.4)' : 'none',
    transform: hovering ? 'scale(1.02)' : 'scale(1)',
  }),

  // ─── ALERTS ──────────────────────────────────────────────────────────────
  error: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: `1px solid ${c.error}`,
    color: c.error,
    padding: '14px 18px',
    borderRadius: '16px',
    marginBottom: '24px',
    fontSize: '14px',
    fontWeight: '500',
    backdropFilter: 'blur(8px)',
  },
  success: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: `1px solid ${c.success}`,
    color: c.success,
    padding: '14px 18px',
    borderRadius: '16px',
    marginBottom: '24px',
    fontSize: '14px',
    backdropFilter: 'blur(8px)',
  },
  warning: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    border: `1px solid ${c.warning}`,
    color: c.warning,
    padding: '14px 18px',
    borderRadius: '16px',
    marginBottom: '24px',
    fontSize: '14px',
    backdropFilter: 'blur(8px)',
  },

  // ─── TYPOGRAPHY ──────────────────────────────────────────────────────────
  heading1: { fontSize: 'clamp(40px, 8vw, 72px)', fontWeight: '800', color: c.textMain, lineHeight: '1.1', marginBottom: '16px' },
  heading2: { fontSize: 'clamp(32px, 6vw, 48px)', fontWeight: '700', color: c.textMain, lineHeight: '1.2', marginBottom: '12px' },
  heading3: { fontSize: '24px', fontWeight: '700', color: c.textMain, lineHeight: '1.3', marginBottom: '8px' },
  body: { fontSize: '16px', color: c.textSub, lineHeight: '1.6' },
  bodySmall: { fontSize: '14px', color: c.textSub, lineHeight: '1.5' },

  // ─── GRIDS ───────────────────────────────────────────────────────────────
  gridContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px', marginTop: '32px' },
  gridContainerWide: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '32px', marginTop: '32px' },

  // ─── DIVIDER ─────────────────────────────────────────────────────────────
  divider: { height: '1px', backgroundColor: c.border, border: 'none', margin: '24px 0' },

  // ─── PRODUCT CARD (Glassmorphism + AOS) ──────────────────────────────────
  productCard: {
    backgroundColor: 'rgba(26, 26, 26, 0.5)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(184, 134, 11, 0.15)',
    borderRadius: '24px',
    overflow: 'hidden',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
    transition: 'transform 0.3s, box-shadow 0.3s, border-color 0.3s',
  },
  productCardHover: {
    transform: 'translateY(-8px)',
    boxShadow: '0 20px 30px rgba(0,0,0,0.5), 0 0 0 1px rgba(184,134,11,0.3)',
    borderColor: 'rgba(184, 134, 11, 0.4)',
  },
  productImage: { width: '100%', height: '280px', objectFit: 'cover', backgroundColor: c.bgDark, transition: 'transform 0.4s' },
  productImageHover: { transform: 'scale(1.08)' },
  productInfo: { padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  productName: { fontSize: '18px', fontWeight: '700', color: c.textMain, marginBottom: '8px', lineHeight: '1.3' },
  productPrice: { fontSize: '22px', fontWeight: '700', color: c.primary, marginBottom: '12px' },
  productCategory: { fontSize: '12px', fontWeight: '600', color: c.textWeak, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' },
  productStock: { fontSize: '13px', color: c.success, fontWeight: '500', marginBottom: '12px' },
  productButton: (hovering = false) => ({
    backgroundColor: hovering ? c.primaryHover : c.primary,
    color: '#000',
    fontWeight: '600',
    padding: '12px',
    borderRadius: '40px',
    fontSize: '14px',
    border: 'none',
    cursor: 'pointer',
    marginTop: '12px',
    boxShadow: hovering ? '0 0 15px rgba(184, 134, 11, 0.4)' : '0 4px 10px rgba(0,0,0,0.2)',
    transform: hovering ? 'scale(1.02)' : 'scale(1)',
  }),

  // ─── FILTER BUTTON ───────────────────────────────────────────────────────
  filterButton: (active = false, hovering = false) => ({
    padding: '10px 20px',
    backgroundColor: active ? c.primary : hovering ? 'rgba(26,26,26,0.8)' : 'transparent',
    color: active ? '#000' : hovering ? c.primary : c.textSub,
    border: `1px solid ${active ? c.primary : hovering ? c.primary : c.border}`,
    borderRadius: '30px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    backdropFilter: 'blur(8px)',
    boxShadow: active ? '0 0 15px rgba(184,134,11,0.3)' : 'none',
    transform: hovering ? 'translateY(-2px)' : 'translateY(0)',
  }),

  // ─── FORM GROUPS ─────────────────────────────────────────────────────────
  formGroup: { marginBottom: '24px' },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' },

  // ─── SKELETON ────────────────────────────────────────────────────────────
  skeleton: {
    backgroundColor: c.bgDark,
    borderRadius: '8px',
    animation: 'shimmer 2s infinite',
    backgroundImage: `linear-gradient(90deg, ${c.bgDark} 0%, ${c.card} 50%, ${c.bgDark} 100%)`,
    backgroundSize: '200% 100%',
  },

  // ─── NAVBAR (Glassmorphism + Blur al scroll) ─────────────────────────────
  navbar: {
    backgroundColor: 'rgba(26, 26, 26, 0.7)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(184, 134, 11, 0.2)',
    padding: '0 24px',
    height: '70px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    transition: 'background-color 0.3s, backdrop-filter 0.3s',
  },
  navLink: (active = false, hovering = false) => ({
    color: active ? c.primary : hovering ? c.primary : c.textSub,
    fontSize: '15px',
    fontWeight: '600',
    textDecoration: 'none',
    padding: '8px 16px',
    borderRadius: '30px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: active ? 'rgba(184,134,11,0.1)' : 'transparent',
  }),
}

// ═══════════════════════════════════════════════════════════════════════════
// NUEVOS ESTILOS GLASSMORPHISM (EXPORTADOS POR SEPARADO PARA MAYOR CONTROL)
// ═══════════════════════════════════════════════════════════════════════════
export const glass = {
  card: styles.card,
  cardHover: styles.cardHover,
  input: styles.input,
  inputFocus: styles.inputFocus,
}

// Helper para combinar estilos base + glass
export const glassStyle = (baseStyle, isHovered = false) => ({
  ...styles.card,
  ...baseStyle,
  ...(isHovered && styles.cardHover),
})

// ═══════════════════════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════════════════════
export const mergeStyles = (...styleObjects) => Object.assign({}, ...styleObjects)

export const withAlpha = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// Inyectar animaciones globales en el documento
if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style')
  styleTag.textContent = animations
  document.head.appendChild(styleTag)
}
// ═══════════════════════════════════════════════════════════════════════════
// URBAN STORE — Golden Ash Design System
// Streetwear Premium, Minimalista, Oscuro
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

// ─── ANIMACIONES CSS GLOBALES ───
export const animations = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }

  @keyframes shimmer {
    0% {
      background-position: -1000px 0;
    }
    100% {
      background-position: 1000px 0;
    }
  }

  @keyframes scaleUp {
    from {
      transform: scale(0.95);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  @keyframes goldGlow {
    0%, 100% {
      box-shadow: 0 0 10px rgba(184, 134, 11, 0.2);
    }
    50% {
      box-shadow: 0 0 20px rgba(184, 134, 11, 0.4);
    }
  }

  * {
    transition: color 0.25s ease-in-out, 
                background-color 0.25s ease-in-out,
                border-color 0.25s ease-in-out,
                box-shadow 0.25s ease-in-out,
                transform 0.25s ease-in-out;
  }
`

export const styles = {
  // ─── PAGE ───
  page: {
    minHeight: '100vh',
    backgroundColor: c.bg,
    color: c.textMain,
    padding: '0 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: 'fadeIn 0.5s ease-in-out',
  },

  pageSection: {
    minHeight: '100vh',
    backgroundColor: c.bg,
    color: c.textMain,
    padding: '24px 16px',
    animation: 'fadeIn 0.5s ease-in-out',
  },

  // ─── CARD ───
  card: {
    backgroundColor: c.card,
    borderRadius: '8px',
    padding: '32px',
    border: `1.5px solid ${c.border}`,
    boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
    animation: 'fadeIn 0.5s ease-in-out',
  },

  cardHover: {
    backgroundColor: c.bgDark,
    borderColor: c.accent,
    boxShadow: '0 8px 32px rgba(184,134,11,0.15)',
    transform: 'translateY(-4px)',
  },

  // ─── LABELS ───
  label: {
    color: c.textSub,
    fontSize: '12px',
    marginBottom: '6px',
    display: 'block',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    fontWeight: '600',
  },

  // ─── INPUTS ───
  input: {
    width: '100%',
    backgroundColor: c.input,
    color: c.textMain,
    border: `1.5px solid ${c.border}`,
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },

  inputFocus: {
    borderColor: c.primary,
    boxShadow: `0 0 0 3px rgba(184, 134, 11, 0.1)`,
    backgroundColor: c.input,
  },

  inputError: {
    borderColor: c.error,
    boxShadow: `0 0 0 3px rgba(239, 68, 68, 0.1)`,
  },

  textarea: {
    width: '100%',
    backgroundColor: c.input,
    color: c.textMain,
    border: `1.5px solid ${c.border}`,
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    minHeight: '120px',
    resize: 'vertical',
  },

  // ─── BUTTONS ───
  button: (loading = false, hovering = false) => ({
    width: '100%',
    backgroundColor: loading 
      ? c.primaryActive 
      : hovering 
        ? c.primaryHover 
        : c.primary,
    color: '#0D0D0D',
    fontWeight: '700',
    padding: '14px',
    borderRadius: '8px',
    fontSize: '14px',
    border: 'none',
    cursor: loading ? 'not-allowed' : 'pointer',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    opacity: loading ? 0.6 : 1,
    boxShadow: hovering 
      ? '0 0 20px rgba(184, 134, 11, 0.4), 0 8px 24px rgba(184, 134, 11, 0.2)' 
      : '0 4px 12px rgba(0, 0, 0, 0.3)',
    transform: hovering ? 'translateY(-2px) scale(1.02)' : 'translateY(0) scale(1)',
  }),

  buttonSecondary: (hovering = false) => ({
    width: '100%',
    backgroundColor: hovering ? `rgba(192, 192, 192, 0.05)` : 'transparent',
    color: hovering ? c.primary : c.accent,
    fontWeight: '700',
    padding: '14px',
    border: `1.5px solid ${hovering ? c.primary : c.accent}`,
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    boxShadow: hovering 
      ? `0 0 15px rgba(184, 134, 11, 0.2)` 
      : 'none',
    transform: hovering ? 'translateY(-2px)' : 'translateY(0)',
  }),

  buttonSmall: (loading = false, hovering = false) => ({
    backgroundColor: loading 
      ? c.primaryActive 
      : hovering 
        ? c.primaryHover 
        : c.primary,
    color: '#0D0D0D',
    fontWeight: '600',
    padding: '10px 16px',
    borderRadius: '6px',
    fontSize: '12px',
    border: 'none',
    cursor: loading ? 'not-allowed' : 'pointer',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    display: 'inline-block',
    opacity: loading ? 0.6 : 1,
    boxShadow: hovering 
      ? '0 0 12px rgba(184, 134, 11, 0.3)' 
      : '0 2px 6px rgba(0, 0, 0, 0.2)',
    transform: hovering ? 'translateY(-1px) scale(1.05)' : 'translateY(0) scale(1)',
  }),

  // ─── ALERTS ───
  error: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: `1.5px solid ${c.error}`,
    color: c.error,
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '24px',
    fontSize: '13px',
    fontWeight: '500',
    animation: 'slideInLeft 0.3s ease-in-out',
  },

  success: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: `1.5px solid ${c.success}`,
    color: c.success,
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '24px',
    fontSize: '13px',
    fontWeight: '500',
    animation: 'slideInLeft 0.3s ease-in-out',
  },

  warning: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    border: `1.5px solid ${c.warning}`,
    color: c.warning,
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '24px',
    fontSize: '13px',
    fontWeight: '500',
    animation: 'slideInLeft 0.3s ease-in-out',
  },

  // ─── TYPOGRAPHY ───
  heading1: {
    fontSize: '48px',
    fontWeight: '800',
    color: c.textMain,
    lineHeight: '1.1',
    marginBottom: '16px',
    letterSpacing: '-1px',
    animation: 'fadeIn 0.6s ease-in-out',
  },

  heading2: {
    fontSize: '32px',
    fontWeight: '700',
    color: c.textMain,
    lineHeight: '1.2',
    marginBottom: '12px',
    animation: 'fadeIn 0.5s ease-in-out',
  },

  heading3: {
    fontSize: '24px',
    fontWeight: '700',
    color: c.textMain,
    lineHeight: '1.3',
    marginBottom: '8px',
  },

  body: {
    fontSize: '16px',
    color: c.textSub,
    lineHeight: '1.5',
    fontWeight: '400',
  },

  bodySmall: {
    fontSize: '14px',
    color: c.textSub,
    lineHeight: '1.5',
    fontWeight: '400',
  },

  // ─── GRIDS ───
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '24px',
    marginTop: '32px',
  },

  gridContainerWide: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '32px',
    marginTop: '32px',
  },

  // ─── DIVIDER ───
  divider: {
    height: '1px',
    backgroundColor: c.border,
    border: 'none',
    margin: '24px 0',
  },

  // ─── PRODUCT CARD ───
  productCard: {
    backgroundColor: c.card,
    border: `1.5px solid ${c.border}`,
    borderRadius: '8px',
    overflow: 'hidden',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    animation: 'scaleUp 0.4s ease-in-out',
  },

  productCardHover: {
    backgroundColor: c.bgDark,
    borderColor: c.primary,
    boxShadow: '0 0 30px rgba(184, 134, 11, 0.25), 0 16px 40px rgba(0, 0, 0, 0.5)',
    transform: 'translateY(-8px) scale(1.02)',
  },

  productImage: {
    width: '100%',
    height: '280px',
    objectFit: 'cover',
    backgroundColor: c.bgDark,
    transition: 'transform 0.3s ease-in-out',
  },

  productImageHover: {
    transform: 'scale(1.08)',
  },

  productInfo: {
    padding: '16px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },

  productName: {
    fontSize: '16px',
    fontWeight: '600',
    color: c.textMain,
    marginBottom: '8px',
    lineHeight: '1.3',
  },

  productPrice: {
    fontSize: '20px',
    fontWeight: '700',
    color: c.primary,
    marginBottom: '12px',
  },

  productPriceSmall: {
    fontSize: '16px',
    fontWeight: '600',
    color: c.primary,
  },

  productCategory: {
    fontSize: '11px',
    fontWeight: '600',
    color: c.textWeak,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '8px',
  },

  productStock: {
    fontSize: '12px',
    color: c.success,
    fontWeight: '500',
    marginBottom: '12px',
  },

  productButton: (hovering = false) => ({
    backgroundColor: hovering ? c.primaryHover : c.primary,
    color: '#0D0D0D',
    fontWeight: '600',
    padding: '10px',
    borderRadius: '6px',
    fontSize: '12px',
    border: 'none',
    cursor: 'pointer',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    marginTop: '8px',
    boxShadow: hovering 
      ? '0 0 12px rgba(184, 134, 11, 0.3)' 
      : '0 2px 6px rgba(0, 0, 0, 0.2)',
    transform: hovering ? 'scale(1.04)' : 'scale(1)',
  }),

  // ─── FILTER BUTTON ───
  filterButton: (active = false, hovering = false) => ({
    padding: '8px 16px',
    backgroundColor: active ? c.primary : hovering ? c.bgDark : 'transparent',
    color: active ? '#0D0D0D' : hovering ? c.primary : c.textSub,
    border: `1.5px solid ${active ? c.primary : hovering ? c.primary : c.border}`,
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    boxShadow: active 
      ? '0 0 15px rgba(184, 134, 11, 0.25)' 
      : hovering 
        ? '0 0 10px rgba(184, 134, 11, 0.15)' 
        : 'none',
    transform: hovering ? 'translateY(-2px)' : 'translateY(0)',
  }),

  // ─── FORM GROUPS ───
  formGroup: {
    marginBottom: '24px',
  },

  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '24px',
  },

  // ─── LOADING & STATES ───
  skeleton: {
    backgroundColor: c.bgDark,
    borderRadius: '8px',
    animation: 'shimmer 2s infinite',
    backgroundImage: `linear-gradient(
      90deg,
      ${c.bgDark} 0%,
      ${c.card} 50%,
      ${c.bgDark} 100%
    )`,
    backgroundSize: '1000px 100%',
  },

  // ─── NAVBAR / HEADER ───
  navbar: {
    backgroundColor: c.card,
    borderBottom: `1.5px solid ${c.border}`,
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  },

  navLink: (active = false, hovering = false) => ({
    color: active ? c.primary : hovering ? c.primary : c.textSub,
    fontSize: '14px',
    fontWeight: '600',
    textDecoration: 'none',
    padding: '8px 16px',
    borderBottom: active ? `2px solid ${c.primary}` : 'none',
    cursor: 'pointer',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  }),
}

// ─── CUSTOM UTILITIES ───
export const mergeStyles = (...styleObjects) => {
  return Object.assign({}, ...styleObjects)
}

export const withAlpha = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// Inyectar animaciones globales
if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style')
  styleTag.textContent = animations
  document.head.appendChild(styleTag)
}
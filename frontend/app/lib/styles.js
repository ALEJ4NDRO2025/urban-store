// ── PALETA DE COLORES URBAN STORE ─────────────────────────────
export const c = {
    bg:       '#121212',  // Negro Asfalto - fondo principal
    card:     '#1A1A1A',  // Card del formulario
    input:    '#222222',  // Fondo de los inputs
    primary:  '#FF007F',  // Rosa Neón - botones CTA
    accent:   '#00E5FF',  // Azul Hielo - links y focus
    textMain: '#FFFFFF',  // Blanco Puro - títulos y texto
    textSub:  '#A0A0A0',  // Gris Cromo - labels y secundario
  }
  
  // ── ESTILOS REUTILIZABLES ──────────────────────────────────────
  // Estos estilos se usan en login, register y cualquier página futura
  export const styles = {
  
    // Contenedor principal centrado en pantalla
    page: {
      minHeight: '100vh',
      backgroundColor: c.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 16px',
    },
  
    // Card del formulario
    card: {
      backgroundColor: c.card,
      borderRadius: '16px',
      padding: '32px',
      border: '1px solid #2A2A2A',
    },
  
    // Label de cada campo
    label: {
      color: c.textSub,
      fontSize: '12px',
      marginBottom: '6px',
      display: 'block',
      textTransform: 'uppercase',
      letterSpacing: '1px',
    },
  
    // Input de texto
    input: {
      width: '100%',
      backgroundColor: c.input,
      color: c.textMain,
      border: '1px solid #2A2A2A',
      borderRadius: '8px',
      padding: '12px 16px',
      fontSize: '14px',
      outline: 'none',
      boxSizing: 'border-box',
    },
  
    // Botón principal — recibe loading y hovering para cambiar color
    button: (loading, hovering) => ({
      width: '100%',
      backgroundColor: loading ? '#A0A0A0' : hovering ? '#D4006A' : c.primary,
      color: c.textMain,
      fontWeight: '700',
      padding: '14px',
      borderRadius: '8px',
      fontSize: '14px',
      border: 'none',
      cursor: loading ? 'not-allowed' : 'pointer',
      letterSpacing: '1px',
      textTransform: 'uppercase',
      transition: 'background-color 0.2s',
    }),
  
    // Mensaje de error
    error: {
      backgroundColor: 'rgba(255,0,127,0.1)',
      border: '1px solid #FF007F',
      color: '#FF007F',
      padding: '12px 16px',
      borderRadius: '8px',
      marginBottom: '24px',
      fontSize: '13px',
    },
  }
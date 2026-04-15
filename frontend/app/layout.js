import { Inter } from 'next/font/google'
import Navbar from './components/NavBar'
import Providers from './providers'

// Configurar la fuente Inter
const inter = Inter({ subsets: ['latin'] })

// Metadatos de la aplicación
export const metadata = {
  title: 'Urban Store',
  description: 'Ropa y accesorios de cultura urbana',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{
        margin: 0,
        padding: 0,
        // Gradiente radial sutil para dar profundidad (foco de luz)
        background: 'radial-gradient(circle at 30% 20%, #1a1a1a, #0D0D0D 80%)',
        color: '#FFFFFF',
        fontFamily: inter.style.fontFamily,
        minHeight: '100vh',
      }}>
        {/* Providers encapsula AOS y Stripe (lógica de cliente) */}
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  )
}
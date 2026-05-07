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
        background: 'radial-gradient(circle at 30% 20%, #1a1a1a, #0D0D0D 80%)',
        color: '#FFFFFF',
        fontFamily: inter.style.fontFamily,
        minHeight: '100vh',
      }}>
        <Providers>
          <Navbar />
          {/* Espaciado responsivo para que el contenido no quede pegado al navbar */}
          <div style={{ paddingTop: 'clamp(80px, 12vw, 100px)' }}>
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}
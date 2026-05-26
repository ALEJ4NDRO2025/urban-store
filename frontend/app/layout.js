// frontend/app/layout.js
import { Inter } from 'next/font/google'
import Navbar from './components/NavBar'
import Providers from './providers'
// ✅ Importa el componente oficial de Google Analytics para Next.js
import { GoogleAnalytics } from '@next/third-parties/google'
import PageViewTracker from './components/PageViewTracker'


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
          <PageViewTracker />
          {/* Espaciado responsivo para que el contenido no quede pegado al navbar */}
          <div style={{ paddingTop: 'clamp(80px, 12vw, 100px)' }}>
            {children}
          </div>
        </Providers>
        
        {/* 🔥 Google Analytics 4 – lee automáticamente la variable de entorno NEXT_PUBLIC_GA_MEASUREMENT_ID */}
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        
        
      </body>
    </html>
  )
}
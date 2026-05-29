// frontend/app/layout.js
import { Inter } from 'next/font/google'
import Navbar from './components/NavBar'
import Providers from './providers'
import { GoogleAnalytics } from '@next/third-parties/google'
import PageViewTracker from './components/PageViewTracker'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

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
          <div style={{ paddingTop: 'clamp(80px, 12vw, 100px)' }}>
            {children}
          </div>
        </Providers>

        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />

        {/* 🆕 Cloudinary Upload Widget (CDN, sin npm) */}
        <Script
          src="https://upload-widget.cloudinary.com/global/all.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
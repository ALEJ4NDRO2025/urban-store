import { Inter } from 'next/font/google'
import Navbar from './components/NavBar'

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
        backgroundColor: '#0D0D0D',
        fontFamily: inter.style.fontFamily,
      }}>
        <Navbar />
        {children}
      </body>
    </html>
  )
}
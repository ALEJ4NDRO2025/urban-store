import { NextResponse } from 'next/server'

export function middleware(request) {
  // Obtener token de las cookies o del header Authorization
  const token = request.cookies.get('access')?.value

  const { pathname } = request.nextUrl

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. Rutas PÚBLICAS (no requieren autenticación)
  // ═══════════════════════════════════════════════════════════════════════════
  const publicPaths = [
    '/login',
    '/register',
    '/catalog',
    '/',
    '/verify-email',        // ← DEBE ESTAR AQUÍ
    '/forgot-password',      // ← También
    '/reset-password',       // ← También
  ]
  const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'))

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. Rutas de AUTENTICACIÓN (login/register) cuando YA hay sesión
  //    Si el usuario ya está logueado, redirigir al catálogo
  // ═══════════════════════════════════════════════════════════════════════════
  const authPaths = ['/login', '/register']
  const isAuthPath = authPaths.includes(pathname)

  if (isAuthPath && token) {
    return NextResponse.redirect(new URL('/catalog', request.url))
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. Rutas PROTEGIDAS (requieren token)
  // ═══════════════════════════════════════════════════════════════════════════
  if (!isPublicPath && !token) {
    // Guardar la URL a la que intentaba ir para redirigir después del login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. Ruta /admin: solo administradores
  // ═══════════════════════════════════════════════════════════════════════════
  if (pathname.startsWith('/admin') && token) {
    try {
      // Decodificar el token para verificar is_admin
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (!payload.is_admin) {
        // No es admin: redirigir al home
        return NextResponse.redirect(new URL('/', request.url))
      }
    } catch (error) {
      // Token inválido: redirigir al login
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. Continuar con la solicitud normalmente
  // ═══════════════════════════════════════════════════════════════════════════
  return NextResponse.next()
}

// ═══════════════════════════════════════════════════════════════════════════
// Configuración: en qué rutas se ejecuta el middleware
// ═══════════════════════════════════════════════════════════════════════════
export const config = {
  matcher: [
    /*
     * Excluir archivos estáticos, imágenes, API routes y Next.js internals
     * para no interferir con recursos que no necesitan protección
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg$).*)',
  ],
}
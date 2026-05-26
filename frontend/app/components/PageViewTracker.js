'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackEvent } from '../lib/analytics';

// Rutas que NO deben generar page_view (panel de admin, etc.)
const EXCLUDED_PREFIXES = ['/admin'];

export default function PageViewTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef(null);

  useEffect(() => {
    // Si la ruta está excluida, no hacemos nada
    if (!pathname || EXCLUDED_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
      return;
    }

    if (pathname !== lastTrackedPath.current) {
      trackEvent('page_view', {
        page_title: document.title,
        page_location: window.location.href,
        page_path: pathname,
      });
      lastTrackedPath.current = pathname;
    }
  }, [pathname]);

  return null;
}
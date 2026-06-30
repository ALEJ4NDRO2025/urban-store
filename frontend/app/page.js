'use client';

/**
 * ════════════════════════════════════════════════════════════════
 * URBAN STORE - HOME PAGE PREMIUM (VERSIÓN OPTIMIZADA)
 * ════════════════════════════════════════════════════════════════
 * 
 * Optimizaciones aplicadas:
 * - 400 partículas doradas + 200 estrellas (vs 800+400)
 * - Sin movimiento individual de partículas (solo rotación grupal)
 * - Sin pulso de luz (intensidad fija)
 * - Throttle en mousemove y scroll con requestAnimationFrame
 * - FOV reducido a 55
 * - Pixel ratio limitado a 1.2
 * - Three.js se carga solo cuando el canvas entra en viewport
 * - Imágenes con lazy loading nativo
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { c } from './lib/styles';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ─── Número de WhatsApp Business (mismo que en el carrito) ──────
const WHATSAPP_NUMBER = '573118540079';

// ════════════════════════════════════════════════════════════════
// DATOS MOCK - Productos de fallback
// ════════════════════════════════════════════════════════════════
const MOCK_PRODUCTS = [
  {
    slug: 'camiseta-urban-1',
    name: 'Camiseta Urban Black',
    price: 89900,
    category: 'Camisetas',
    images: ['https://placehold.co/600x600/1a1a1a/B8860B?text=Camiseta+Black'],
    badge: '🔥 Más Vendido',
  },
  {
    slug: 'hoodie-essentials',
    name: 'Hoodie Essentials',
    price: 149900,
    category: 'Hoodies',
    images: ['https://placehold.co/600x600/1a1a1a/B8860B?text=Hoodie'],
  },
  {
    slug: 'gorra-street',
    name: 'Gorra Street',
    price: 45900,
    category: 'Gorras',
    images: ['https://placehold.co/600x600/1a1a1a/B8860B?text=Gorra'],
  },
  {
    slug: 'anillo-urban',
    name: 'Anillo Urban',
    price: 29900,
    category: 'Accesorios',
    images: ['https://placehold.co/600x600/1a1a1a/B8860B?text=Anillo'],
  },
];

export default function HomePage() {
  // ════════════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ════════════════════════════════════════════════════════════════
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [loggedIn, setLoggedIn] = useState(false);

  // ════════════════════════════════════════════════════════════════
  // SESIÓN — para saber si mostramos el botón flotante "Mis pedidos"
  // ════════════════════════════════════════════════════════════════
  useEffect(() => {
    setLoggedIn(!!localStorage.getItem('access'));
  }, []);

  // ════════════════════════════════════════════════════════════════
  // REFS
  // ════════════════════════════════════════════════════════════════
  const canvasRef = useRef(null);
  const heroRef = useRef(null);
  const animationRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const particlesRef = useRef(null);
  const starsRef = useRef(null);
  const mouseMoveRAF = useRef(null);
  const scrollTicking = useRef(false);
  const threeInitialized = useRef(false);

  // ════════════════════════════════════════════════════════════════
  // CATEGORÍAS
  // ════════════════════════════════════════════════════════════════
  const categories = useMemo(() => [
    { name: 'Camisetas', icon: '👕', slug: 'camisetas', color: '#B8860B' },
    { name: 'Hoodies', icon: '🧥', slug: 'hoodies', color: '#D4A017' },
    { name: 'Gorras', icon: '🧢', slug: 'gorras', color: '#DAA520' },
    { name: 'Accesorios', icon: '💎', slug: 'accesorios', color: '#FFD700' },
  ], []);

  // ════════════════════════════════════════════════════════════════
  // OPTIMIZACIÓN: MOUSEMOVE CON THROTTLE (RAF)
  // ════════════════════════════════════════════════════════════════
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (mouseMoveRAF.current) return;
      mouseMoveRAF.current = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth) * 2 - 1;
        const y = (e.clientY / window.innerHeight) * 2 - 1;
        setMousePosition({ x, y });
        if (heroRef.current) {
          const parallaxX = x * 15;
          const parallaxY = y * 10;
          heroRef.current.style.transform = `translate(${parallaxX}px, ${parallaxY}px)`;
        }
        mouseMoveRAF.current = null;
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (mouseMoveRAF.current) cancelAnimationFrame(mouseMoveRAF.current);
    };
  }, []);

  // ════════════════════════════════════════════════════════════════
  // OPTIMIZACIÓN: SCROLL CON THROTTLE
  // ════════════════════════════════════════════════════════════════
  useEffect(() => {
    const handleScroll = () => {
      if (scrollTicking.current) return;
      scrollTicking.current = true;
      requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = docHeight > 0 ? scrollTop / docHeight : 0;
        setScrollProgress(scrolled);
        if (canvasRef.current) {
          canvasRef.current.style.transform = `translateY(${scrollTop * 0.3}px)`;
        }
        scrollTicking.current = false;
      });
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ════════════════════════════════════════════════════════════════
  // VISIBILIDAD DE PESTAÑA
  // ════════════════════════════════════════════════════════════════
  useEffect(() => {
    const handleVisibilityChange = () => setIsVisible(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // ════════════════════════════════════════════════════════════════
  // CARGA LAZY DE THREE.JS (SOLO CUANDO EL CANVAS ES VISIBLE)
  // ════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!canvasRef.current || threeInitialized.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !threeInitialized.current) {
          threeInitialized.current = true;
          initThree();
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(canvasRef.current);
    return () => observer.disconnect();
  }, []);

  // ════════════════════════════════════════════════════════════════
  // THREE.JS OPTIMIZADO (MENOS PARTÍCULAS, SIN MOVIMIENTO INDIVIDUAL, SIN PULSO)
  // ════════════════════════════════════════════════════════════════
  const initThree = async () => {
    if (typeof window === 'undefined') return;
    const THREE = await import('three');
    const container = canvasRef.current;
    if (!container) return;

    // Escena
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Cámara con FOV reducido a 55
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 500);
    camera.position.z = 35;
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: container,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.2));
    rendererRef.current = renderer;

    // PARTÍCULAS DORADAS (400 en lugar de 800)
    const particleCount = 400;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const radius = 18 + Math.random() * 12;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      positions[i*3] = Math.sin(phi) * Math.cos(theta) * radius;
      positions[i*3+1] = Math.sin(phi) * Math.sin(theta) * radius;
      positions[i*3+2] = Math.cos(phi) * radius;

      const hue = 0.12 + Math.random() * 0.08;
      const saturation = 0.7 + Math.random() * 0.3;
      const lightness = 0.5 + Math.random() * 0.4;
      const color = new THREE.Color().setHSL(hue, saturation, lightness);
      colors[i*3] = color.r;
      colors[i*3+1] = color.g;
      colors[i*3+2] = color.b;
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Textura de partícula
    const canvasTex = document.createElement('canvas');
    canvasTex.width = 32;
    canvasTex.height = 32;
    const ctx = canvasTex.getContext('2d');
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.5)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    const particleTexture = new THREE.CanvasTexture(canvasTex);

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.22,
      map: particleTexture,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      transparent: true,
      opacity: 0.85
    });
    const particles = new THREE.Points(particlesGeometry, particleMaterial);
    scene.add(particles);
    particlesRef.current = particles;

    // ESTRELLAS (200 en lugar de 400)
    const starsCount = 200;
    const starsGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount; i++) {
      starPositions[i*3] = (Math.random() - 0.5) * 200;
      starPositions[i*3+1] = (Math.random() - 0.5) * 200;
      starPositions[i*3+2] = (Math.random() - 0.5) * 150 - 60;
    }
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1, transparent: true, opacity: 0.7 });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
    starsRef.current = stars;

    // ILUMINACIÓN (sin pulso, intensidad fija)
    const ambientLight = new THREE.AmbientLight(0x333333, 0.8);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(10, 20, 30);
    scene.add(directionalLight);

    // ANIMACIÓN (solo rotación grupal)
    const animate = () => {
      if (isVisible) {
        if (particlesRef.current) {
          particlesRef.current.rotation.y += 0.0006;
          particlesRef.current.rotation.x += 0.0003;
        }
        if (starsRef.current) {
          starsRef.current.rotation.y -= 0.00015;
          starsRef.current.rotation.z += 0.0001;
        }
        renderer.render(scene, camera);
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    // RESIZE
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }, 150);
    };
    window.addEventListener('resize', handleResize);

    // CLEANUP
    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationRef.current);
      particleTexture.dispose();
      particleMaterial.dispose();
      particlesGeometry.dispose();
      starsMaterial.dispose();
      starsGeometry.dispose();
      renderer.dispose();
      scene.clear();
    };
  };

  // ════════════════════════════════════════════════════════════════
  // INTERSECTION OBSERVER (animaciones al hacer scroll)
  // ════════════════════════════════════════════════════════════════
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -80px 0px' }
    );
    document.querySelectorAll('.gsap-reveal, .gsap-card').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [products]);

  // ════════════════════════════════════════════════════════════════
  // CARGA DE PRODUCTOS (con fallback a mock)
  // ════════════════════════════════════════════════════════════════
  useEffect(() => {
    let isMounted = true;
    const fetchProducts = async () => {
      try {
        setError(false);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(`${API_URL}/api/products/`, { signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const productsArray = Array.isArray(data) ? data : data.results || [];
        if (productsArray.length === 0) throw new Error('No products');
        if (isMounted) setProducts(productsArray.slice(0, 4));
      } catch (err) {
        console.warn('Using mock products:', err);
        if (isMounted) setProducts(MOCK_PRODUCTS);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchProducts();
    return () => { isMounted = false; };
  }, []);

  // ════════════════════════════════════════════════════════════════
  // RIPPLE EFFECT
  // ════════════════════════════════════════════════════════════════
  const createRipple = useCallback((e) => {
    const btn = e.currentTarget;
    const ripple = document.createElement('span');
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.5);
      transform: scale(0);
      animation: rippleEffect 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      pointer-events: none;
    `;
    btn.style.position = 'relative';
    btn.style.overflow = 'hidden';
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  }, []);

  const bestSeller = products[0];
  const restProducts = products.slice(1);

  // ════════════════════════════════════════════════════════════════
  // RENDER (idéntico al original, solo cambian las optimizaciones internas)
  // ════════════════════════════════════════════════════════════════
  return (
    <div style={{ background: '#0D0D0D', color: c.textMain, position: 'relative', overflow: 'hidden' }}>
      {/* Barra de progreso */}
      <div style={{ position: 'fixed', top: 0, left: 0, height: '3px', background: `linear-gradient(90deg, ${c.primary}, #FFD700)`, width: `${scrollProgress * 100}%`, zIndex: 9999, transition: 'width 0.1s ease-out', boxShadow: `0 0 10px ${c.primary}` }} />

      {/* Hero */}
      <section style={{ position: 'relative', height: '100vh', overflow: 'hidden', perspective: '1000px' }}>
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1, willChange: 'transform' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 50%, transparent 0%, rgba(13,13,13,0.7) 60%, #0D0D0D 100%)', zIndex: 2, pointerEvents: 'none' }} />
        <div ref={heroRef} style={{ position: 'relative', zIndex: 3, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 24px', willChange: 'transform', transition: 'transform 0.1s ease-out' }}>
          <div style={{ fontSize: 'clamp(11px, 2.5vw, 14px)', color: c.primary, textTransform: 'uppercase', letterSpacing: '8px', marginBottom: '24px', fontWeight: 600, opacity: 0.9, animation: 'fadeInDown 1s cubic-bezier(0.4,0,0.2,1) 0.2s both' }}>✨ Nueva Colección 2026</div>
          <h1 style={{ fontSize: 'clamp(48px, 13vw, 140px)', fontWeight: '950', lineHeight: '0.85', marginBottom: '24px', background: `linear-gradient(135deg, #FFFFFF 0%, ${c.primary} 40%, #FFD700 80%, #FFFFFF 100%)`, backgroundSize: '300% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'gradientShift 8s ease infinite, fadeInDown 1s cubic-bezier(0.4,0,0.2,1) 0.4s both', textTransform: 'uppercase', letterSpacing: '6px', textShadow: '0 8px 32px rgba(184,134,11,0.1)' }}>Urban Store</h1>
          <p style={{ fontSize: 'clamp(16px, 3.5vw, 24px)', color: c.textSub, marginBottom: '48px', maxWidth: '600px', lineHeight: 1.6, animation: 'fadeInDown 1s cubic-bezier(0.4,0,0.2,1) 0.6s both', opacity: 0.85, fontWeight: 300 }}>Redefine tu estilo con prendas exclusivas y diseño sin compromisos</p>
          <Link href="/catalog" style={{ textDecoration: 'none' }}>
            <button className="ripple-btn" onClick={createRipple} style={{ padding: '16px 48px', background: `linear-gradient(135deg, ${c.primary} 0%, #D4A017 50%, #FFD700 100%)`, backgroundSize: '200% auto', color: '#0D0D0D', fontWeight: '700', border: 'none', borderRadius: '50px', fontSize: 'clamp(14px,2vw,18px)', cursor: 'pointer', boxShadow: `0 8px 24px rgba(184,134,11,0.35), inset 0 1px 0 rgba(255,255,255,0.2)`, transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)', position: 'relative', overflow: 'hidden', animation: 'fadeInUp 1s cubic-bezier(0.4,0,0.2,1) 0.8s both', textTransform: 'uppercase', letterSpacing: '1.5px' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 12px 32px rgba(184,134,11,0.45), inset 0 1px 0 rgba(255,255,255,0.3)`; e.currentTarget.style.backgroundPosition = '100% center'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 8px 24px rgba(184,134,11,0.35), inset 0 1px 0 rgba(255,255,255,0.2)`; e.currentTarget.style.backgroundPosition = '0% center'; }}>Explorar Ahora</button>
          </Link>
        </div>
        <div style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', zIndex: 3 }}>
          <div style={{ width: '32px', height: '52px', border: `2px solid ${c.primary}`, borderRadius: '26px', background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'float 2s ease-in-out infinite' }}>
            <div style={{ width: '6px', height: '10px', background: c.primary, borderRadius: '3px', animation: 'scrollDot 2s ease-in-out infinite' }} />
          </div>
        </div>
      </section>

      {/* Categorías */}
      <section className="gsap-reveal" style={{ padding: 'clamp(60px,10vw,120px) 24px', maxWidth: '1400px', margin: '0 auto', position: 'relative' }}>
        <h2 style={{ fontSize: 'clamp(32px,7vw,56px)', fontWeight: '900', textAlign: 'center', marginBottom: 'clamp(40px,8vw,60px)', background: `linear-gradient(135deg, #FFFFFF 0%, ${c.primary} 50%, #FFD700 100%)`, backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'gradientShift 8s ease infinite', letterSpacing: '2px' }}>Categorías Destacadas</h2>
        <div className="categories-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '28px', perspective: '1000px' }}>
          {categories.map((cat, idx) => (
            <Link key={cat.slug} href={`/catalog?category=${cat.slug}`} style={{ textDecoration: 'none', perspective: '1000px' }}>
              <div className="gsap-card" onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-12px) scale(1.02) rotateX(5deg)'; e.currentTarget.style.boxShadow = `0 30px 50px rgba(0,0,0,0.6), 0 0 30px rgba(184,134,11,0.3)`; e.currentTarget.style.borderColor = cat.color; const icon = e.currentTarget.querySelector('[data-icon]'); if (icon) icon.style.transform = 'scale(1.15) rotate(8deg)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(1) rotateX(0)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)'; e.currentTarget.style.borderColor = 'rgba(184,134,11,0.15)'; const icon = e.currentTarget.querySelector('[data-icon]'); if (icon) icon.style.transform = 'scale(1) rotate(0)'; }} style={{ background: 'rgba(26,26,26,0.5)', backdropFilter: 'blur(16px)', border: '1px solid rgba(184,134,11,0.15)', borderRadius: '32px', padding: '48px 24px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.2,0.9,0.4,1.1)', willChange: 'transform, box-shadow, border-color', position: 'relative', overflow: 'hidden', animationDelay: `${idx * 0.1}s` }}>
                <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 50%, ${cat.color}10 0%, transparent 70%)`, opacity: 0, transition: 'opacity 0.4s ease' }} className="category-bg" />
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <div data-icon style={{ fontSize: '72px', marginBottom: '20px', transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1)', display: 'inline-block' }}>{cat.icon}</div>
                  <h3 style={{ color: '#FFFFFF', fontSize: 'clamp(20px,4vw,26px)', fontWeight: '700', margin: '0', letterSpacing: '0.5px' }}>{cat.name}</h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Productos */}
      <section className="gsap-reveal" style={{ padding: 'clamp(60px,10vw,100px) 24px', maxWidth: '1400px', margin: '0 auto' }}>
        <h2 style={{ fontSize: 'clamp(32px,7vw,56px)', fontWeight: '900', textAlign: 'center', marginBottom: 'clamp(40px,8vw,60px)', background: `linear-gradient(135deg, #FFFFFF 0%, ${c.primary} 50%, #FFD700 100%)`, backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'gradientShift 8s ease infinite', letterSpacing: '2px' }}>Lo Más Popular</h2>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
            {[...Array(4)].map((_, i) => <div key={i} style={{ background: 'rgba(26,26,26,0.4)', borderRadius: '32px', height: '420px', animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }} />)}
          </div>
        ) : (
          <>
            {bestSeller && (
              <div className="gsap-card" style={{ marginBottom: '80px' }}>
                <Link href={`/catalog/${bestSeller.slug}`} style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', background: 'rgba(26,26,26,0.8)', backdropFilter: 'blur(16px)', borderRadius: '40px', border: `2px solid ${c.primary}`, overflow: 'hidden', transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)', boxShadow: '0 20px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(184,134,11,0.1)', position: 'relative' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.01)'; e.currentTarget.style.boxShadow = `0 30px 60px rgba(0,0,0,0.6), 0 0 40px rgba(184,134,11,0.25)`; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 20px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(184,134,11,0.1)'; }}>
                    <div style={{ flex: '1', minWidth: '300px', aspectRatio: '1/1', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 30% 30%, ${c.primary}20, transparent 70%)`, zIndex: 1 }} />
                      <img src={bestSeller.images?.[0] || 'https://placehold.co/600x600/1a1a1a/B8860B?text=Urban+Store'} alt={bestSeller.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s cubic-bezier(0.4,0,0.2,1)' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08) rotate(1deg)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1) rotate(0)'} />
                    </div>
                    <div style={{ flex: '1', padding: '50px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: '300px' }}>
                      <div style={{ display: 'inline-block', background: `linear-gradient(135deg, ${c.primary}, #D4A017)`, color: '#0D0D0D', fontSize: '13px', fontWeight: '700', padding: '8px 20px', borderRadius: '50px', marginBottom: '24px', width: 'fit-content', textTransform: 'uppercase', letterSpacing: '1px', boxShadow: `0 4px 12px rgba(184,134,11,0.3)` }}>🔥 Más Vendido</div>
                      <h3 style={{ fontSize: 'clamp(28px,5vw,40px)', fontWeight: '900', marginBottom: '16px', color: '#FFFFFF', lineHeight: 1.2, letterSpacing: '1px' }}>{bestSeller.name}</h3>
                      <p style={{ color: c.primary, marginBottom: '24px', fontSize: '15px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px' }}>{bestSeller.category}</p>
                      {/* ✅ PRECIO CORREGIDO (bestSeller) */}
                      <div style={{ fontSize: 'clamp(32px,6vw,48px)', fontWeight: '900', color: c.primary, marginBottom: '32px', background: `linear-gradient(135deg, ${c.primary}, #FFD700)`, backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                        {bestSeller.price != null ? Number(bestSeller.price).toLocaleString('es-CO') : ''}
                      </div>
                      <button style={{ background: `linear-gradient(135deg, ${c.primary}, #D4A017)`, backgroundSize: '200% auto', color: '#0D0D0D', padding: '16px 36px', borderRadius: '50px', border: 'none', fontWeight: '700', fontSize: '16px', cursor: 'pointer', width: 'fit-content', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)', boxShadow: `0 8px 20px rgba(184,134,11,0.3), inset 0 1px 0 rgba(255,255,255,0.2)`, position: 'relative', overflow: 'hidden', textTransform: 'uppercase', letterSpacing: '1px' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 12px 28px rgba(184,134,11,0.4), inset 0 1px 0 rgba(255,255,255,0.3)`; e.currentTarget.style.backgroundPosition = '100% center'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 8px 20px rgba(184,134,11,0.3), inset 0 1px 0 rgba(255,255,255,0.2)`; e.currentTarget.style.backgroundPosition = '0% center'; }}>Ver Producto</button>
                    </div>
                  </div>
                </Link>
              </div>
            )}
            {restProducts.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
                {restProducts.map((product, idx) => (
                  <Link key={product.slug || idx} href={`/catalog/${product.slug}`} style={{ textDecoration: 'none' }}>
                    <div className="gsap-card" onMouseEnter={(e) => { const card = e.currentTarget; card.style.transform = 'translateY(-12px) scale(1.02)'; card.style.boxShadow = '0 30px 50px rgba(0,0,0,0.6), 0 0 30px rgba(184,134,11,0.25)'; card.style.borderColor = c.primary; const img = card.querySelector('img'); if (img) img.style.transform = 'scale(1.12) rotate(2deg)'; }} onMouseLeave={(e) => { const card = e.currentTarget; card.style.transform = 'translateY(0) scale(1)'; card.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)'; card.style.borderColor = 'rgba(184,134,11,0.15)'; const img = card.querySelector('img'); if (img) img.style.transform = 'scale(1) rotate(0)'; }} style={{ background: 'rgba(26,26,26,0.5)', backdropFilter: 'blur(16px)', border: '1px solid rgba(184,134,11,0.15)', borderRadius: '32px', overflow: 'hidden', transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)', cursor: 'pointer', willChange: 'transform, box-shadow, border-color', position: 'relative', animationDelay: `${idx * 0.08}s` }}>
                      <div style={{ aspectRatio: '1/1', overflow: 'hidden', background: '#1a1a1a', position: 'relative' }}>
                        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 40% 40%, ${c.primary}15, transparent 60%)`, zIndex: 1 }} />
                        <img src={product.images?.[0] || 'https://placehold.co/600x600/1a1a1a/B8860B?text=Urban+Store'} alt={product.name} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s cubic-bezier(0.4,0,0.2,1)' }} />
                      </div>
                      <div style={{ padding: '24px' }}>
                        <div style={{ fontSize: '12px', color: c.primary, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600 }}>{product.category || 'Urban'}</div>
                        <h3 style={{ fontSize: 'clamp(18px,3vw,22px)', fontWeight: '700', margin: '0 0 12px', color: '#FFFFFF', lineHeight: 1.3 }}>{product.name}</h3>
                        {/* ✅ PRECIO CORREGIDO (restProducts) */}
                        <div style={{ fontSize: 'clamp(22px,4vw,28px)', fontWeight: '800', color: c.primary, background: `linear-gradient(135deg, ${c.primary}, #FFD700)`, backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                          {product.price != null ? Number(product.price).toLocaleString('es-CO') : ''}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {!bestSeller && !loading && (
              <div style={{ textAlign: 'center', padding: '80px 40px', background: 'rgba(184,134,11,0.08)', borderRadius: '32px', border: `2px dashed ${c.primary}` }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>✨</div>
                <p style={{ color: c.primary, fontSize: '18px', fontWeight: 600 }}>No hay productos disponibles en este momento.</p>
                <p style={{ color: c.textSub, fontSize: '14px' }}>Vuelve pronto para descubrir nuestras últimas colecciones</p>
              </div>
            )}
          </>
        )}
      </section>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid rgba(184,134,11,0.2)`, padding: 'clamp(40px,8vw,60px) 24px', marginTop: '80px', background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(20px)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${c.primary}, transparent)`, animation: 'shimmer 3s ease-in-out infinite' }} />
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 'clamp(24px,5vw,32px)', fontWeight: '900', marginBottom: '12px', background: `linear-gradient(135deg, ${c.primary}, #FFD700)`, backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '2px' }}>URBAN STORE</h2>
          <p style={{ color: c.textSub, fontSize: '13px', fontWeight: 500, letterSpacing: '1px', textTransform: 'uppercase', opacity: 0.7 }}>© 2026 Urban Store. Todos los derechos reservados. ✨</p>
        </div>
      </footer>

      {/* ─── BOTONES FLOTANTES ─── */}
      <div style={{ position: 'fixed', right: 'clamp(16px, 4vw, 28px)', bottom: 'clamp(16px, 4vw, 28px)', zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '14px' }}>
        {/* Mis pedidos — solo si hay sesión iniciada */}
        {loggedIn && (
          <Link href="/perfil?tab=orders" style={{ textDecoration: 'none' }} aria-label="Mis pedidos">
            <button
              style={{
                width: '54px', height: '54px', borderRadius: '50%',
                background: `linear-gradient(135deg, ${c.primary}, #D4A017)`,
                border: 'none', color: '#000', fontSize: '24px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 8px 24px rgba(184,134,11,0.45)',
                transition: 'transform 0.25s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              title="Mis pedidos"
            >
              📦
            </button>
          </Link>
        )}

        {/* WhatsApp */}
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('¡Hola! Quiero más información sobre Urban Store 🛍️')}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'none' }}
          aria-label="Escribir por WhatsApp"
        >
          <button
            style={{
              width: '58px', height: '58px', borderRadius: '50%',
              background: '#25D366', border: 'none', color: '#fff', fontSize: '28px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: '0 8px 24px rgba(37,211,102,0.5)',
              transition: 'transform 0.25s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            title="Escribir por WhatsApp"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="#fff">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
            </svg>
          </button>
        </a>
      </div>

      {/* Estilos globales (idénticos) */}
      <style jsx global>{`
        * { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 10px; }
        ::-webkit-scrollbar-track { background: #0D0D0D; }
        ::-webkit-scrollbar-thumb { background: ${c.primary}; border-radius: 5px; border: 2px solid #0D0D0D; transition: background 0.3s ease; }
        ::-webkit-scrollbar-thumb:hover { background: #FFD700; }
        @keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes scrollDot { 0% { opacity: 1; transform: translateY(0); } 50% { opacity: 0.5; } 100% { opacity: 0; transform: translateY(20px); } }
        @keyframes rippleEffect { to { transform: scale(4); opacity: 0; } }
        @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 0.8; } 100% { opacity: 0.5; } }
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes shimmer { 0% { opacity: 0; } 50% { opacity: 1; } 100% { opacity: 0; } }
        .gsap-reveal { opacity: 0; transform: translateY(40px); transition: opacity 0.8s cubic-bezier(0.25,0.46,0.45,0.94), transform 0.8s cubic-bezier(0.25,0.46,0.45,0.94); }
        .gsap-reveal.revealed { opacity: 1; transform: translateY(0); }
        .gsap-card { opacity: 0; transform: translateY(30px) scale(0.95); transition: opacity 0.6s cubic-bezier(0.25,0.46,0.45,0.94), transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94); }
        .gsap-card.revealed { opacity: 1; transform: translateY(0) scale(1); }
        .ripple-btn { position: relative; }
        ::selection { background-color: ${c.primary}; color: #0D0D0D; }
        ::-moz-selection { background-color: ${c.primary}; color: #0D0D0D; }
      `}</style>
    </div>
  );
}
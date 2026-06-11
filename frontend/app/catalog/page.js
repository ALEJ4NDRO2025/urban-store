'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from './productCard';
import CatalogFilters from './catalogFilters';
import { c, styles } from '../lib/styles';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ── Componente interno que usa useSearchParams ──
function CatalogContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtering, setFiltering] = useState(false);

  const category = searchParams.get('category');
  const size = searchParams.get('size');
  const minPrice = searchParams.get('min_price');
  const maxPrice = searchParams.get('max_price');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setFiltering(true);
        setLoading(true);
        const params = new URLSearchParams();
        if (category) params.append('category', category);
        if (size) params.append('size', size);
        if (minPrice) params.append('min_price', minPrice);
        if (maxPrice) params.append('max_price', maxPrice);
        const url = `${API_URL}/api/products/?${params.toString()}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error al cargar productos');
        const data = await response.json();
        setProducts(data.results || data || []);
        setError(null);
      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
        setFiltering(false);
      }
    };
    fetchProducts();
  }, [category, size, minPrice, maxPrice]);

  // ... (pega aquí todo el return que ya tenías, sin cambios)
}

// ── Página principal con Suspense ──
export default function CatalogPage() {
  return (
    <Suspense fallback={<div style={{ background: '#0D0D0D', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Cargando catálogo...</div>}>
      <CatalogContent />
    </Suspense>
  );
}
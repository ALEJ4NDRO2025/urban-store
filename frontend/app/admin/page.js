'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { c } from '../lib/styles';
import { API_URL } from '../lib/api';

// ============================================================
// CONFIGURACIÓN
// ============================================================
const ITEMS_PER_PAGE = 10;

// Paleta profesional estilo Google Charts / Tableau (sobre fondo oscuro)
const ANALYTICS_COLORS = {
  primary:    c.primary,
  secondary:  c.success,
  accent:     c.accent,
  danger:     c.error,
  neutral:    c.textSub,
  surface:    c.card,
  border:     c.border,
  text:       c.textMain,
  muted:      c.textWeak,

  timeline: {
    product_view:    '#4285F4',
    add_to_cart:     '#FF6D00',
    begin_checkout:  '#F4B400',
    purchase:        '#0F9D58',
    error:           '#DB4437',
  },
  pie: ['#4285F4', '#0F9D58', '#FF6D00', '#F4B400'],
  bar: {
    sales: '#4285F4',
    views: '#0F9D58',
  },
  funnel: '#4285F4',
  funnelSteps: ['#4E79A7', '#F28E2B', '#E15759', '#76B7B2', '#59A14F'],
};

export default function AdminPage() {
  const router = useRouter();

  // --- Pestañas ---
  const [activeTab, setActiveTab] = useState('orders');

  // --- Pedidos ---
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // --- Analíticas ---
  const [stats, setStats] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [funnel, setFunnel] = useState(null);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [alerts, setAlerts] = useState([]);               // ← alertas inteligentes
  const [rfmData, setRfmData] = useState([]);             // ← análisis RFM
  const [analyticsMode, setAnalyticsMode] = useState('total'); // 'total' o 'unique'

  // ============================================================
  // EFECTOS INICIALES
  // ============================================================
  useEffect(() => {
    const token = localStorage.getItem('access');
    if (!token) {
      router.push('/login');
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload.is_admin) {
        router.push('/');
        return;
      }
    } catch (e) {
      router.push('/login');
      return;
    }

    fetch(`${API_URL}/api/orders/all/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('No autorizado');
        return res.json();
      })
      .then((data) => {
        setOrders(data);
        setLoadingOrders(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoadingOrders(false);
      });
  }, [router]);

  // Cargar dashboard-stats (con parámetro mode)
  useEffect(() => {
    if (activeTab !== 'analytics') return;
    const token = localStorage.getItem('access');
    if (!token) return;

    setLoadingAnalytics(true);
    fetch(`${API_URL}/api/analytics/dashboard-stats/?mode=${analyticsMode}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoadingAnalytics(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingAnalytics(false);
      });
  }, [activeTab, analyticsMode]);

  // Cargar funnel
  useEffect(() => {
    if (activeTab !== 'analytics') return;
    const token = localStorage.getItem('access');
    if (!token) return;

    fetch(`${API_URL}/api/analytics/funnel/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setFunnel(data.funnel))
      .catch(err => console.error('Error cargando funnel:', err));
  }, [activeTab]);

  // Cargar últimas compras
  useEffect(() => {
    if (activeTab !== 'analytics') return;
    const token = localStorage.getItem('access');
    if (!token) return;

    fetch(`${API_URL}/api/orders/all/?status=paid&limit=5`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setRecentPurchases(Array.isArray(data) ? data.slice(0, 5) : []))
      .catch(() => setRecentPurchases([]));
  }, [activeTab]);

  // Cargar alertas inteligentes
  useEffect(() => {
    if (activeTab !== 'analytics') return;
    const token = localStorage.getItem('access');
    if (!token) return;

    fetch(`${API_URL}/api/analytics/alerts/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setAlerts(data.alerts || []))
      .catch(() => setAlerts([]));
  }, [activeTab]);

  // Cargar datos RFM
  useEffect(() => {
    if (activeTab !== 'analytics') return;
    const token = localStorage.getItem('access');
    if (!token) return;

    fetch(`${API_URL}/api/analytics/rfm/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setRfmData(data.rfm || []))
      .catch(() => setRfmData([]));
  }, [activeTab]);

  // ============================================================
  // PEDIDOS: HANDLERS Y LÓGICA (sin cambios)
  // ============================================================
  const handleStatusChange = async (orderId, newStatus) => {
    const token = localStorage.getItem('access');
    setUpdatingId(orderId);
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}/status/`, {
        method: 'PATCH', headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Error al actualizar');
      const updatedOrder = await res.json();
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
      toast.success(`Estado actualizado a "${newStatus}"`);
    } catch (err) {
      toast.error('No se pudo actualizar el estado');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredAndSortedOrders = useMemo(() => {
    let filtered = [...orders];
    if (filterStatus) filtered = filtered.filter(order => order.status === filterStatus);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        order.order_number.toLowerCase().includes(term) ||
        order.shipping_address.email.toLowerCase().includes(term)
      );
    }
    filtered.sort((a, b) => {
      let aVal, bVal;
      if (sortBy === 'order_number') {
        aVal = a.order_number;
        bVal = b.order_number;
      } else if (sortBy === 'total') {
        aVal = a.total;
        bVal = b.total;
      } else {
        aVal = new Date(a.created_at);
        bVal = new Date(b.created_at);
      }
      if (sortOrder === 'asc') return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });
    return filtered;
  }, [orders, filterStatus, searchTerm, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSortedOrders, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [filterStatus, searchTerm, sortBy, sortOrder]);

  const totalOrders = orders.length;
  const totalRevenue = orders.filter(o => o.status === 'paid').reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const paidOrders = orders.filter(o => o.status === 'paid').length;

  const clearFilters = () => {
    setFilterStatus('');
    setSearchTerm('');
    setSortBy('created_at');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (sortBy === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else setSortBy(field);
    setCurrentPage(1);
  };

  const goToPage = (page) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));

  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending': return { backgroundColor: '#fff3e0', color: '#e65100' };
      case 'paid': return { backgroundColor: '#e8f5e9', color: '#2e7d32' };
      case 'shipped': return { backgroundColor: '#e3f2fd', color: '#1565c0' };
      default: return { backgroundColor: '#f5f5f5', color: '#666' };
    }
  };

  const glassCard = {
    background: 'rgba(26,26,26,0.5)',
    backdropFilter: 'blur(12px)',
    borderRadius: '16px',
    padding: '20px',
    border: `1px solid ${c.border}`,
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  };

  const chipStyle = (isActive) => ({
    padding: '8px 20px',
    borderRadius: '40px',
    background: isActive ? c.primary : 'rgba(255,255,255,0.05)',
    color: isActive ? '#000' : c.textSub,
    border: isActive ? 'none' : `1px solid ${c.border}`,
    cursor: 'pointer',
    fontWeight: isActive ? 'bold' : 'normal',
    transition: 'all 0.2s',
    fontSize: '14px',
  });

  // ============================================================
  // FUNCIONES Y COMPONENTES AUXILIARES (DENTRO DE AdminPage)
  // ============================================================
  function calculateTrend(current, previous) {
    if (!previous || previous === 0) return { value: 0, isUp: false, isNeutral: true };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(Math.round(change * 10) / 10),
      isUp: change > 0,
      isNeutral: change === 0,
    };
  }

  function TrendIndicator({ current, previous, reverseColors = false }) {
    const trend = calculateTrend(current, previous);
    if (trend.isNeutral) {
      return <span style={{ fontSize: '12px', color: c.textSub, marginLeft: '8px' }}>→ 0%</span>;
    }
    const isGood = reverseColors ? !trend.isUp : trend.isUp;
    const color = isGood ? c.success : c.error;
    const arrow = trend.isUp ? '↑' : '↓';
    return (
      <span style={{ fontSize: '12px', color, marginLeft: '8px', fontWeight: '600' }}>
        {arrow} {trend.value}% vs anterior
      </span>
    );
  }

  function GaugeChart({ value = 0, title = 'Tasa de Conversión', max = 100 }) {
    const percentage = Math.min(value, max);
    const radius = 80, strokeWidth = 12;
    const circumference = Math.PI * radius;
    const offset = circumference - (percentage / max) * circumference;
    const getColor = (val) => {
      if (val >= 5) return c.success;
      if (val >= 2) return c.warning;
      return c.error;
    };
    return (
      <div style={{ ...glassCard, textAlign: 'center', padding: '24px' }}>
        <h3 style={{ fontSize: '14px', color: c.textSub, marginBottom: '16px', fontWeight: '500' }}>{title}</h3>
        <svg width="200" height="120" viewBox="0 0 200 120" style={{ display: 'block', margin: '0 auto' }}>
          <path d={`M 20 100 A ${radius} ${radius} 0 0 1 180 100`} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={strokeWidth} strokeLinecap="round" />
          <path d={`M 20 100 A ${radius} ${radius} 0 0 1 180 100`} fill="none" stroke={getColor(percentage)} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
          <text x="100" y="95" textAnchor="middle" fontSize="32" fontWeight="bold" fill={getColor(percentage)}>{percentage.toFixed(1)}%</text>
          <text x="100" y="115" textAnchor="middle" fontSize="10" fill={c.textSub}>{percentage >= 5 ? '¡Excelente!' : percentage >= 2 ? 'Mejorable' : 'Urgente'}</text>
        </svg>
      </div>
    );
  }

  // ============================================================
  // PANEL DE PEDIDOS (sin cambios)
  // ============================================================
  const renderOrdersPanel = () => (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        <div style={glassCard}><div style={{ fontSize: '14px', color: c.textSub, marginBottom: '8px' }}>Total Pedidos</div><div style={{ fontSize: '32px', fontWeight: 'bold', color: c.primary }}>{totalOrders}</div></div>
        <div style={glassCard}><div style={{ fontSize: '14px', color: c.textSub, marginBottom: '8px' }}>Ingresos Totales</div><div style={{ fontSize: '32px', fontWeight: 'bold', color: c.success }}>${totalRevenue.toLocaleString()}</div></div>
        <div style={glassCard}><div style={{ fontSize: '14px', color: c.textSub, marginBottom: '8px' }}>Pendientes</div><div style={{ fontSize: '32px', fontWeight: 'bold', color: '#e65100' }}>{pendingOrders}</div></div>
        <div style={glassCard}><div style={{ fontSize: '14px', color: c.textSub, marginBottom: '8px' }}>Pagados</div><div style={{ fontSize: '32px', fontWeight: 'bold', color: '#2e7d32' }}>{paidOrders}</div></div>
      </div>
      <div style={{ ...glassCard, padding: '20px 24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            <span style={{ color: c.textSub, fontSize: '14px' }}>Filtrar por estado:</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <button onClick={() => setFilterStatus('')} style={chipStyle(filterStatus === '')}>Todos</button>
              <button onClick={() => setFilterStatus('pending')} style={chipStyle(filterStatus === 'pending')}>Pendientes</button>
              <button onClick={() => setFilterStatus('paid')} style={chipStyle(filterStatus === 'paid')}>Pagados</button>
              <button onClick={() => setFilterStatus('shipped')} style={chipStyle(filterStatus === 'shipped')}>Enviados</button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input
              type="text" placeholder="🔍 Buscar por nº orden o email"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '8px 16px', background: c.input, border: `1px solid ${c.border}`, borderRadius: '40px', color: c.textMain, fontSize: '14px', minWidth: '240px' }}
            />
            <button onClick={clearFilters} style={{ padding: '8px 20px', background: 'transparent', border: `1px solid ${c.border}`, borderRadius: '40px', color: c.textSub, cursor: 'pointer' }}>Limpiar</button>
          </div>
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${c.border}` }}>
              <th style={{ padding: '16px', textAlign: 'left', cursor: 'pointer' }} onClick={() => handleSort('order_number')}>Nº Orden {sortBy === 'order_number' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
              <th style={{ padding: '16px', textAlign: 'left' }}>Cliente</th>
              <th style={{ padding: '16px', textAlign: 'left', cursor: 'pointer' }} onClick={() => handleSort('created_at')}>Fecha {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
              <th style={{ padding: '16px', textAlign: 'left', cursor: 'pointer' }} onClick={() => handleSort('total')}>Total {sortBy === 'total' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
              <th style={{ padding: '16px', textAlign: 'left' }}>Estado</th>
              <th style={{ padding: '16px', textAlign: 'left' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedOrders.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center' }}>No hay pedidos que coincidan con los filtros</td></tr>
            ) : (
              paginatedOrders.map((order, idx) => (
                <tr key={order.id} style={{ borderBottom: `1px solid ${c.border}`, transition: 'background 0.2s', animation: `fadeInUp 0.3s ease-out ${idx * 0.03}s both` }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(184,134,11,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '16px', fontWeight: '500' }}>{order.order_number}</td>
                  <td style={{ padding: '16px' }}>{order.shipping_address.name}<br /><span style={{ fontSize: '12px', color: c.textSub }}>{order.shipping_address.email}</span></td>
                  <td style={{ padding: '16px', fontSize: '14px' }}>{new Date(order.created_at + 'Z').toLocaleDateString('es-CO')}</td>
                  <td style={{ padding: '16px', fontWeight: '700', color: c.primary }}>${order.total.toLocaleString()}</td>
                  <td style={{ padding: '16px' }}>
                    <select value={order.status} onChange={(e) => handleStatusChange(order.id, e.target.value)} disabled={updatingId === order.id}
                        style={{ padding: '6px 12px', backgroundColor: getStatusStyle(order.status).backgroundColor, color: getStatusStyle(order.status).color, border: `1px solid ${c.border}`, borderRadius: '6px', cursor: 'pointer' }}>
                      <option value="pending">Pendiente</option>
                      <option value="paid">Pagado</option>
                      <option value="shipped">Enviado</option>
                    </select>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <button onClick={() => router.push(`/order-confirmation/${order.id}`)} style={{ padding: '6px 12px', backgroundColor: 'transparent', color: c.primary, border: `1px solid ${c.primary}`, borderRadius: '6px', cursor: 'pointer' }}>Ver</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '30px' }}>
          <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${c.border}`, borderRadius: '6px', cursor: 'pointer' }}>Anterior</button>
          <span style={{ color: c.textSub }}>Página {currentPage} de {totalPages}</span>
          <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${c.border}`, borderRadius: '6px', cursor: 'pointer' }}>Siguiente</button>
        </div>
      )}
    </>
  );

  // ============================================================
  // PANEL DE ANALÍTICAS (COMPLETO, CON TODAS LAS MEJORAS)
  // ============================================================
  const renderAnalyticsPanel = () => {
    if (loadingAnalytics) return <div style={{ textAlign: 'center', padding: '40px' }}>Cargando estadísticas...</div>;
    if (!stats) return <div style={{ textAlign: 'center', padding: '40px', color: c.error }}>Error al cargar estadísticas</div>;

    const totalSales = stats.total_sales || 0;
    const totalRevenue = stats.total_revenue || 0;
    const averageOrderValue = stats.average_order_value || 0;
    const abandonmentRate = stats.abandonment_rate || 0;
    const addToCart = stats.event_counts?.add_to_cart || 0;
    const beginCheckout = stats.event_counts?.begin_checkout || 0;
    const conversionRates = stats.conversion_rates || {};
    const topProducts = stats.top_products || [];
    const topViewed = stats.top_viewed_products || [];
    const salesByDay = stats.sales_by_day || [];
    const eventsTimeline = stats.events_timeline || [];
    const productPerformance = stats.product_performance || [];
    const errorsTimeline = stats.errors_timeline || [];
    const sessionStats = stats.session_stats || null;
    const retentionMetrics = stats.retention_metrics || null;

    return (
      <>
        {/* ========== 1. KPIs CON TENDENCIAS ========== */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <div style={glassCard}>
            <div style={{ fontSize: '14px', color: c.textSub, marginBottom: '8px' }}>Total Ventas <TrendIndicator current={totalSales} previous={0} /></div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: c.primary }}>{totalSales}</div>
          </div>
          <div style={glassCard}>
            <div style={{ fontSize: '14px', color: c.textSub, marginBottom: '8px' }}>Ingresos Totales</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: c.success }}>${totalRevenue.toLocaleString()}</div>
          </div>
          <div style={glassCard}>
            <div style={{ fontSize: '14px', color: c.textSub, marginBottom: '8px' }}>Valor Prom. Pedido</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: c.accent }}>${averageOrderValue.toLocaleString()}</div>
          </div>
          <div style={glassCard}>
            <div style={{ fontSize: '14px', color: c.textSub, marginBottom: '8px' }}>Tasa de Abandono <TrendIndicator current={abandonmentRate} previous={0} reverseColors /></div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: c.warning }}>{abandonmentRate}%</div>
          </div>
        </div>

        {/* ========== 2. MODO DE MÉTRICAS (toggle) ========== */}
        <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: c.textSub, fontSize: '14px' }}>Modo de métricas:</span>
          <button
            onClick={() => setAnalyticsMode('total')}
            style={chipStyle(analyticsMode === 'total')}
          >
            Totales
          </button>
          <button
            onClick={() => setAnalyticsMode('unique')}
            style={chipStyle(analyticsMode === 'unique')}
          >
            Únicas (sesiones)
          </button>
        </div>

        {/* ========== 3. RETENCIÓN (tarjetas) ========== */}
        {retentionMetrics && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '30px' }}>
            <div style={glassCard}>
              <div style={{ fontSize: '14px', color: c.textSub }}>Tasa de Recompra</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: c.success }}>{retentionMetrics.repurchase_rate}%</div>
            </div>
            <div style={glassCard}>
              <div style={{ fontSize: '14px', color: c.textSub }}>Clientes Recurrentes</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: c.primary }}>{retentionMetrics.recurrent_customers}</div>
            </div>
            <div style={glassCard}>
              <div style={{ fontSize: '14px', color: c.textSub }}>Compradores Únicos</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: c.accent }}>{retentionMetrics.total_unique_buyers}</div>
            </div>
          </div>
        )}

        {/* ========== 4. ÚLTIMAS COMPRAS ========== */}
        {recentPurchases.length > 0 && (
          <div style={{ ...glassCard, marginBottom: '40px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '20px', color: c.textMain }}>🛍️ Últimas compras</h2>
            <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
              {recentPurchases.map((order, idx) => (
                <div key={order.id || idx} style={{
                  minWidth: '220px', background: 'rgba(184,134,11,0.08)', borderRadius: '16px',
                  padding: '16px', border: `1px solid ${c.border}`,
                  animation: `fadeInUp 0.3s ease-out ${idx * 0.08}s both`
                }}>
                  <div style={{ fontSize: '12px', color: c.primary, marginBottom: '8px', fontWeight: '600' }}>{order.order_number}</div>
                  <div style={{ fontSize: '14px', color: c.textMain, marginBottom: '4px', fontWeight: '500' }}>{order.shipping_address?.name || 'Cliente'}</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: c.success }}>${order.total?.toLocaleString()}</div>
                  <div style={{ fontSize: '11px', color: c.textSub, marginTop: '4px' }}>
                    {new Date(order.created_at + 'Z').toLocaleString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========== 5. GAUGE DE CONVERSIÓN ========== */}
        <div style={{ marginBottom: '40px' }}>
          <GaugeChart value={conversionRates.visit_to_cart || 0} title="Visitante → Carrito" />
        </div>

        {/* ========== 6. SESIONES ========== */}
        {sessionStats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '30px' }}>
            <div style={glassCard}><div style={{ fontSize: '14px', color: c.textSub }}>Sesiones únicas</div><div style={{ fontSize: '28px', fontWeight: 'bold', color: ANALYTICS_COLORS.bar.sales }}>{sessionStats.unique_sessions}</div></div>
            <div style={glassCard}><div style={{ fontSize: '14px', color: c.textSub }}>Prom. eventos/sesión</div><div style={{ fontSize: '28px', fontWeight: 'bold', color: ANALYTICS_COLORS.timeline.add_to_cart }}>{sessionStats.avg_events_per_session}</div></div>
            <div style={glassCard}><div style={{ fontSize: '14px', color: c.textSub }}>Sesiones con compra</div><div style={{ fontSize: '28px', fontWeight: 'bold', color: ANALYTICS_COLORS.timeline.purchase }}>{sessionStats.sessions_with_purchase}</div></div>
          </div>
        )}

        {/* ========== 7. EMBUDO DE CONVERSIÓN COMPLETO ========== */}
        {funnel && funnel.length > 0 && (
          <div style={{ ...glassCard, marginBottom: '40px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '20px', color: c.textMain }}>🔽 Embudo de conversión (sesiones únicas)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={funnel.map(f => ({ ...f, label: f.step === 'page_view' ? 'Visitas' : f.step === 'product_view' ? 'Vieron producto' : f.step === 'add_to_cart' ? 'Agregaron al carrito' : f.step === 'begin_checkout' ? 'Iniciaron checkout' : 'Compraron' }))} layout="vertical">
                <CartesianGrid stroke={c.border} strokeDasharray="3 3" />
                <XAxis type="number" stroke={c.textSub} />
                <YAxis dataKey="label" type="category" width={150} stroke={c.textSub} />
                <Tooltip contentStyle={{ backgroundColor: c.card, border: `1px solid ${c.border}`, borderRadius: '8px' }} />
                <Bar dataKey="count" name="Sesiones únicas">
                  {funnel.map((entry, index) => <Cell key={`cell-${index}`} fill={ANALYTICS_COLORS.funnelSteps[index % ANALYTICS_COLORS.funnelSteps.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {funnel.length >= 2 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', marginTop: 16, color: c.textSub, gap: '12px' }}>
                {funnel.slice(0, -1).map((step, idx) => {
                  const next = funnel[idx + 1];
                  const rate = step.count > 0 ? ((next.count / step.count) * 100).toFixed(1) : 0;
                  const label1 = step.step === 'page_view' ? 'Visitas' : step.step === 'product_view' ? 'Vieron' : step.step === 'add_to_cart' ? 'Carrito' : 'Checkout';
                  const label2 = next.step === 'product_view' ? 'Vieron' : next.step === 'add_to_cart' ? 'Carrito' : next.step === 'begin_checkout' ? 'Checkout' : 'Compra';
                  return <span key={idx}>{label1} → {label2}: <strong style={{ color: c.primary }}>{rate}%</strong></span>;
                })}
              </div>
            )}
          </div>
        )}

        {/* ========== 8. EMBUDO DE PAGO (CORREGIDO) ========== */}
        {stats.checkout_started_count !== undefined && stats.checkout_started_count !== null && (
          <div style={{ ...glassCard, marginBottom: '40px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '20px', color: c.textMain }}>⏳ Embudo de pago</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={[
                  { etapa: 'Checkout iniciado', usuarios: stats.checkout_started_count ?? 0 },
                  { etapa: 'Datos pago ingresados', usuarios: stats.payment_info_entered_count ?? 0 },
                  { etapa: 'Compra completada', usuarios: stats.order_completed_count ?? 0 }
                ]}
                layout="vertical"
              >
                <CartesianGrid stroke={c.border} strokeDasharray="3 3" />
                <XAxis type="number" stroke={c.textSub} />
                <YAxis dataKey="etapa" type="category" width={150} stroke={c.textSub} />
                <Tooltip contentStyle={{ backgroundColor: c.card, border: `1px solid ${c.border}`, borderRadius: '8px' }} />
                <Bar dataKey="usuarios" fill={ANALYTICS_COLORS.funnel} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, color: c.textSub }}>
              <span>Checkout → Pago: <strong style={{ color: ANALYTICS_COLORS.timeline.add_to_cart }}>{stats.conversion_checkout_to_payment ?? 0}%</strong></span>
              <span>Pago → Compra: <strong style={{ color: ANALYTICS_COLORS.timeline.purchase }}>{stats.conversion_payment_to_order ?? 0}%</strong></span>
            </div>
          </div>
        )}

        {/* ========== 9. EVOLUCIÓN DE EVENTOS ========== */}
        <div style={{ ...glassCard, marginBottom: '40px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '20px', fontWeight: '600', color: c.textMain }}>📊 Evolución de eventos</h2>
          {eventsTimeline.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={eventsTimeline}>
                <CartesianGrid stroke={c.border} strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke={c.textSub} />
                <YAxis stroke={c.textSub} />
                <Tooltip contentStyle={{ backgroundColor: c.card, border: `1px solid ${c.border}`, borderRadius: '8px' }} />
                <Legend />
                <Line type="monotone" dataKey="product_view" stroke={ANALYTICS_COLORS.timeline.product_view} name="Vistas" strokeWidth={2} />
                <Line type="monotone" dataKey="add_to_cart" stroke={ANALYTICS_COLORS.timeline.add_to_cart} name="Agregados" strokeWidth={2} />
                <Line type="monotone" dataKey="begin_checkout" stroke={ANALYTICS_COLORS.timeline.begin_checkout} name="Checkout" strokeWidth={2} />
                <Line type="monotone" dataKey="purchase" stroke={ANALYTICS_COLORS.timeline.purchase} name="Compras" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ textAlign: 'center', color: c.textSub }}>No hay datos de eventos en los últimos 7 días.</p>
          )}
        </div>

        {/* ========== 10. VENTAS POR DÍA ========== */}
        <div style={{ ...glassCard, marginBottom: '40px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '20px', fontWeight: '600', color: c.textMain }}>📈 Ventas por día</h2>
          {salesByDay.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesByDay}>
                <CartesianGrid stroke={c.border} strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke={c.textSub} />
                <YAxis stroke={c.textSub} />
                <Tooltip contentStyle={{ backgroundColor: c.card, border: `1px solid ${c.border}`, borderRadius: '8px' }} />
                <Line type="monotone" dataKey="count" stroke={ANALYTICS_COLORS.timeline.product_view} strokeWidth={2} name="Ventas" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ textAlign: 'center', color: c.textSub }}>No hay ventas registradas en los últimos 7 días.</p>
          )}
        </div>

        {/* ========== 11. TOP PRODUCTOS ========== */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '40px' }}>
          <div style={glassCard}>
            <h2 style={{ fontSize: '18px', marginBottom: '20px', fontWeight: '600', color: c.textMain }}>🏆 Más vendidos</h2>
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid stroke={c.border} strokeDasharray="3 3" />
                  <XAxis type="number" stroke={c.textSub} />
                  <YAxis dataKey="slug" type="category" width={150} stroke={c.textSub} />
                  <Tooltip contentStyle={{ backgroundColor: c.card, border: `1px solid ${c.border}`, borderRadius: '8px' }} />
                  <Bar dataKey="count" fill={ANALYTICS_COLORS.bar.sales} name="Unidades" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ textAlign: 'center', color: c.textSub }}>Sin datos</p>
            )}
          </div>
          <div style={glassCard}>
            <h2 style={{ fontSize: '18px', marginBottom: '20px', fontWeight: '600', color: c.textMain }}>👁️ Más vistos</h2>
            {topViewed.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topViewed} layout="vertical">
                  <CartesianGrid stroke={c.border} strokeDasharray="3 3" />
                  <XAxis type="number" stroke={c.textSub} />
                  <YAxis dataKey="slug" type="category" width={150} stroke={c.textSub} />
                  <Tooltip contentStyle={{ backgroundColor: c.card, border: `1px solid ${c.border}`, borderRadius: '8px' }} />
                  <Bar dataKey="count" fill={ANALYTICS_COLORS.bar.views} name="Visitas" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ textAlign: 'center', color: c.textSub }}>Sin datos</p>
            )}
          </div>
        </div>

        {/* ========== 12. RENDIMIENTO POR PRODUCTO ========== */}
        {productPerformance.length > 0 && (
          <div style={{ ...glassCard, marginBottom: '40px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '20px', fontWeight: '600', color: c.textMain }}>📋 Rendimiento por producto</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${c.border}` }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: c.textSub }}>Producto</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: c.textSub }}>Vistas</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: c.textSub }}>Carritos</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: c.textSub }}>Compras</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: c.textSub }}>Conversión</th>
                  </tr>
                </thead>
                <tbody>
                  {productPerformance.map((prod, idx) => (
                    <tr key={prod.slug} style={{ borderBottom: `1px solid ${c.border}`, animation: `fadeInUp 0.3s ease-out ${idx * 0.05}s both` }}>
                      <td style={{ padding: '12px', fontWeight: '500', color: c.primary }}>{prod.name || prod.slug}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: c.textMain }}>{prod.views}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: c.textMain }}>{prod.add_to_cart}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: c.textMain }}>{prod.purchases}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          backgroundColor: prod.conversion_rate >= 5 ? c.success : c.textWeak,
                          color: '#fff',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {prod.conversion_rate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========== 13. ERRORES POR DÍA ========== */}
        {errorsTimeline.length > 0 && (
          <div style={{ ...glassCard, marginBottom: '40px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '20px', fontWeight: '600', color: c.textMain }}>⚠️ Errores por día</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={errorsTimeline}>
                <CartesianGrid stroke={c.border} strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke={c.textSub} />
                <YAxis stroke={c.textSub} />
                <Tooltip contentStyle={{ backgroundColor: c.card, border: `1px solid ${c.border}` }} />
                <Legend />
                <Line type="monotone" dataKey="payment_error" stroke={ANALYTICS_COLORS.timeline.error} name="Error de pago" strokeWidth={2} />
                <Line type="monotone" dataKey="address_error" stroke={ANALYTICS_COLORS.timeline.begin_checkout} name="Error de dirección" strokeWidth={2} />
                <Line type="monotone" dataKey="checkout_error" stroke={ANALYTICS_COLORS.timeline.add_to_cart} name="Error checkout" strokeWidth={2} />
                <Line type="monotone" dataKey="payment_confirmation_error" stroke={ANALYTICS_COLORS.timeline.product_view} name="Error confirmación" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ========== 14. DISTRIBUCIÓN DE EVENTOS (PASTEL) ========== */}
        {stats.event_counts && Object.values(stats.event_counts).some(v => v > 0) && (
          <div style={glassCard}>
            <h2 style={{ fontSize: '20px', marginBottom: '20px', fontWeight: '600', color: c.textMain }}>📊 Distribución de eventos</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(stats.event_counts).map(([key, val]) => ({
                    name: key === 'product_view' ? 'Vistas' : key === 'add_to_cart' ? 'Agregados' : key === 'begin_checkout' ? 'Checkout' : 'Compras',
                    value: val
                  })).filter(item => item.value > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.entries(stats.event_counts).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={ANALYTICS_COLORS.pie[index % ANALYTICS_COLORS.pie.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: c.card, border: `1px solid ${c.border}`, borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ========== 15. ALERTAS INTELIGENTES ========== */}
        {alerts.length > 0 && (
          <div style={{ ...glassCard, marginTop: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <span style={{ fontSize: '24px' }}>🔔</span>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: c.textMain, margin: 0 }}>Alertas</h2>
              {alerts.some(a => a.severity === 'critical') && (
                <span style={{
                  backgroundColor: c.error,
                  color: '#fff',
                  padding: '2px 10px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  marginLeft: '8px'
                }}>
                  {alerts.filter(a => a.severity === 'critical').length} críticas
                </span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {alerts.map((alert, idx) => (
                <div key={idx} style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: alert.severity === 'critical' ? 'rgba(219,68,55,0.15)' :
                              alert.severity === 'warning' ? 'rgba(244,180,0,0.15)' :
                              'rgba(66,133,244,0.1)',
                  borderLeft: `4px solid ${
                    alert.severity === 'critical' ? c.error :
                    alert.severity === 'warning' ? c.warning :
                    ANALYTICS_COLORS.timeline.product_view
                  }`,
                  fontSize: '14px'
                }}>
                  <span style={{ fontWeight: '600', color: c.textMain }}>{alert.message}</span>
                  <span style={{ marginLeft: '8px', fontSize: '11px', color: c.textSub }}>
                    {new Date(alert.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========== 16. ANÁLISIS RFM ========== */}
        {rfmData.length > 0 && (
          <div style={{ ...glassCard, marginTop: '40px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '20px', fontWeight: '600', color: c.textMain }}>💎 Segmentación RFM</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${c.border}` }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: c.textSub }}>Usuario</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: c.textSub }}>Recencia (días)</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: c.textSub }}>Frecuencia</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: c.textSub }}>Monetario</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: c.textSub }}>Segmento</th>
                  </tr>
                </thead>
                <tbody>
                  {rfmData.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: `1px solid ${c.border}` }}>
                      <td style={{ padding: '12px', color: c.primary }}>{item.user_id || 'Anónimo'}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: c.textMain }}>{item.recency}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: c.textMain }}>{item.frequency}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: c.textMain }}>${item.monetary.toLocaleString()}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          backgroundColor:
                            item.segmento === 'VIP' ? c.success :
                            item.segmento === 'Leal' ? c.primary :
                            item.segmento === 'En riesgo' ? c.warning :
                            c.error,
                          color: '#fff',
                          padding: '2px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {item.segmento}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </>
    );
  };

  // ============================================================
  // RENDER PRINCIPAL (SIN CAMBIOS)
  // ============================================================
  if (loadingOrders) {
    return (
      <div style={{ backgroundColor: c.bg, minHeight: '100vh', color: c.textMain, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
        <div className="spinner"></div>
        <p>Cargando panel de administración...</p>
        <style jsx>{` .spinner { width: 40px; height: 40px; border: 3px solid ${c.border}; border-top: 3px solid ${c.primary}; border-radius: 50%; animation: spin 1s linear infinite; } @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ backgroundColor: c.bg, minHeight: '100vh', color: c.textMain, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
        <p style={{ color: c.error }}>Error: {error}</p>
        <button onClick={() => router.push('/')} style={{ padding: '10px 20px', backgroundColor: c.primary, color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Volver al inicio</button>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: c.bg, minHeight: '100vh', color: c.textMain }}>
      <Toaster position="top-right" toastOptions={{ style: { background: c.card, color: c.textMain, border: `1px solid ${c.border}` } }} />
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: 'clamp(20px, 5vw, 40px) clamp(16px, 4vw, 20px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '15px' }}>
          <h1 style={{ fontSize: 'clamp(24px, 6vw, 28px)', fontWeight: '800', animation: 'fadeInDown 0.6s ease-out' }}>Panel de <span style={{ color: c.primary }}>Administración</span></h1>
          <button onClick={() => router.push('/')} style={{ padding: '8px 16px', backgroundColor: 'transparent', color: c.textSub, border: `1px solid ${c.border}`, borderRadius: '6px', cursor: 'pointer' }}>← Volver a la tienda</button>
        </div>
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', borderBottom: `1px solid ${c.border}` }}>
          <button onClick={() => setActiveTab('orders')} style={{ padding: '12px 0', background: 'none', border: 'none', color: activeTab === 'orders' ? c.primary : c.textSub, fontWeight: '600', fontSize: '16px', cursor: 'pointer', borderBottom: activeTab === 'orders' ? `2px solid ${c.primary}` : '2px solid transparent' }}>📋 Pedidos</button>
          <button onClick={() => setActiveTab('analytics')} style={{ padding: '12px 0', background: 'none', border: 'none', color: activeTab === 'analytics' ? c.primary : c.textSub, fontWeight: '600', fontSize: '16px', cursor: 'pointer', borderBottom: activeTab === 'analytics' ? `2px solid ${c.primary}` : '2px solid transparent' }}>📊 Analíticas</button>
        </div>
        {activeTab === 'orders' ? renderOrdersPanel() : renderAnalyticsPanel()}
      </div>
      <style jsx global>{` @keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } } @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } `}</style>
    </div>
  );
}
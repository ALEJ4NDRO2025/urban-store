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
const ITEMS_PER_PAGE = 10; // Paginación de la sección "Pedidos"
// Paleta de colores profesional para analíticas
const CHART_COLORS = {
  line: '#3B82F6',      // Azul moderno (ventas)
  bar: '#10B981',       // Verde esmeralda (productos)
  pie: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'], // Eventos
  grid: '#2D2D3D',      // Gris oscuro para cuadrícula
  text: '#9CA3AF',      // Gris suave para etiquetas
  kpi: {
    sales: '#3B82F6',
    abandonment: '#F59E0B',
    addToCart: '#10B981',
    checkout: '#8B5CF6',
  }
};

export default function AdminPage() {
  const router = useRouter();

  // --- Estados para la pestaña "Pedidos" ---
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // --- Estados para la pestaña "Analíticas" ---
  const [stats, setStats] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // ============================================================
  // CARGA DE DATOS
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

  useEffect(() => {
    if (activeTab !== 'analytics') return;

    const token = localStorage.getItem('access');
    if (!token) return;

    setLoadingAnalytics(true);
    fetch(`${API_URL}/api/analytics/dashboard-stats/`, {
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
  }, [activeTab]);

  // ============================================================
  // FUNCIONES PARA PEDIDOS
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

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchTerm, sortBy, sortOrder]);

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
    background: 'rgba(26,26,26,0.6)',
    backdropFilter: 'blur(12px)',
    borderRadius: '16px',
    padding: '20px',
    border: `1px solid ${c.border}`,
    transition: 'all 0.3s ease',
  };

  const chipStyle = (isActive) => ({
    padding: '8px 20px',
    borderRadius: '40px',
    background: isActive ? c.primary : 'rgba(255,255,255,0.05)',
    color: isActive ? '#000' : c.textMain,
    border: isActive ? 'none' : `1px solid ${c.border}`,
    cursor: 'pointer',
    fontWeight: isActive ? 'bold' : 'normal',
    transition: 'all 0.2s',
    fontSize: '14px',
  });

  // ============================================================
  // RENDER: PESTAÑA PEDIDOS
  // ============================================================
  const renderOrdersPanel = () => (
    <>
      {/* KPIs de pedidos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        <div style={glassCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', color: c.textSub }}>Total Pedidos</span>
            <span style={{ fontSize: '24px' }}>📦</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: c.primary }}>{totalOrders}</div>
        </div>
        <div style={glassCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', color: c.textSub }}>Ingresos Totales</span>
            <span style={{ fontSize: '24px' }}>💰</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: c.primary }}>${totalRevenue.toLocaleString()}</div>
        </div>
        <div style={glassCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', color: c.textSub }}>Pendientes</span>
            <span style={{ fontSize: '24px' }}>⏳</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#e65100' }}>{pendingOrders}</div>
        </div>
        <div style={glassCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', color: c.textSub }}>Pagados</span>
            <span style={{ fontSize: '24px' }}>✅</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#2e7d32' }}>{paidOrders}</div>
        </div>
      </div>

      {/* Filtros */}
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
              type="text"
              placeholder="🔍 Buscar por nº orden o email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '8px 16px',
                background: c.input,
                border: `1px solid ${c.border}`,
                borderRadius: '40px',
                color: c.textMain,
                fontSize: '14px',
                minWidth: '240px',
              }}
            />
            <button
              onClick={clearFilters}
              style={{
                padding: '8px 20px',
                background: 'transparent',
                border: `1px solid ${c.border}`,
                borderRadius: '40px',
                color: c.textSub,
                cursor: 'pointer',
              }}
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de pedidos */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${c.border}` }}>
              <th style={{ padding: '16px', textAlign: 'left', cursor: 'pointer' }} onClick={() => handleSort('order_number')}>
                Nº Orden {sortBy === 'order_number' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ padding: '16px', textAlign: 'left' }}>Cliente</th>
              <th style={{ padding: '16px', textAlign: 'left', cursor: 'pointer' }} onClick={() => handleSort('created_at')}>
                Fecha {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ padding: '16px', textAlign: 'left', cursor: 'pointer' }} onClick={() => handleSort('total')}>
                Total {sortBy === 'total' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
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
                  <td style={{ padding: '16px' }}>
                    {order.shipping_address.name}<br />
                    <span style={{ fontSize: '12px', color: c.textSub }}>{order.shipping_address.email}</span>
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px' }}>{new Date(order.created_at + 'Z').toLocaleDateString('es-CO')}</td>
                  <td style={{ padding: '16px', fontWeight: '700', color: c.primary }}>${order.total.toLocaleString()}</td>
                  <td style={{ padding: '16px' }}>
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      disabled={updatingId === order.id}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: getStatusStyle(order.status).backgroundColor,
                        color: getStatusStyle(order.status).color,
                        border: `1px solid ${c.border}`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
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
  // RENDER: PESTAÑA ANALÍTICAS (datos reales, colores profesionales)
  // ============================================================
  const renderAnalyticsPanel = () => {
    if (loadingAnalytics) return <div style={{ textAlign: 'center', padding: '40px' }}>Cargando estadísticas...</div>;
    if (!stats) return <div style={{ textAlign: 'center', padding: '40px', color: c.error }}>Error al cargar estadísticas</div>;

    const totalSales = stats.total_sales || 0;
    const abandonmentRate = stats.abandonment_rate || 0;
    const addToCart = stats.event_counts?.add_to_cart || 0;
    const beginCheckout = stats.event_counts?.begin_checkout || 0;
    const salesData = stats.sales_by_day || [];
    const topProducts = stats.top_products || [];
    const eventData = stats.event_counts ? Object.entries(stats.event_counts)
      .filter(([_, v]) => v > 0)
      .map(([key, val]) => ({
        name: key === 'product_view' ? 'Vistas' : key === 'add_to_cart' ? 'Agregados' : key === 'begin_checkout' ? 'Checkout' : 'Compras',
        value: val
      })) : [];

    return (
      <>
        {/* KPIs analíticos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '40px' }}>
          <div style={glassCard}>
            <div style={{ fontSize: '14px', color: '#9CA3AF', marginBottom: '8px' }}>Total Ventas</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: CHART_COLORS.kpi.sales }}>{totalSales}</div>
          </div>
          <div style={glassCard}>
            <div style={{ fontSize: '14px', color: '#9CA3AF', marginBottom: '8px' }}>Tasa de Abandono</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: CHART_COLORS.kpi.abandonment }}>{abandonmentRate}%</div>
          </div>
          <div style={glassCard}>
            <div style={{ fontSize: '14px', color: '#9CA3AF', marginBottom: '8px' }}>Añadidos al Carrito</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: CHART_COLORS.kpi.addToCart }}>{addToCart}</div>
          </div>
          <div style={glassCard}>
            <div style={{ fontSize: '14px', color: '#9CA3AF', marginBottom: '8px' }}>Inicios de Checkout</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: CHART_COLORS.kpi.checkout }}>{beginCheckout}</div>
          </div>
        </div>

        {/* Ventas por día */}
        <div style={{ ...glassCard, marginBottom: '40px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '20px', fontWeight: '600' }}>📈 Ventas por día</h2>
          {salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke={CHART_COLORS.text} />
                <YAxis stroke={CHART_COLORS.text} />
                <Tooltip contentStyle={{ backgroundColor: '#1E1E1E', border: `1px solid ${c.border}`, borderRadius: '8px' }} />
                <Line type="monotone" dataKey="count" stroke={CHART_COLORS.line} strokeWidth={2} name="Ventas" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ textAlign: 'center', color: '#9CA3AF' }}>No hay ventas registradas en los últimos 7 días.</p>
          )}
        </div>

        {/* Top productos */}
        <div style={{ ...glassCard, marginBottom: '40px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '20px', fontWeight: '600' }}>🏆 Top 5 productos más vendidos</h2>
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
                <XAxis type="number" stroke={CHART_COLORS.text} />
                <YAxis dataKey="slug" type="category" width={150} stroke={CHART_COLORS.text} />
                <Tooltip contentStyle={{ backgroundColor: '#1E1E1E', border: `1px solid ${c.border}`, borderRadius: '8px' }} />
                <Bar dataKey="count" fill={CHART_COLORS.bar} name="Unidades vendidas" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ textAlign: 'center', color: '#9CA3AF' }}>No hay productos vendidos en los últimos 7 días.</p>
          )}
        </div>

        {/* Distribución de eventos */}
        {eventData.length > 0 && (
          <div style={glassCard}>
            <h2 style={{ fontSize: '20px', marginBottom: '20px', fontWeight: '600' }}>📊 Distribución de eventos</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={eventData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {eventData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS.pie[index % CHART_COLORS.pie.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1E1E1E', border: `1px solid ${c.border}`, borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </>
    );
  };

  // ============================================================
  // RENDER PRINCIPAL
  // ============================================================
  if (loadingOrders) {
    return (
      <div style={{ backgroundColor: c.bg, minHeight: '100vh', color: c.textMain, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
        <div className="spinner"></div>
        <p>Cargando panel de administración...</p>
        <style jsx>{`
          .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid ${c.border};
            border-top: 3px solid ${c.primary};
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
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
        {/* Header y pestañas */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '15px' }}>
          <h1 style={{ fontSize: 'clamp(24px, 6vw, 28px)', fontWeight: '800', animation: 'fadeInDown 0.6s ease-out' }}>
            Panel de <span style={{ color: c.primary }}>Administración</span>
          </h1>
          <button onClick={() => router.push('/')} style={{ padding: '8px 16px', backgroundColor: 'transparent', color: c.textSub, border: `1px solid ${c.border}`, borderRadius: '6px', cursor: 'pointer' }}>← Volver a la tienda</button>
        </div>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', borderBottom: `1px solid ${c.border}` }}>
          <button onClick={() => setActiveTab('orders')} style={{
            padding: '12px 0',
            background: 'none',
            border: 'none',
            color: activeTab === 'orders' ? c.primary : c.textSub,
            fontWeight: '600',
            fontSize: '16px',
            cursor: 'pointer',
            borderBottom: activeTab === 'orders' ? `2px solid ${c.primary}` : '2px solid transparent',
          }}>📋 Pedidos</button>
          <button onClick={() => setActiveTab('analytics')} style={{
            padding: '12px 0',
            background: 'none',
            border: 'none',
            color: activeTab === 'analytics' ? c.primary : c.textSub,
            fontWeight: '600',
            fontSize: '16px',
            cursor: 'pointer',
            borderBottom: activeTab === 'analytics' ? `2px solid ${c.primary}` : '2px solid transparent',
          }}>📊 Analíticas</button>
        </div>

        {activeTab === 'orders' ? renderOrdersPanel() : renderAnalyticsPanel()}
      </div>

      <style jsx global>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
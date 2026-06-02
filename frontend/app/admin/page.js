'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
  AreaChart, Area
} from 'recharts';
import { c } from '../lib/styles';
import { API_URL } from '../lib/api';

// ============================================================
// CONFIGURACIÓN
// ============================================================
const ITEMS_PER_PAGE = 10;

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
  bar: { sales: '#4285F4', views: '#0F9D58' },
  funnel: '#4285F4',
  funnelSteps: ['#4E79A7', '#F28E2B', '#E15759', '#76B7B2', '#59A14F'],
};

const TRAFFIC_SOURCE_STYLES = {
  google:    { color: '#4285F4', emoji: '🔍', label: 'Google' },
  facebook:  { color: '#1877F2', emoji: '📘', label: 'Facebook' },
  instagram: { color: '#E4405F', emoji: '📸', label: 'Instagram' },
  tiktok:    { color: '#69C9D0', emoji: '🎵', label: 'TikTok' },
  twitter:   { color: '#1DA1F2', emoji: '🐦', label: 'Twitter' },
  direct:    { color: '#B8860B', emoji: '🔗', label: 'Directo' },
  referral:  { color: '#9C27B0', emoji: '🔗', label: 'Referido' },
  social:    { color: '#FF5700', emoji: '🌐', label: 'Otras redes' },
};

const COLOR_PALETTE = {
  negro: '#1a1a1a', blanco: '#f5f5f5', rojo: '#e53935', azul: '#1e88e5',
  verde: '#43a047', amarillo: '#fdd835', naranja: '#fb8c00', morado: '#8e24aa',
  gris: '#757575', rosa: '#e91e63', café: '#6d4c41', beige: '#d7ccc8',
  navy: '#1a237e', celeste: '#29b6f6', oliva: '#827717', crema: '#fff8e1',
};

function getColorDot(colorName) {
  const key = colorName.toLowerCase().trim();
  return COLOR_PALETTE[key] || null;
}

function getTrafficStyle(source) {
  return TRAFFIC_SOURCE_STYLES[source] || { color: c.textSub, emoji: '❓', label: source };
}

// ============================================================
// HOOK: ANIMATED COUNTER
// ============================================================
function useCountAnimation(target, duration = 1200, shouldStart = true) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!shouldStart || !target) return;
    let start = null;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, shouldStart]);
  return value;
}

function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 0, formatFn }) {
  const animated = useCountAnimation(value, 1200, true);
  const display = formatFn ? formatFn(animated) : (decimals > 0 ? animated.toFixed(decimals) : animated.toLocaleString());
  return <span>{prefix}{display}{suffix}</span>;
}

function StatusDot({ value, thresholds, reverseColors = false }) {
  let color = '#0F9D58';
  const [low, mid] = thresholds;
  if (reverseColors) {
    if (value >= mid) color = '#DB4437';
    else if (value >= low) color = '#F4B400';
    else color = '#0F9D58';
  } else {
    if (value >= mid) color = '#0F9D58';
    else if (value >= low) color = '#F4B400';
    else color = '#DB4437';
  }
  return (
    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: color, boxShadow: `0 0 6px ${color}`, marginRight: 6, flexShrink: 0 }} />
  );
}

function Sparkline({ data = [], color = '#B8860B', width = 80, height = 32 }) {
  if (!data || data.length < 2) return null;
  const vals = data.map(d => (typeof d === 'object' ? (d.count || d.value || 0) : d));
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.9 }} />
    </svg>
  );
}

function KPICard({ label, value, prefix = '', suffix = '', color, icon, sparkData, sparkColor, statusThresholds, reverseStatus, formatFn, gradient }) {
  return (
    <div style={{
      background: gradient || 'rgba(26,26,26,0.6)',
      backdropFilter: 'blur(16px)',
      borderRadius: 20, padding: '22px 24px',
      border: '1px solid rgba(255,255,255,0.07)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      display: 'flex', flexDirection: 'column', gap: 10,
      position: 'relative', overflow: 'hidden',
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.5)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)'; }}
    >
      <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: `radial-gradient(circle at top right, ${color}22, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {statusThresholds && <StatusDot value={value} thresholds={statusThresholds} reverseColors={reverseStatus} />}
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 500, letterSpacing: '0.02em' }}>{label}</span>
        </div>
        <span style={{ fontSize: 22 }}>{icon}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 30, fontWeight: 800, color, letterSpacing: '-0.02em', lineHeight: 1 }}>
          <AnimatedNumber value={value} prefix={prefix} suffix={suffix} formatFn={formatFn} />
        </div>
        {sparkData && <Sparkline data={sparkData} color={sparkColor || color} />}
      </div>
    </div>
  );
}

function GaugeChart({ value = 0, title = 'Tasa de Conversión', max = 100 }) {
  const percentage = Math.min(value, max);
  const radius = 72, strokeWidth = 11;
  const circumference = Math.PI * radius;
  const offset = circumference - (percentage / max) * circumference;
  const getColor = (val) => {
    if (val >= 5) return '#0F9D58';
    if (val >= 2) return '#F4B400';
    return '#DB4437';
  };
  const col = getColor(percentage);
  return (
    <div style={{ background: 'rgba(26,26,26,0.6)', backdropFilter: 'blur(16px)', borderRadius: 20, padding: '24px', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h3 style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 16, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{title}</h3>
      <svg width="180" height="108" viewBox="0 0 180 108" style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={col} stopOpacity="0.4" />
            <stop offset="100%" stopColor={col} />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <path d={`M 18 90 A ${radius} ${radius} 0 0 1 162 90`} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} strokeLinecap="round" />
        <path d={`M 18 90 A ${radius} ${radius} 0 0 1 162 90`} fill="none" stroke="url(#gaugeGrad)" strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)', filter: 'url(#glow)' }} />
        <text x="90" y="82" textAnchor="middle" fontSize="30" fontWeight="800" fill={col} fontFamily="monospace">{percentage.toFixed(1)}%</text>
        <text x="90" y="102" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.4)" letterSpacing="0.08em">{percentage >= 5 ? 'EXCELENTE' : percentage >= 2 ? 'MEJORABLE' : 'URGENTE'}</text>
      </svg>
    </div>
  );
}

function TrafficSourceCard({ source, sessions, maxSessions, rank }) {
  const style = getTrafficStyle(source);
  const pct = maxSessions > 0 ? (sessions / maxSessions) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: 'rgba(255,255,255,0.03)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', transition: 'background 0.2s, transform 0.2s', animation: `fadeInUp 0.4s ease-out ${rank * 0.07}s both` }}
    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.transform = 'translateX(0)'; }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: `${style.color}22`, border: `1px solid ${style.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{style.emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{style.label}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: style.color, fontFamily: 'monospace' }}>{sessions.toLocaleString()}</span>
        </div>
        <div style={{ height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${style.color}88, ${style.color})`, borderRadius: 4, transition: 'width 1s cubic-bezier(0.4,0,0.2,1)', boxShadow: `0 0 8px ${style.color}66` }} />
        </div>
      </div>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', flexShrink: 0 }}>{pct.toFixed(0)}%</span>
    </div>
  );
}

function ConversionFunnel({ funnel }) {
  if (!funnel || funnel.length === 0) return <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: 40 }}>Sin datos de embudo</p>;
  const maxCount = funnel[0]?.count || 1;
  const stepLabels = { page_view: 'Visitas', product_view: 'Vieron producto', add_to_cart: 'Al carrito', begin_checkout: 'Checkout', purchase: 'Compras' };
  const stepColors = ['#4E79A7', '#F28E2B', '#E15759', '#76B7B2', '#59A14F'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '0 8px' }}>
      {funnel.map((step, idx) => {
        const next = funnel[idx + 1];
        const pct = (step.count / maxCount) * 100;
        const dropRate = next ? (((step.count - next.count) / step.count) * 100).toFixed(1) : null;
        const col = stepColors[idx % stepColors.length];
        return (
          <div key={step.step} style={{ animation: `fadeInUp 0.4s ease-out ${idx * 0.1}s both` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ width: 24, height: 24, borderRadius: 8, background: `${col}33`, border: `1px solid ${col}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: col, flexShrink: 0 }}>{idx + 1}</div>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', flex: 1 }}>{stepLabels[step.step] || step.step}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: col, fontFamily: 'monospace' }}>{step.count.toLocaleString()}</span>
            </div>
            <div style={{ height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${col}66, ${col})`, borderRadius: 8, transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)', display: 'flex', alignItems: 'center', paddingLeft: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: '#fff', opacity: 0.8 }}>{pct.toFixed(1)}%</span>
              </div>
            </div>
            {dropRate && <div style={{ textAlign: 'right', fontSize: 10, color: 'rgba(255,100,100,0.6)', marginTop: 2 }}>↓ {dropRate}% drop</div>}
          </div>
        );
      })}
    </div>
  );
}

function AlertItem({ alert, index }) {
  const colors = {
    critical: { bg: 'rgba(219,68,55,0.12)', border: '#DB4437' },
    warning:  { bg: 'rgba(244,180,0,0.10)', border: '#F4B400' },
    info:     { bg: 'rgba(66,133,244,0.10)', border: '#4285F4' },
  };
  const s = colors[alert.severity] || colors.info;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', borderRadius: 12, background: s.bg, borderLeft: `3px solid ${s.border}`, animation: `slideInRight 0.4s ease-out ${index * 0.08}s both` }}>
      <span style={{ fontSize: 16, marginTop: 1 }}>{alert.severity === 'critical' ? '🚨' : alert.severity === 'warning' ? '⚠️' : 'ℹ️'}</span>
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>{alert.message}</span>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>{new Date(alert.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
    </div>
  );
}

function RFMBadge({ segment }) {
  const styles = {
    VIP:         { bg: 'rgba(15,157,88,0.15)', color: '#0F9D58', border: 'rgba(15,157,88,0.3)', icon: '💎' },
    Leal:        { bg: 'rgba(66,133,244,0.15)', color: '#4285F4', border: 'rgba(66,133,244,0.3)', icon: '⭐' },
    'En riesgo': { bg: 'rgba(244,180,0,0.15)', color: '#F4B400', border: 'rgba(244,180,0,0.3)', icon: '⚡' },
    Inactivo:    { bg: 'rgba(219,68,55,0.15)', color: '#DB4437', border: 'rgba(219,68,55,0.3)', icon: '💤' },
  };
  const s = styles[segment] || { bg: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', border: 'rgba(255,255,255,0.15)', icon: '•' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 20, background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontSize: 12, fontWeight: 700 }}>
      {s.icon} {segment}
    </span>
  );
}

function SectionHeader({ icon, title, subtitle }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: 'rgba(255,255,255,0.9)', margin: 0, letterSpacing: '-0.01em' }}>{title}</h2>
      </div>
      {subtitle && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: '4px 0 0 26px' }}>{subtitle}</p>}
    </div>
  );
}

function FieldError({ errors }) {
  if (!errors || errors.length === 0) return null;
  return <span style={{ fontSize: 12, color: '#DB4437', marginTop: 4, display: 'block' }}>{Array.isArray(errors) ? errors[0] : errors}</span>;
}

// ============================================================
// COMPONENTE: TAG INPUT (tallas / colores)
// ============================================================
function TagInput({ label, placeholder, values, onChange, colorMode = false }) {
  const [inputVal, setInputVal] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === ',' || e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      const tag = inputVal.trim().replace(/,/g, '');
      if (tag && !values.includes(tag)) {
        onChange([...values, tag]);
      }
      setInputVal('');
    } else if (e.key === 'Backspace' && inputVal === '' && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  };

  const handleChange = (e) => {
    const raw = e.target.value;
    if (raw.includes(',')) {
      const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
      const newTags = parts.slice(0, -1).filter(t => !values.includes(t));
      if (newTags.length > 0) onChange([...values, ...newTags]);
      setInputVal(parts[parts.length - 1] || '');
    } else {
      setInputVal(raw);
    }
  };

  const removeTag = (tag) => onChange(values.filter(v => v !== tag));

  return (
    <div>
      <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, display: 'block' }}>{label}</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, minHeight: 44, alignItems: 'center', cursor: 'text' }}
        onClick={e => e.currentTarget.querySelector('input')?.focus()}>
        {values.map((tag) => {
          const dot = colorMode ? getColorDot(tag) : null;
          return (
            <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(184,134,11,0.18)', color: c.primary, padding: '3px 10px 3px 8px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: '1px solid rgba(184,134,11,0.3)' }}>
              {dot && <span style={{ width: 10, height: 10, borderRadius: '50%', background: dot, border: '1px solid rgba(255,255,255,0.3)', flexShrink: 0 }} />}
              {tag}
              <button onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 0, fontSize: 13, lineHeight: 1, marginLeft: 2, display: 'flex', alignItems: 'center' }}>×</button>
            </span>
          );
        })}
        <input
          value={inputVal}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={values.length === 0 ? placeholder : ''}
          style={{ flex: 1, minWidth: 80, background: 'none', border: 'none', outline: 'none', color: 'rgba(255,255,255,0.8)', fontSize: 13 }}
        />
      </div>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 4, display: 'block' }}>Escribe y presiona coma o Enter para agregar</span>
    </div>
  );
}

// ============================================================
// ESTILOS COMPARTIDOS
// ============================================================
const glassCard = {
  background: 'rgba(18,18,18,0.65)',
  backdropFilter: 'blur(20px)',
  borderRadius: 20, padding: '24px',
  border: '1px solid rgba(255,255,255,0.07)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
};

const tooltipStyle = { backgroundColor: 'rgba(18,18,18,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 13 };

const chipStyle = (isActive) => ({
  padding: '7px 18px', borderRadius: 40,
  background: isActive ? c.primary : 'rgba(255,255,255,0.05)',
  color: isActive ? '#000' : 'rgba(255,255,255,0.45)',
  border: isActive ? 'none' : '1px solid rgba(255,255,255,0.1)',
  cursor: 'pointer', fontWeight: isActive ? 700 : 500,
  transition: 'all 0.2s', fontSize: 13,
});

const inputStyle = (hasError = false) => ({
  padding: '10px 14px',
  background: 'rgba(255,255,255,0.05)',
  border: `1px solid ${hasError ? '#DB4437' : 'rgba(255,255,255,0.1)'}`,
  borderRadius: 10, color: 'rgba(255,255,255,0.8)',
  fontSize: 13, outline: 'none', width: '100%',
});

// ============================================================
// PÁGINA PRINCIPAL
// ============================================================
export default function AdminPage() {
  const router = useRouter();

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
  const [alerts, setAlerts] = useState([]);
  const [rfmData, setRfmData] = useState([]);
  const [analyticsMode, setAnalyticsMode] = useState('total');
  const [trafficData, setTrafficData] = useState([]);
  const [timePeriod, setTimePeriod] = useState('7');

  // --- Productos ---
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productSortBy, setProductSortBy] = useState('created_at');
  const [productSortOrder, setProductSortOrder] = useState('desc');
  const [productPage, setProductPage] = useState(1);
  const [showProductDrawer, setShowProductDrawer] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '', slug: '', description: '', price: '', category: '', stock: '',
    sizes: [], colors: [], images: [],
    stock_by_variant: {}
  });
  const [savingProduct, setSavingProduct] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // --- Stock ---
  const [stockData, setStockData] = useState([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [stockFilter, setStockFilter] = useState('all');

  // ============================================================
  // EFECTOS
  // ============================================================
  useEffect(() => {
    const token = localStorage.getItem('access');
    if (!token) { router.push('/login'); return; }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload.is_admin) { router.push('/'); return; }
    } catch { router.push('/login'); return; }

    fetch(`${API_URL}/api/orders/all/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => { if (!res.ok) throw new Error('No autorizado'); return res.json(); })
      .then(data => { setOrders(data); setLoadingOrders(false); })
      .catch(err => { setError(err.message); setLoadingOrders(false); });
  }, [router]);

  useEffect(() => {
    if (activeTab !== 'analytics') return;
    const token = localStorage.getItem('access');
    if (!token) return;
    setLoadingAnalytics(true);
    const now = new Date();
    const end = now.toISOString().split('T')[0];
    const start = new Date(now - timePeriod * 86400000).toISOString().split('T')[0];
    fetch(`${API_URL}/api/analytics/dashboard-stats/?mode=${analyticsMode}&start=${start}&end=${end}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => { setStats(data); setTrafficData(data.traffic_sources || []); setLoadingAnalytics(false); })
      .catch(() => setLoadingAnalytics(false));
  }, [activeTab, analyticsMode, timePeriod]);

  useEffect(() => {
    if (activeTab !== 'analytics') return;
    const token = localStorage.getItem('access');
    if (!token) return;
    fetch(`${API_URL}/api/analytics/funnel/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json()).then(data => setFunnel(data.funnel)).catch(() => {});
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'analytics') return;
    const token = localStorage.getItem('access');
    if (!token) return;
    fetch(`${API_URL}/api/orders/all/?status=paid&limit=5`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json()).then(data => setRecentPurchases(Array.isArray(data) ? data.slice(0, 5) : [])).catch(() => setRecentPurchases([]));
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'analytics') return;
    const token = localStorage.getItem('access');
    if (!token) return;
    fetch(`${API_URL}/api/analytics/alerts/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json()).then(data => setAlerts(data.alerts || [])).catch(() => setAlerts([]));
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'analytics') return;
    const token = localStorage.getItem('access');
    if (!token) return;
    fetch(`${API_URL}/api/analytics/rfm/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json()).then(data => setRfmData(data.rfm || [])).catch(() => setRfmData([]));
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'products') return;
    const token = localStorage.getItem('access');
    if (!token) return;
    setLoadingProducts(true);
    fetch(`${API_URL}/api/products/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => { setProducts(Array.isArray(data) ? data : []); setLoadingProducts(false); })
      .catch(() => setLoadingProducts(false));
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'stock') return;
    const token = localStorage.getItem('access');
    if (!token) return;
    setLoadingStock(true);
    fetch(`${API_URL}/api/products/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        setStockData(Array.isArray(data) ? data : []);
        setLoadingStock(false);
      })
      .catch(() => setLoadingStock(false));
  }, [activeTab]);

  // ============================================================
  // PEDIDOS
  // ============================================================
  const handleStatusChange = async (orderId, newStatus) => {
    const token = localStorage.getItem('access');
    setUpdatingId(orderId);
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}/status/`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Error al actualizar');
      const updatedOrder = await res.json();
      setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
      toast.success(`Estado actualizado a "${newStatus}"`);
    } catch { toast.error('No se pudo actualizar el estado'); }
    finally { setUpdatingId(null); }
  };

  const filteredAndSortedOrders = useMemo(() => {
    let filtered = [...orders];
    if (filterStatus) filtered = filtered.filter(o => o.status === filterStatus);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(o => o.order_number.toLowerCase().includes(term) || o.shipping_address.email.toLowerCase().includes(term));
    }
    filtered.sort((a, b) => {
      let aVal, bVal;
      if (sortBy === 'order_number') { aVal = a.order_number; bVal = b.order_number; }
      else if (sortBy === 'total') { aVal = a.total; bVal = b.total; }
      else { aVal = new Date(a.created_at); bVal = new Date(b.created_at); }
      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
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

  const clearFilters = () => { setFilterStatus(''); setSearchTerm(''); setSortBy('created_at'); setSortOrder('desc'); setCurrentPage(1); };
  const handleSort = (field) => { if (sortBy === field) setSortOrder(s => s === 'asc' ? 'desc' : 'asc'); else setSortBy(field); setCurrentPage(1); };
  const goToPage = (page) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));

  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending': return { backgroundColor: 'rgba(230,81,0,0.15)', color: '#FF8A50', borderColor: 'rgba(230,81,0,0.3)' };
      case 'paid':    return { backgroundColor: 'rgba(46,125,50,0.15)', color: '#69F0AE', borderColor: 'rgba(46,125,50,0.3)' };
      case 'shipped': return { backgroundColor: 'rgba(21,101,192,0.15)', color: '#82B1FF', borderColor: 'rgba(21,101,192,0.3)' };
      default: return { backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.1)' };
    }
  };

  // ============================================================
  // PRODUCTOS
  // ============================================================
  const filteredAndSortedProducts = useMemo(() => {
    let list = [...products];
    if (productSearch) {
      const term = productSearch.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(term) || p.slug.toLowerCase().includes(term) || (p.category || '').toLowerCase().includes(term));
    }
    list.sort((a, b) => {
      let aVal, bVal;
      if (productSortBy === 'name') { aVal = a.name; bVal = b.name; }
      else if (productSortBy === 'price') { aVal = parseFloat(a.price); bVal = parseFloat(b.price); }
      else if (productSortBy === 'stock') { aVal = a.stock; bVal = b.stock; }
      else { aVal = a.created_at || ''; bVal = b.created_at || ''; }
      return productSortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });
    return list;
  }, [products, productSearch, productSortBy, productSortOrder]);

  const totalProductPages = Math.ceil(filteredAndSortedProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (productPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSortedProducts, productPage]);

  useEffect(() => { setProductPage(1); }, [productSearch, productSortBy, productSortOrder]);

  const openCreateDrawer = () => {
    setEditingProduct(null);
    setProductForm({ name: '', slug: '', description: '', price: '', category: '', stock: '', sizes: [], colors: [], images: [], stock_by_variant: {} });
    setFormErrors({});
    setShowProductDrawer(true);
  };

  const openEditDrawer = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name || '', slug: product.slug || '', description: product.description || '',
      price: product.price || '', category: product.category || '', stock: product.stock || '',
      sizes: product.sizes || [], colors: product.colors || [], images: product.images || [],
      stock_by_variant: product.stock_by_variant || {}
    });
    setFormErrors({});
    setShowProductDrawer(true);
  };

  const reloadProducts = async () => {
    const token = localStorage.getItem('access');
    const updated = await fetch(`${API_URL}/api/products/`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
    setProducts(Array.isArray(updated) ? updated : []);
  };

  const handleSaveProduct = async () => {
    const token = localStorage.getItem('access');
    setSavingProduct(true);
    setFormErrors({});

    const totalStock = (productForm.stock_by_variant && Object.keys(productForm.stock_by_variant).length > 0)
      ? Object.values(productForm.stock_by_variant).reduce((a, b) => a + b, 0)
      : parseInt(productForm.stock) || 0;

    const payload = {
      ...productForm,
      price: parseFloat(productForm.price) || 0,
      stock: totalStock,
    };

    const url = editingProduct ? `${API_URL}/api/products/${editingProduct.slug}/` : `${API_URL}/api/products/`;
    const method = editingProduct ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const err = await res.json(); setFormErrors(err); throw new Error('Corregí los campos indicados'); }
      toast.success(editingProduct ? 'Producto actualizado' : 'Producto creado');
      setShowProductDrawer(false);
      await reloadProducts();
    } catch (err) { toast.error(err.message || 'No se pudo guardar'); }
    finally { setSavingProduct(false); }
  };

  const handleDeleteProduct = async (slug) => {
    if (!confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')) return;
    const token = localStorage.getItem('access');
    try {
      const res = await fetch(`${API_URL}/api/products/${slug}/`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      toast.success('Producto eliminado');
      setProducts(prev => prev.filter(p => p.slug !== slug));
    } catch { toast.error('No se pudo eliminar'); }
  };

  const handleOpenCloudinaryWidget = () => {
    if (typeof window === 'undefined' || !window.cloudinary) return;
    window.cloudinary.openUploadWidget(
      { cloudName: 'dvxjp04xt', uploadPreset: 'urbanstore-products', sources: ['local', 'url', 'camera'], multiple: true, maxFiles: 5, clientAllowedFormats: ['jpg', 'png', 'webp'] },
      (error, result) => {
        if (!error && result && result.event === 'success') {
          setProductForm(prev => ({ ...prev, images: [...prev.images, result.info.secure_url] }));
        }
      }
    );
  };

  const handleRemoveImage = (index) => setProductForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));

  // ============================================================
  // RENDER: PEDIDOS
  // ============================================================
  const renderOrdersPanel = () => (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 36 }}>
        <KPICard label="Total Pedidos" value={totalOrders} icon="📋" color="#4285F4" statusThresholds={[1, 10]} gradient="linear-gradient(135deg, rgba(66,133,244,0.12) 0%, rgba(18,18,18,0.8) 100%)" />
        <KPICard label="Ingresos Totales" value={totalRevenue} prefix="$" icon="💰" color="#0F9D58" statusThresholds={[1, 100000]} formatFn={v => v.toLocaleString()} gradient="linear-gradient(135deg, rgba(15,157,88,0.12) 0%, rgba(18,18,18,0.8) 100%)" />
        <KPICard label="Pendientes" value={pendingOrders} icon="⏳" color="#F4B400" statusThresholds={[1, 5]} reverseStatus gradient="linear-gradient(135deg, rgba(244,180,0,0.12) 0%, rgba(18,18,18,0.8) 100%)" />
        <KPICard label="Pagados" value={paidOrders} icon="✅" color="#B8860B" statusThresholds={[1, 10]} gradient="linear-gradient(135deg, rgba(184,134,11,0.12) 0%, rgba(18,18,18,0.8) 100%)" />
      </div>

      <div style={{ ...glassCard, padding: '18px 22px', marginBottom: 28 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Estado</span>
            {['', 'pending', 'paid', 'shipped'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)} style={chipStyle(filterStatus === s)}>
                {s === '' ? 'Todos' : s === 'pending' ? 'Pendientes' : s === 'paid' ? 'Pagados' : 'Enviados'}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input type="text" placeholder="🔍  Nº orden o email" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 40, color: 'rgba(255,255,255,0.8)', fontSize: 13, minWidth: 220, outline: 'none' }} />
            <button onClick={clearFilters} style={{ padding: '8px 18px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 40, color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: 13 }}>Limpiar</button>
          </div>
        </div>
      </div>

      <div style={{ ...glassCard, padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {[['order_number', 'Nº Orden'], ['', 'Cliente'], ['created_at', 'Fecha'], ['total', 'Total'], ['', 'Estado'], ['', 'Acciones']].map(([field, label]) => (
                  <th key={label} onClick={() => field && handleSort(field)} style={{ padding: '14px 20px', textAlign: 'left', fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: field ? 'pointer' : 'default', userSelect: 'none', whiteSpace: 'nowrap' }}>
                    {label} {field && sortBy === field && <span style={{ color: c.primary }}>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.length === 0 ? (
                <tr><td colSpan="6" style={{ padding: 48, textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>Sin resultados</td></tr>
              ) : (
                paginatedOrders.map((order, idx) => {
                  const ss = getStatusStyle(order.status);
                  return (
                    <tr key={order.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.15s', animation: `fadeInUp 0.3s ease-out ${idx * 0.03}s both` }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(184,134,11,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '14px 20px', fontWeight: 600, color: c.primary, fontSize: 13, fontFamily: 'monospace' }}>{order.order_number}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{order.shipping_address.name}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{order.shipping_address.email}</div>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{new Date(order.created_at + 'Z').toLocaleDateString('es-CO')}</td>
                      <td style={{ padding: '14px 20px', fontWeight: 700, color: '#0F9D58', fontSize: 14, fontFamily: 'monospace' }}>${order.total.toLocaleString()}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <select value={order.status} onChange={e => handleStatusChange(order.id, e.target.value)} disabled={updatingId === order.id}
                          style={{ padding: '5px 10px', backgroundColor: ss.backgroundColor, color: ss.color, border: `1px solid ${ss.borderColor}`, borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                          <option value="pending">Pendiente</option>
                          <option value="paid">Pagado</option>
                          <option value="shipped">Enviado</option>
                        </select>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <button onClick={() => router.push(`/order-confirmation/${order.id}`)}
                          style={{ padding: '6px 14px', background: 'rgba(184,134,11,0.1)', color: c.primary, border: '1px solid rgba(184,134,11,0.3)', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Ver →</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} style={{ padding: '7px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, cursor: 'pointer', color: 'rgba(255,255,255,0.5)', opacity: currentPage === 1 ? 0.3 : 1 }}>← Anterior</button>
            <span style={{ padding: '7px 16px', fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>Página {currentPage} de {totalPages}</span>
            <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} style={{ padding: '7px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, cursor: 'pointer', color: 'rgba(255,255,255,0.5)', opacity: currentPage === totalPages ? 0.3 : 1 }}>Siguiente →</button>
          </div>
        )}
      </div>
    </>
  );

  // ============================================================
  // RENDER: ANALÍTICAS
  // ============================================================
  const renderAnalyticsPanel = () => {
    if (loadingAnalytics) return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 80, gap: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.08)', borderTop: `2px solid ${c.primary}`, animation: 'spin 0.8s linear infinite' }} />
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Cargando analíticas...</span>
      </div>
    );
    if (!stats) return <div style={{ textAlign: 'center', padding: 48, color: '#DB4437' }}>Error al cargar estadísticas</div>;

    const totalSales = stats.total_sales || 0;
    const totalRev = stats.total_revenue || 0;
    const averageOrderValue = stats.average_order_value || 0;
    const abandonmentRate = stats.abandonment_rate || 0;
    const conversionRates = stats.conversion_rates || {};
    const topProducts = stats.top_products || [];
    const topViewed = stats.top_viewed_products || [];
    const salesByDay = stats.sales_by_day || [];
    const eventsTimeline = stats.events_timeline || [];
    const productPerformance = stats.product_performance || [];
    const errorsTimeline = stats.errors_timeline || [];
    const sessionStats = stats.session_stats || null;
    const retentionMetrics = stats.retention_metrics || null;
    const maxTrafficSessions = trafficData.length > 0 ? Math.max(...trafficData.map(d => d.sessions)) : 1;

    return (
      <>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, padding: '14px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Período</span>
            {[['7', '7D'], ['30', '30D'], ['90', '90D']].map(([val, label]) => (
              <button key={val} onClick={() => setTimePeriod(val)} style={chipStyle(timePeriod === val)}>{label}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Métricas</span>
            <button onClick={() => setAnalyticsMode('total')} style={chipStyle(analyticsMode === 'total')}>Totales</button>
            <button onClick={() => setAnalyticsMode('unique')} style={chipStyle(analyticsMode === 'unique')}>Únicas</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18, marginBottom: 28 }}>
          <KPICard label="Ventas Totales" value={totalSales} icon="🛒" color="#4285F4" statusThresholds={[1, 20]} sparkData={salesByDay} sparkColor="#4285F4" gradient="linear-gradient(135deg, rgba(66,133,244,0.12) 0%, rgba(18,18,18,0.8) 100%)" />
          <KPICard label="Ingresos" value={totalRev} prefix="$" icon="💵" color="#0F9D58" statusThresholds={[1, 500000]} sparkData={salesByDay} sparkColor="#0F9D58" formatFn={v => v.toLocaleString()} gradient="linear-gradient(135deg, rgba(15,157,88,0.12) 0%, rgba(18,18,18,0.8) 100%)" />
          <KPICard label="Ticket Promedio" value={averageOrderValue} prefix="$" icon="🎯" color="#B8860B" statusThresholds={[50000, 150000]} formatFn={v => v.toLocaleString()} gradient="linear-gradient(135deg, rgba(184,134,11,0.12) 0%, rgba(18,18,18,0.8) 100%)" />
          <KPICard label="Tasa Abandono" value={abandonmentRate} suffix="%" icon="🚪" color="#DB4437" statusThresholds={[30, 60]} reverseStatus gradient="linear-gradient(135deg, rgba(219,68,55,0.12) 0%, rgba(18,18,18,0.8) 100%)" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, marginBottom: 20, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {retentionMetrics && (
              <div style={glassCard}>
                <SectionHeader icon="🔄" title="Retención de clientes" subtitle="Comportamiento de recompra" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {[{ label: 'Tasa de Recompra', value: `${retentionMetrics.repurchase_rate}%`, color: '#0F9D58' }, { label: 'Recurrentes', value: retentionMetrics.recurrent_customers, color: '#4285F4' }, { label: 'Compradores únicos', value: retentionMetrics.total_unique_buyers, color: '#B8860B' }].map(m => (
                    <div key={m.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '14px 12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: m.color, fontFamily: 'monospace' }}>{m.value}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4, lineHeight: 1.3 }}>{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {sessionStats && (
              <div style={glassCard}>
                <SectionHeader icon="📡" title="Estadísticas de sesión" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {[{ label: 'Sesiones únicas', value: sessionStats.unique_sessions, color: '#4285F4' }, { label: 'Eventos / sesión', value: sessionStats.avg_events_per_session, color: '#FF6D00' }, { label: 'Con compra', value: sessionStats.sessions_with_purchase, color: '#0F9D58' }].map(m => (
                    <div key={m.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '14px 12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: m.color, fontFamily: 'monospace' }}>{m.value}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4, lineHeight: 1.3 }}>{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 🆕 SEGUIMIENTO DE WHATSAPP */}
            {stats.whatsapp_sessions !== undefined && (
              <div style={{ ...glassCard, marginBottom: '40px' }}>
                <SectionHeader icon="💬" title="Seguimiento de WhatsApp" subtitle="Clics en WhatsApp → Compras concretadas" />
                
                {/* Tarjetas de métricas */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#25D366' }}>
                      {stats.whatsapp_sessions || 0}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                      Clics en WhatsApp
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#0F9D58' }}>
                      {stats.whatsapp_purchases || 0}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                      Compras concretadas
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#B8860B' }}>
                      {stats.whatsapp_sessions > 0
                        ? ((stats.whatsapp_purchases || 0) / stats.whatsapp_sessions * 100).toFixed(1)
                        : 0}%
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                      Tasa de conversión
                    </div>
                  </div>
                </div>

                {/* Botón para registrar compra manual */}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                  <button
                    onClick={() => {
                      const sessionId = prompt('Ingresá el session_id de la sesión de WhatsApp:');
                      if (!sessionId) return;

                      fetch(`${API_URL}/api/analytics/track/`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          event_type: 'whatsapp_purchase',
                          session_id: sessionId,
                          metadata: { recorded_by: 'admin' },
                        }),
                      })
                        .then(() => {
                          toast.success('✅ Compra registrada correctamente');
                          const token = localStorage.getItem('access');
                          const now = new Date();
                          const end = now.toISOString().split('T')[0];
                          const start = new Date(now - timePeriod * 86400000).toISOString().split('T')[0];
                          fetch(`${API_URL}/api/analytics/dashboard-stats/?mode=${analyticsMode}&start=${start}&end=${end}`, {
                            headers: { Authorization: `Bearer ${token}` },
                          })
                            .then(res => res.json())
                            .then(data => {
                              setStats(data);
                              setTrafficData(data.traffic_sources || []);
                            });
                        })
                        .catch(() => toast.error('Error al registrar la compra'));
                    }}
                    style={{
                      padding: '10px 20px',
                      background: '#25D366',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 10,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                    </svg>
                    📝 Registrar compra manual
                  </button>
                </div>

                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: '12px' }}>
                  Cuando un cliente concrete la compra por WhatsApp, ingresá su session_id y hacé clic en el botón.
                  El session_id lo encontrás en la colección analytics_events filtrando por whatsapp_cart_click.
                </p>
              </div>
            )}

            <GaugeChart value={conversionRates.visit_to_cart || 0} title="Visitante → Carrito" />
            {stats.checkout_started_count !== undefined && stats.checkout_started_count !== null && (
              <div style={glassCard}>
                <SectionHeader icon="⏳" title="Embudo de pago" />
                <ConversionFunnel funnel={[{ step: 'begin_checkout', count: stats.checkout_started_count ?? 0 }, { step: 'add_to_cart', count: stats.payment_info_entered_count ?? 0 }, { step: 'purchase', count: stats.order_completed_count ?? 0 }]} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, padding: '10px 0 0', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                  <span>Checkout → Pago: <strong style={{ color: '#FF6D00' }}>{stats.conversion_checkout_to_payment ?? 0}%</strong></span>
                  <span>Pago → Compra: <strong style={{ color: '#0F9D58' }}>{stats.conversion_payment_to_order ?? 0}%</strong></span>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {recentPurchases.length > 0 && (
              <div style={glassCard}>
                <SectionHeader icon="🛍️" title="Últimas compras" subtitle="Pedidos pagados más recientes" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {recentPurchases.map((order, idx) => (
                    <div key={order.id || idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', animation: `fadeInUp 0.3s ease-out ${idx * 0.07}s both` }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: c.primary, fontFamily: 'monospace' }}>{order.order_number}</div>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>{order.shipping_address?.name || 'Cliente'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#0F9D58', fontFamily: 'monospace' }}>${order.total?.toLocaleString()}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{new Date(order.created_at + 'Z').toLocaleString('es-CO', { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {trafficData && trafficData.length > 0 && (
              <div style={glassCard}>
                <SectionHeader icon="🌐" title="Fuentes de tráfico" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[...trafficData].sort((a, b) => b.sessions - a.sessions).map((s, idx) => (
                    <TrafficSourceCard key={s.source} source={s.source} sessions={s.sessions} maxSessions={maxTrafficSessions} rank={idx} />
                  ))}
                </div>
              </div>
            )}
            {stats.event_counts && Object.values(stats.event_counts).some(v => v > 0) && (
              <div style={glassCard}>
                <SectionHeader icon="📊" title="Distribución de eventos" />
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={Object.entries(stats.event_counts).map(([key, val]) => ({ name: key === 'product_view' ? 'Vistas' : key === 'add_to_cart' ? 'Carrito' : key === 'begin_checkout' ? 'Checkout' : 'Compras', value: val })).filter(item => item.value > 0)} cx="50%" cy="50%" outerRadius={75} innerRadius={40} dataKey="value" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {Object.entries(stats.event_counts).map((_, index) => (<Cell key={`cell-${index}`} fill={ANALYTICS_COLORS.pie[index % ANALYTICS_COLORS.pie.length]} />))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {funnel && funnel.length > 0 && (
          <div style={{ ...glassCard, marginBottom: 20 }}>
            <SectionHeader icon="🔽" title="Embudo de conversión" subtitle="Sesiones únicas por etapa" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32, alignItems: 'center' }}>
              <ConversionFunnel funnel={funnel} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {funnel.slice(0, -1).map((step, idx) => {
                  const next = funnel[idx + 1];
                  const rate = step.count > 0 ? ((next.count / step.count) * 100).toFixed(1) : 0;
                  const labels = { page_view: 'Visitas', product_view: 'Vieron', add_to_cart: 'Carrito', begin_checkout: 'Checkout', purchase: 'Compra' };
                  const colors = ['#4E79A7', '#F28E2B', '#E15759', '#76B7B2'];
                  return (
                    <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 14, border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>{labels[step.step]} → {labels[next.step]}</div>
                      <div style={{ fontSize: 26, fontWeight: 800, color: colors[idx], fontFamily: 'monospace' }}>{rate}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, marginBottom: 20 }}>
          <div style={glassCard}>
            <SectionHeader icon="📈" title="Evolución de eventos" />
            {eventsTimeline.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={eventsTimeline}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} /><Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="product_view" stroke={ANALYTICS_COLORS.timeline.product_view} name="Vistas" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="add_to_cart" stroke={ANALYTICS_COLORS.timeline.add_to_cart} name="Carrito" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="begin_checkout" stroke={ANALYTICS_COLORS.timeline.begin_checkout} name="Checkout" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="purchase" stroke={ANALYTICS_COLORS.timeline.purchase} name="Compras" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', padding: 40, fontSize: 13 }}>Sin datos</p>}
          </div>
          <div style={glassCard}>
            <SectionHeader icon="💹" title="Ventas por día" />
            {salesByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={salesByDay}>
                  <defs><linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4285F4" stopOpacity={0.3} /><stop offset="95%" stopColor="#4285F4" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="count" stroke="#4285F4" fill="url(#salesGrad)" strokeWidth={2} name="Ventas" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', padding: 40, fontSize: 13 }}>Sin datos</p>}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 20 }}>
          <div style={glassCard}>
            <SectionHeader icon="🏆" title="Más vendidos" />
            {topProducts.length > 0 ? (<ResponsiveContainer width="100%" height={260}><BarChart data={topProducts} layout="vertical"><CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" /><XAxis type="number" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11 }} /><YAxis dataKey="slug" type="category" width={130} stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11 }} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="count" fill={ANALYTICS_COLORS.bar.sales} name="Unidades" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer>) : <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', padding: 40, fontSize: 13 }}>Sin datos</p>}
          </div>
          <div style={glassCard}>
            <SectionHeader icon="👁️" title="Más vistos" />
            {topViewed.length > 0 ? (<ResponsiveContainer width="100%" height={260}><BarChart data={topViewed} layout="vertical"><CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" /><XAxis type="number" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11 }} /><YAxis dataKey="slug" type="category" width={130} stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11 }} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="count" fill={ANALYTICS_COLORS.bar.views} name="Visitas" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer>) : <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', padding: 40, fontSize: 13 }}>Sin datos</p>}
          </div>
        </div>

        {productPerformance.length > 0 && (
          <div style={{ ...glassCard, marginBottom: 20 }}>
            <SectionHeader icon="📋" title="Rendimiento por producto" />
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                <thead><tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>{['Producto', 'Vistas', 'Carritos', 'Compras', 'Conversión'].map(h => (<th key={h} style={{ padding: '10px 16px', textAlign: h === 'Producto' ? 'left' : 'center', fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</th>))}</tr></thead>
                <tbody>
                  {productPerformance.map((prod, idx) => (
                    <tr key={prod.slug} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', animation: `fadeInUp 0.3s ease-out ${idx * 0.05}s both` }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: c.primary, fontSize: 13 }}>{prod.name || prod.slug}</td>
                      {[prod.views, prod.add_to_cart, prod.purchases].map((val, i) => (<td key={i} style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace' }}>{val}</td>))}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, background: prod.conversion_rate >= 5 ? 'rgba(15,157,88,0.15)' : 'rgba(255,255,255,0.06)', color: prod.conversion_rate >= 5 ? '#0F9D58' : 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700 }}>{prod.conversion_rate >= 5 && '✓'} {prod.conversion_rate}%</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {errorsTimeline.length > 0 && (
          <div style={{ ...glassCard, marginBottom: 20 }}>
            <SectionHeader icon="⚠️" title="Errores por día" />
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={errorsTimeline}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11 }} />
                <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} /><Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="payment_error" stroke={ANALYTICS_COLORS.timeline.error} name="Pago" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="address_error" stroke={ANALYTICS_COLORS.timeline.begin_checkout} name="Dirección" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="checkout_error" stroke={ANALYTICS_COLORS.timeline.add_to_cart} name="Checkout" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="payment_confirmation_error" stroke={ANALYTICS_COLORS.timeline.product_view} name="Confirmación" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
          {alerts.length > 0 && (
            <div style={glassCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <span style={{ fontSize: 20, animation: 'ringBell 2s ease-in-out infinite' }}>🔔</span>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: 'rgba(255,255,255,0.9)', margin: 0 }}>Alertas</h2>
                {alerts.some(a => a.severity === 'critical') && (
                  <span style={{ background: '#DB4437', color: '#fff', padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, animation: 'pulse 1.5s ease-in-out infinite' }}>
                    {alerts.filter(a => a.severity === 'critical').length} crítica{alerts.filter(a => a.severity === 'critical').length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {alerts.map((alert, idx) => <AlertItem key={idx} alert={alert} index={idx} />)}
              </div>
            </div>
          )}
          {rfmData.length > 0 && (
            <div style={glassCard}>
              <SectionHeader icon="💎" title="Segmentación RFM" subtitle="Recencia · Frecuencia · Monetario" />
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 440 }}>
                  <thead><tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>{['Usuario', 'Recencia', 'Frec.', 'Monetario', 'Segmento'].map(h => (<th key={h} style={{ padding: '8px 12px', textAlign: h === 'Usuario' ? 'left' : 'center', fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</th>))}</tr></thead>
                  <tbody>
                    {rfmData.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '10px 12px', color: c.primary, fontSize: 12, fontFamily: 'monospace' }}>{item.visitor_id ? item.visitor_id.slice(0, 12) + '…' : 'Anónimo'}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace' }}>{item.recency}d</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace' }}>{item.frequency}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, color: '#0F9D58', fontFamily: 'monospace' }}>${item.monetary.toLocaleString()}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}><RFMBadge segment={item.segmento} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </>
    );
  };

  // ============================================================
  // RENDER: PRODUCTOS
  // ============================================================
  const renderProductsPanel = () => (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 28 }}>
        <KPICard label="Total Productos" value={products.length} icon="📦" color="#4285F4" gradient="linear-gradient(135deg, rgba(66,133,244,0.12) 0%, rgba(18,18,18,0.8) 100%)" />
        <KPICard label="Con stock" value={products.filter(p => p.stock > 0).length} icon="✅" color="#0F9D58" gradient="linear-gradient(135deg, rgba(15,157,88,0.12) 0%, rgba(18,18,18,0.8) 100%)" />
        <KPICard label="Sin stock" value={products.filter(p => p.stock === 0).length} icon="⚠️" color="#F4B400" statusThresholds={[1, 5]} reverseStatus gradient="linear-gradient(135deg, rgba(244,180,0,0.12) 0%, rgba(18,18,18,0.8) 100%)" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button onClick={openCreateDrawer} style={{ padding: '12px 28px', background: c.primary, color: '#000', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'opacity 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            + Nuevo producto
          </button>
        </div>
      </div>

      <div style={{ ...glassCard, padding: '14px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
          <input type="text" placeholder="🔍  Buscar producto…" value={productSearch} onChange={e => setProductSearch(e.target.value)}
            style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 40, color: 'rgba(255,255,255,0.8)', fontSize: 13, minWidth: 240, outline: 'none' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={productSortBy} onChange={e => setProductSortBy(e.target.value)}
              style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 40, color: 'rgba(255,255,255,0.7)', fontSize: 13, outline: 'none' }}>
              <option value="created_at">Más reciente</option>
              <option value="name">Nombre</option>
              <option value="price">Precio</option>
              <option value="stock">Stock</option>
            </select>
            <button onClick={() => setProductSortOrder(o => o === 'asc' ? 'desc' : 'asc')} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 40, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 13 }}>
              {productSortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ ...glassCard, padding: 0, overflow: 'hidden' }}>
        {loadingProducts ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>Cargando productos…</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {['Img', 'Producto', 'Categoría', 'Tallas', 'Colores', 'Precio', 'Stock', 'Acciones'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: h === 'Img' || h === 'Producto' ? 'left' : 'center', fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.length === 0 ? (
                  <tr><td colSpan="8" style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>No se encontraron productos</td></tr>
                ) : (
                  paginatedProducts.map((product, idx) => {
                    const totalStock = (product.stock_by_variant && Object.keys(product.stock_by_variant).length > 0)
                      ? Object.values(product.stock_by_variant).reduce((a, b) => a + b, 0)
                      : (product.stock || 0);

                    return (
                      <tr key={product.slug} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.15s', animation: `fadeInUp 0.3s ease-out ${idx * 0.03}s both` }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }}>
                            {product.images && product.images.length > 0
                              ? <img src={product.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'rgba(255,255,255,0.15)' }}>📷</div>}
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{product.name}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{product.category || '—'}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center' }}>
                            {product.sizes?.length > 0
                              ? product.sizes.map(s => <span key={s} style={{ background: 'rgba(66,133,244,0.15)', color: '#4285F4', padding: '1px 7px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{s}</span>)
                              : <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>—</span>}
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center' }}>
                            {product.colors?.length > 0
                              ? product.colors.map(col => {
                                  const dot = getColorDot(col);
                                  return (
                                    <span key={col} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(184,134,11,0.12)', color: 'rgba(255,255,255,0.6)', padding: '1px 7px', borderRadius: 10, fontSize: 11 }}>
                                      {dot && <span style={{ width: 8, height: 8, borderRadius: '50%', background: dot, border: '1px solid rgba(255,255,255,0.2)', flexShrink: 0 }} />}
                                      {col}
                                    </span>
                                  );
                                })
                              : <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>—</span>}
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#0F9D58', fontFamily: 'monospace' }}>${parseFloat(product.price).toLocaleString()}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <span style={{
                            fontSize: 13,
                            fontFamily: 'monospace',
                            color: totalStock > 10 ? '#0F9D58' : totalStock > 0 ? '#F4B400' : '#DB4437',
                            fontWeight: 600
                          }}>
                            {totalStock}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                            <button onClick={() => openEditDrawer(product)} style={{ padding: '5px 12px', background: 'rgba(184,134,11,0.1)', color: c.primary, border: '1px solid rgba(184,134,11,0.25)', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Editar</button>
                            <button onClick={() => handleDeleteProduct(product.slug)} style={{ padding: '5px 12px', background: 'rgba(219,68,55,0.1)', color: '#DB4437', border: '1px solid rgba(219,68,55,0.25)', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Eliminar</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
        {totalProductPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={() => setProductPage(p => Math.max(1, p - 1))} disabled={productPage === 1} style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, cursor: 'pointer', color: 'rgba(255,255,255,0.4)', opacity: productPage === 1 ? 0.3 : 1 }}>← Ant</button>
            <span style={{ padding: '6px 14px', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{productPage} / {totalProductPages}</span>
            <button onClick={() => setProductPage(p => Math.min(totalProductPages, p + 1))} disabled={productPage === totalProductPages} style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, cursor: 'pointer', color: 'rgba(255,255,255,0.4)', opacity: productPage === totalProductPages ? 0.3 : 1 }}>Sig →</button>
          </div>
        )}
      </div>

      {/* ─── DRAWER ─── */}
      {showProductDrawer && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}>
          <div onClick={() => setShowProductDrawer(false)} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 600, height: '100%', background: 'rgba(14,14,14,0.97)', backdropFilter: 'blur(30px)', borderLeft: '1px solid rgba(255,255,255,0.08)', boxShadow: '-12px 0 48px rgba(0,0,0,0.7)', padding: '32px 28px', overflowY: 'auto', animation: 'slideInRight 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'rgba(255,255,255,0.9)', margin: 0 }}>{editingProduct ? 'Editar producto' : 'Nuevo producto'}</h2>
              <button onClick={() => setShowProductDrawer(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 22, cursor: 'pointer', padding: 4 }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Información básica */}
              <section style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: '18px 20px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 14, letterSpacing: '0.08em', textTransform: 'uppercase' }}>📋 Información básica</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <input type="text" placeholder="Nombre del producto" value={productForm.name}
                      onChange={e => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                      style={inputStyle(!!formErrors.name)} />
                    <FieldError errors={formErrors.name} />
                  </div>
                  <div>
                    <input type="text" placeholder="Slug (URL amigable)" value={productForm.slug}
                      onChange={e => setProductForm(prev => ({ ...prev, slug: e.target.value }))}
                      style={inputStyle(!!formErrors.slug)} />
                    <FieldError errors={formErrors.slug} />
                  </div>
                  <div>
                    <textarea placeholder="Descripción del producto" value={productForm.description} rows={3}
                      onChange={e => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                      style={{ ...inputStyle(!!formErrors.description), resize: 'vertical' }} />
                    <FieldError errors={formErrors.description} />
                  </div>
                </div>
              </section>

              {/* Inventario */}
              <section style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: '18px 20px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 14, letterSpacing: '0.08em', textTransform: 'uppercase' }}>📦 Inventario y precio</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  <div>
                    <input type="number" step="0.01" min="0" placeholder="Precio" value={productForm.price}
                      onChange={e => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                      style={inputStyle(!!formErrors.price)} />
                    <FieldError errors={formErrors.price} />
                  </div>
                  <div>
                    <input type="text" placeholder="Categoría" value={productForm.category}
                      onChange={e => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                      style={inputStyle(!!formErrors.category)} />
                    <FieldError errors={formErrors.category} />
                  </div>
                  <div>
                    <input type="number" step="1" min="0" placeholder="Stock" value={productForm.stock}
                      onChange={e => setProductForm(prev => ({ ...prev, stock: e.target.value }))}
                      style={inputStyle(!!formErrors.stock)} />
                    <FieldError errors={formErrors.stock} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <TagInput label="Tallas" placeholder="Ej: S, M, L, XL" values={productForm.sizes} onChange={newSizes => setProductForm(prev => ({ ...prev, sizes: newSizes }))} />
                  <TagInput label="Colores" placeholder="Ej: negro, blanco" values={productForm.colors} onChange={newColors => setProductForm(prev => ({ ...prev, colors: newColors }))} colorMode />
                </div>

                {/* Stock por variante */}
                {productForm.sizes?.length > 0 && productForm.colors?.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <h4 style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>📊 Stock por variante</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8 }}>
                      {productForm.sizes.flatMap(size =>
                        productForm.colors.map(color => {
                          const key = `${size}|${color}`;
                          const value = productForm.stock_by_variant?.[key] ?? '';
                          return (
                            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{size} / {color}</span>
                              <input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={value}
                                onChange={e => setProductForm(prev => ({
                                  ...prev,
                                  stock_by_variant: {
                                    ...(prev.stock_by_variant || {}),
                                    [key]: parseInt(e.target.value) || 0,
                                  },
                                }))}
                                style={inputStyle()}
                              />
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </section>

              {/* Imágenes */}
              <section style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: '18px 20px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 14, letterSpacing: '0.08em', textTransform: 'uppercase' }}>🖼️ Imágenes</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: 10 }}>
                  {productForm.images.map((url, i) => (
                    <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button onClick={() => handleRemoveImage(i)} style={{ position: 'absolute', top: 3, right: 3, width: 20, height: 20, background: 'rgba(0,0,0,0.75)', color: '#fff', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                    </div>
                  ))}
                  <div onClick={handleOpenCloudinaryWidget} style={{ aspectRatio: '1', borderRadius: 10, border: '2px dashed rgba(255,255,255,0.12)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', color: 'rgba(255,255,255,0.3)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = c.primary; e.currentTarget.style.color = c.primary; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}>
                    <span style={{ fontSize: 24 }}>+</span>
                    <span style={{ fontSize: 10, marginTop: 2 }}>Subir</span>
                  </div>
                </div>
              </section>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowProductDrawer(false)} style={{ padding: '10px 22px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: 13 }}>Cancelar</button>
                <button onClick={handleSaveProduct} disabled={savingProduct} style={{ padding: '10px 22px', background: c.primary, color: '#000', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 13, opacity: savingProduct ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                  {savingProduct ? 'Guardando…' : editingProduct ? 'Actualizar' : 'Crear producto'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // ============================================================
  // RENDER: STOCK
  // ============================================================
  const renderStockPanel = () => {
    const filteredStock = stockData.filter(product => {
      const totalStock = (product.stock_by_variant && Object.keys(product.stock_by_variant).length > 0)
        ? Object.values(product.stock_by_variant).reduce((a, b) => a + b, 0)
        : (product.stock || 0);
      if (stockFilter === 'low') return totalStock > 0 && totalStock <= 5;
      if (stockFilter === 'out') return totalStock === 0;
      return true;
    });

    const handleQuickStockUpdate = async (slug, newStock) => {
      const token = localStorage.getItem('access');
      try {
        const res = await fetch(`${API_URL}/api/products/${slug}/`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ stock: parseInt(newStock) || 0 }),
        });
        if (!res.ok) throw new Error('Error al actualizar');
        toast.success('Stock actualizado');
        setStockData(prev => prev.map(p => (p.slug === slug ? { ...p, stock: parseInt(newStock) || 0 } : p)));
      } catch { toast.error('No se pudo actualizar el stock'); }
    };

    return (
      <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 28 }}>
          <KPICard label="Total productos" value={stockData.length} icon="📦" color="#4285F4" gradient="linear-gradient(135deg, rgba(66,133,244,0.12) 0%, rgba(18,18,18,0.8) 100%)" />
          <KPICard label="Stock bajo (≤5)" value={stockData.filter(p => { const t = (p.stock_by_variant && Object.keys(p.stock_by_variant).length > 0) ? Object.values(p.stock_by_variant).reduce((a, b) => a + b, 0) : (p.stock || 0); return t > 0 && t <= 5; }).length} icon="⚠️" color="#F4B400" gradient="linear-gradient(135deg, rgba(244,180,0,0.12) 0%, rgba(18,18,18,0.8) 100%)" />
          <KPICard label="Agotados" value={stockData.filter(p => { const t = (p.stock_by_variant && Object.keys(p.stock_by_variant).length > 0) ? Object.values(p.stock_by_variant).reduce((a, b) => a + b, 0) : (p.stock || 0); return t === 0; }).length} icon="🚫" color="#DB4437" gradient="linear-gradient(135deg, rgba(219,68,55,0.12) 0%, rgba(18,18,18,0.8) 100%)" />
          <KPICard label="Unidades totales" value={stockData.reduce((sum, p) => { const t = (p.stock_by_variant && Object.keys(p.stock_by_variant).length > 0) ? Object.values(p.stock_by_variant).reduce((a, b) => a + b, 0) : (p.stock || 0); return sum + t; }, 0)} icon="📊" color="#0F9D58" gradient="linear-gradient(135deg, rgba(15,157,88,0.12) 0%, rgba(18,18,18,0.8) 100%)" />
        </div>

        <div style={{ ...glassCard, padding: '14px 20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Filtro</span>
            {[['all', 'Todos'], ['low', 'Stock bajo (≤5)'], ['out', 'Agotados']].map(([val, label]) => (
              <button key={val} onClick={() => setStockFilter(val)} style={chipStyle(stockFilter === val)}>{label}</button>
            ))}
          </div>
        </div>

        <div style={{ ...glassCard, padding: 0, overflow: 'hidden' }}>
          {loadingStock ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>Cargando inventario…</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <th style={{ padding: '12px 18px', textAlign: 'left', fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Producto</th>
                    <th style={{ padding: '12px 18px', textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Categoría</th>
                    <th style={{ padding: '12px 18px', textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Stock actual</th>
                    <th style={{ padding: '12px 18px', textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Estado</th>
                    <th style={{ padding: '12px 18px', textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Actualizar</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStock.length === 0 ? (
                    <tr><td colSpan="5" style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>No se encontraron productos</td></tr>
                  ) : (
                    filteredStock.map((product, idx) => {
                      const totalStock = (product.stock_by_variant && Object.keys(product.stock_by_variant).length > 0)
                        ? Object.values(product.stock_by_variant).reduce((a, b) => a + b, 0)
                        : (product.stock || 0);
                      const isLow = totalStock > 0 && totalStock <= 5;
                      const isOut = totalStock === 0;
                      return (
                        <tr key={product.slug} style={{
                          borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.15s', animation: `fadeInUp 0.3s ease-out ${idx * 0.03}s both`,
                          background: isOut ? 'rgba(219,68,55,0.05)' : isLow ? 'rgba(244,180,0,0.05)' : 'transparent',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = isOut ? 'rgba(219,68,55,0.1)' : isLow ? 'rgba(244,180,0,0.1)' : 'rgba(255,255,255,0.02)'}
                        onMouseLeave={e => e.currentTarget.style.background = isOut ? 'rgba(219,68,55,0.05)' : isLow ? 'rgba(244,180,0,0.05)' : 'transparent'}>
                          <td style={{ padding: '12px 18px', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{product.name}</td>
                          <td style={{ padding: '12px 18px', textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{product.category}</td>
                          <td style={{ padding: '12px 18px', textAlign: 'center', fontSize: 14, fontWeight: 700, fontFamily: 'monospace', color: isOut ? '#DB4437' : isLow ? '#F4B400' : '#0F9D58' }}>
                            {totalStock}
                          </td>
                          <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 12px', borderRadius: 20, background: isOut ? 'rgba(219,68,55,0.15)' : isLow ? 'rgba(244,180,0,0.15)' : 'rgba(15,157,88,0.15)', color: isOut ? '#DB4437' : isLow ? '#F4B400' : '#0F9D58', fontSize: 11, fontWeight: 700, border: `1px solid ${isOut ? 'rgba(219,68,55,0.3)' : isLow ? 'rgba(244,180,0,0.3)' : 'rgba(15,157,88,0.3)'}` }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: isOut ? '#DB4437' : isLow ? '#F4B400' : '#0F9D58', boxShadow: `0 0 4px ${isOut ? '#DB4437' : isLow ? '#F4B400' : '#0F9D58'}` }} />
                              {isOut ? 'Agotado' : isLow ? 'Stock bajo' : 'En stock'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center' }}>
                              <input
                                type="number"
                                min="0"
                                defaultValue={totalStock}
                                onBlur={(e) => {
                                  const newStock = parseInt(e.target.value);
                                  if (!isNaN(newStock) && newStock !== totalStock) {
                                    handleQuickStockUpdate(product.slug, newStock);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const newStock = parseInt(e.target.value);
                                    if (!isNaN(newStock) && newStock !== totalStock) {
                                      handleQuickStockUpdate(product.slug, newStock);
                                    }
                                    e.target.blur();
                                  }
                                }}
                                style={{ width: '70px', padding: '6px 8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'rgba(255,255,255,0.8)', fontSize: 13, textAlign: 'center', outline: 'none', fontFamily: 'monospace' }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>
    );
  };

  // ============================================================
  // LOADING / ERROR
  // ============================================================
  if (loadingOrders) return (
    <div style={{ backgroundColor: '#0D0D0D', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.08)', borderTop: `3px solid ${c.primary}`, animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Cargando panel...</p>
      <style jsx>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ backgroundColor: '#0D0D0D', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
      <p style={{ color: '#DB4437' }}>⚠️ {error}</p>
      <button onClick={() => router.push('/')} style={{ padding: '10px 24px', backgroundColor: c.primary, color: '#000', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700 }}>← Volver</button>
    </div>
  );

  // ============================================================
  // RENDER PRINCIPAL
  // ============================================================
  return (
    <div style={{ backgroundColor: '#0D0D0D', minHeight: '100vh', color: 'rgba(255,255,255,0.85)' }}>
      <Toaster position="top-right" toastOptions={{ style: { background: 'rgba(26,26,26,0.95)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, backdropFilter: 'blur(20px)', fontSize: 13 } }} />
      <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: '60vw', height: '30vh', background: 'radial-gradient(ellipse, rgba(184,134,11,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1440, margin: '0 auto', padding: 'clamp(20px, 4vw, 40px) clamp(16px, 4vw, 32px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 36, flexWrap: 'wrap', gap: 12, animation: 'fadeInDown 0.5s ease-out' }}>
          <h1 style={{ fontSize: 'clamp(22px, 5vw, 28px)', fontWeight: 900, color: 'rgba(255,255,255,0.92)', margin: 0, letterSpacing: '-0.02em' }}>
            Urban <span style={{ color: c.primary }}>Store</span>
            <span style={{ fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.2)', marginLeft: 12 }}>Panel Admin</span>
          </h1>
          <button onClick={() => router.push('/')} style={{ padding: '8px 18px', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, cursor: 'pointer', fontSize: 13 }}>← Tienda</button>
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 32, padding: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 14, width: 'fit-content', border: '1px solid rgba(255,255,255,0.06)' }}>
          {[['orders', '📋', 'Pedidos'], ['analytics', '📊', 'Analíticas'], ['products', '📦', 'Productos'], ['stock', '📊', 'Stock']].map(([tab, icon, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '9px 22px', borderRadius: 10, background: activeTab === tab ? 'rgba(255,255,255,0.08)' : 'transparent', color: activeTab === tab ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)', border: 'none', cursor: 'pointer', fontWeight: activeTab === tab ? 700 : 400, fontSize: 14, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6 }}>
              {icon} {label}
            </button>
          ))}
        </div>

        {activeTab === 'orders' ? renderOrdersPanel() : activeTab === 'analytics' ? renderAnalyticsPanel() : activeTab === 'products' ? renderProductsPanel() : renderStockPanel()}
      </div>

      <style jsx global>{`
        @keyframes fadeInDown { from { opacity:0; transform:translateY(-16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideInRight { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        @keyframes spin { 0% { transform:rotate(0deg); } 100% { transform:rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.6; } }
        @keyframes ringBell { 0%,100% { transform:rotate(0deg); } 10%,30% { transform:rotate(-12deg); } 20%,40% { transform:rotate(12deg); } 50% { transform:rotate(0deg); } }
        * { box-sizing:border-box; }
        ::-webkit-scrollbar { width:6px; height:6px; }
        ::-webkit-scrollbar-track { background:rgba(255,255,255,0.03); }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.12); border-radius:3px; }
        ::-webkit-scrollbar-thumb:hover { background:rgba(255,255,255,0.2); }
        input::placeholder, textarea::placeholder { color:rgba(255,255,255,0.2) !important; }
        select option { background:#1a1a1a; color:rgba(255,255,255,0.8); }
        @media (max-width:640px) { table { font-size:12px; } }
      `}</style>
    </div>
  );
}
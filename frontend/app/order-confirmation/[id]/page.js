'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { c, styles, mergeStyles } from '../../lib/styles';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  // Función para calcular tiempo restante (corregida UTC)
  const getTimeRemaining = (expiresAt) => {
    if (!expiresAt) return null;
    let expiryStr = expiresAt;
    if (!expiryStr.includes('Z') && !expiryStr.includes('+')) expiryStr += 'Z';
    const expiry = new Date(expiryStr);
    const now = new Date();
    const diff = expiry - now;
    if (diff <= 0) return 'Expirado';
    const totalMinutes = Math.floor(diff / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes} minutos`;
  };

  useEffect(() => {
    const fetchOrder = async () => {
      const access = localStorage.getItem('access');
      if (!access) {
        router.push('/login');
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/orders/${id}/`, {
          headers: { Authorization: `Bearer ${access}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al cargar la orden');
        setOrder(data);
        // Calcular tiempo inicial
        if (data.status === 'pending' && data.expires_at) {
          setTimeLeft(getTimeRemaining(data.expires_at));
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id, router]);

  // Actualizar tiempo cada minuto (solo si es pending)
  useEffect(() => {
    if (!order || order.status !== 'pending' || !order.expires_at) return;
    const interval = setInterval(() => {
      setTimeLeft(getTimeRemaining(order.expires_at));
    }, 60000);
    return () => clearInterval(interval);
  }, [order]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return { emoji: '⏳', label: 'Pendiente', bg: '#fff3e0', color: '#e65100' };
      case 'paid':
        return { emoji: '✅', label: 'Pagado', bg: '#e8f5e9', color: '#2e7d32' };
      case 'shipped':
        return { emoji: '🚚', label: 'Enviado', bg: '#e3f2fd', color: '#1565c0' };
      default:
        return { emoji: '📦', label: status, bg: '#f5f5f5', color: '#666' };
    }
  };

  const handleResumePayment = () => {
    router.push(`/checkout?resume_order=${order.id}`);
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: c.bg, color: c.textMain, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Cargando orden...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ backgroundColor: c.bg, color: c.textMain, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
        <p style={{ color: c.error }}>Error: {error}</p>
        <button onClick={() => router.push('/')} style={styles.buttonSmall()}>Volver al inicio</button>
      </div>
    );
  }

  const statusBadge = getStatusBadge(order.status);
  const isPending = order.status === 'pending';
  const isExpired = timeLeft === 'Expirado';

  return (
    <div style={{ backgroundColor: c.bg, color: c.textMain, minHeight: '100vh' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
        {/* Encabezado */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 20px',
            backgroundColor: statusBadge.bg,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ fontSize: '40px' }}>{statusBadge.emoji}</span>
          </div>
          <h1 style={mergeStyles(styles.heading2, { marginBottom: '8px' })}>
            {isPending ? '¡Pedido pendiente!' : '¡Pedido confirmado!'}
          </h1>
          <p style={{ color: c.textSub }}>
            {isPending
              ? 'Aún no has completado el pago. Tienes tiempo limitado.'
              : 'Gracias por tu compra. Hemos enviado un correo con los detalles.'}
          </p>
        </div>

        {/* Barra de advertencia de PELIGRO (solo para pendientes no expirados) */}
        {isPending && !isExpired && (
          <div style={{
            marginBottom: '30px',
            padding: '20px',
            backgroundColor: 'rgba(239,68,68,0.15)',
            borderRadius: '16px',
            border: `2px solid ${c.primary}`,
            boxShadow: '0 0 15px rgba(184,134,11,0.5)',
            textAlign: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '12px' }}>
              <span style={{ fontSize: '36px' }}>⚠️</span>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: c.primary }}>¡ATENCIÓN! Esta orden se eliminará automáticamente</span>
            </div>
            <p style={{ fontSize: '18px', marginBottom: '8px' }}>
              Te quedan <strong style={{ fontSize: '28px', color: c.primary }}>{timeLeft}</strong> para completar el pago.
            </p>
            <p style={{ fontSize: '14px', color: c.textSub, marginBottom: '20px' }}>
              Si no pagas antes de ese plazo, la orden será cancelada y los productos volverán al carrito.
            </p>
            <button
              onClick={handleResumePayment}
              style={{
                ...styles.buttonPrimary,
                width: 'auto',
                padding: '12px 28px',
                fontSize: '16px',
              }}
            >
              💳 Reanudar pago ahora
            </button>
          </div>
        )}

        {/* Mensaje de expirado */}
        {isPending && isExpired && (
          <div style={{
            marginBottom: '30px',
            padding: '20px',
            backgroundColor: 'rgba(239,68,68,0.2)',
            borderRadius: '16px',
            borderLeft: `6px solid #ef4444`,
            textAlign: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <span style={{ fontSize: '36px' }}>❌</span>
              <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#ef4444' }}>Pedido expirado</span>
            </div>
            <p style={{ marginTop: '8px' }}>No es posible pagar este pedido.</p>
          </div>
        )}

        {/* Detalles de la orden */}
        <div style={mergeStyles(styles.card, { marginBottom: '30px' })}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', margin: 0 }}>Orden #{order.order_number}</h2>
            <span style={{
              padding: '8px 16px',
              borderRadius: '30px',
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: statusBadge.bg,
              color: statusBadge.color,
            }}>
              {statusBadge.emoji} {statusBadge.label}
            </span>
          </div>

          <p style={{ color: c.textSub, marginBottom: '30px' }}>
            Fecha: {new Date(order.created_at + 'Z').toLocaleString('es-CO', {
              year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
            })}
          </p>

          {/* Dirección de envío */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '12px', color: c.textMain }}>Dirección de envío</h3>
            <div style={{ backgroundColor: c.bg, padding: '16px', borderRadius: '8px' }}>
              <p style={{ margin: '4px 0', fontWeight: '500' }}>{order.shipping_address.name}</p>
              <p style={{ margin: '4px 0', color: c.textSub }}>{order.shipping_address.email}</p>
              <p style={{ margin: '4px 0', color: c.textSub }}>{order.shipping_address.phone}</p>
              <p style={{ margin: '12px 0 4px' }}>{order.shipping_address.address}</p>
              <p style={{ margin: '4px 0' }}>{order.shipping_address.city}, {order.shipping_address.department}</p>
              <p style={{ margin: '4px 0' }}>{order.shipping_address.country}</p>
              {order.notes && (
                <p style={{ margin: '12px 0 4px', fontStyle: 'italic', color: c.textSub }}>Nota: {order.notes}</p>
              )}
            </div>
          </div>

          {/* Productos */}
          <h3 style={{ fontSize: '16px', marginBottom: '16px', color: c.textMain }}>Productos</h3>
          <div style={{ marginBottom: '20px' }}>
            {order.items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  padding: '12px 0',
                  borderBottom: idx < order.items.length - 1 ? `1px solid ${c.border}` : 'none',
                }}
              >
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 4px', fontWeight: '500' }}>{item.product_name}</p>
                  <p style={{ margin: 0, fontSize: '13px', color: c.textSub }}>
                    {item.size} · {item.color} · Cantidad: {item.quantity}
                  </p>
                </div>
                <p style={{ margin: 0, fontWeight: 'bold', color: c.primary }}>
                  ${item.subtotal.toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {/* Totales */}
          <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: c.textSub }}>
              <span>Subtotal</span><span>${order.subtotal.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: c.textSub }}>
              <span>Envío</span><span>{order.shipping === 0 ? 'Gratis' : `$${order.shipping.toLocaleString()}`}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: c.textSub }}>
              <span>Impuestos</span><span>${order.tax.toLocaleString()}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontWeight: 'bold',
              fontSize: '18px',
              color: c.primary,
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: `1px solid ${c.border}`,
            }}>
              <span>TOTAL</span><span>${order.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Botones finales (solo si no es pendiente o ya expiró) */}
        {(!isPending || isExpired) && (
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button onClick={() => router.push('/catalog')} style={styles.buttonSmall()}>Seguir comprando</button>
            <button onClick={() => router.push('/')} style={mergeStyles(styles.buttonSecondary(), { fontSize: '14px' })}>Ir al inicio</button>
          </div>
        )}
      </div>
    </div>
  );
}
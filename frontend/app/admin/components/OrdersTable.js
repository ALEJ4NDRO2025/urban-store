
'use client';

import { c } from '../../lib/styles';
import StatusBadge from './StatusBadge';
import { useRouter } from 'next/navigation';

export default function OrdersTable({ orders, onStatusChange, updatingId }) {
  const router = useRouter();

  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending': return { backgroundColor: '#fff3e0', color: '#e65100' };
      case 'paid':    return { backgroundColor: '#e8f5e9', color: '#2e7d32' };
      case 'shipped': return { backgroundColor: '#e3f2fd', color: '#1565c0' };
      default:        return { backgroundColor: '#f5f5f5', color: '#666' };
    }
  };

  if (orders.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: c.textSub }}>
        No hay pedidos que coincidan con los filtros
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
        <thead>
          <tr>
            <th style={{ padding: '16px', textAlign: 'left', color: c.textSub, fontSize: '13px', fontWeight: '600' }}>Nº Orden</th>
            <th style={{ padding: '16px', textAlign: 'left', color: c.textSub, fontSize: '13px', fontWeight: '600' }}>Cliente</th>
            <th style={{ padding: '16px', textAlign: 'left', color: c.textSub, fontSize: '13px', fontWeight: '600' }}>Fecha</th>
            <th style={{ padding: '16px', textAlign: 'left', color: c.textSub, fontSize: '13px', fontWeight: '600' }}>Total</th>
            <th style={{ padding: '16px', textAlign: 'left', color: c.textSub, fontSize: '13px', fontWeight: '600' }}>Estado</th>
            <th style={{ padding: '16px', textAlign: 'left', color: c.textSub, fontSize: '13px', fontWeight: '600' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order, idx) => (
            <tr key={order.id} style={{ borderBottom: `1px solid ${c.border}`, transition: 'background 0.2s', animation: `fadeInUp 0.3s ease-out ${idx * 0.03}s both` }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(184,134,11,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <td style={{ padding: '16px', fontWeight: '500' }}>{order.order_number}</td>
              <td style={{ padding: '16px' }}>
                <div>{order.shipping_address.name}</div>
                <div style={{ fontSize: '12px', color: c.textSub }}>{order.shipping_address.email}</div>
              </td>
              <td style={{ padding: '16px', fontSize: '14px' }}>
                {new Date(order.created_at + 'Z').toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
              </td>
              <td style={{ padding: '16px', fontWeight: '700', color: c.primary }}>${order.total.toLocaleString()}</td>
              <td style={{ padding: '16px' }}>
                <StatusBadge
                  status={order.status}
                  onStatusChange={(newStatus) => onStatusChange(order.id, newStatus)}
                  disabled={updatingId === order.id}
                />
              </td>
              <td style={{ padding: '16px' }}>
                <button
                  onClick={() => router.push(`/order-confirmation/${order.id}`)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: 'transparent',
                    color: c.primary,
                    border: `1px solid ${c.primary}`,
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: '0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = c.primary}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  Ver
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
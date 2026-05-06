
'use client';

import { c } from '../../lib/styles';

export default function StatsCard({ label, value, color, icon }) {
  const glassCard = {
    background: 'rgba(26,26,26,0.6)',
    backdropFilter: 'blur(12px)',
    borderRadius: '16px',
    padding: '20px',
    border: `1px solid ${c.border}`,
    transition: 'all 0.3s ease',
  };

  return (
    <div style={glassCard}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '14px', color: c.textSub }}>{label}</span>
        {icon && <span style={{ fontSize: '24px' }}>{icon}</span>}
      </div>
      <div style={{ fontSize: '32px', fontWeight: 'bold', color: color || c.primary }}>
        {value}
      </div>
    </div>
  );
}
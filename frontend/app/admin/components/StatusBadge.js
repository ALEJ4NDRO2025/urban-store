
'use client';

import { useState } from 'react';
import { c } from '../../lib/styles';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente', color: '#e65100', bg: '#fff3e0' },
  { value: 'paid', label: 'Pagado', color: '#2e7d32', bg: '#e8f5e9' },
  { value: 'shipped', label: 'Enviado', color: '#1565c0', bg: '#e3f2fd' },
];

export default function StatusBadge({ status, onStatusChange, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const current = STATUS_OPTIONS.find(opt => opt.value === status) || STATUS_OPTIONS[0];

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        style={{
          padding: '6px 12px',
          borderRadius: '30px',
          fontSize: '13px',
          fontWeight: '600',
          border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          backgroundColor: current.bg,
          color: current.color,
          transition: 'all 0.2s',
        }}
      >
        {current.label}
      </button>
      {isOpen && !disabled && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: '8px',
          background: c.card,
          backdropFilter: 'blur(12px)',
          borderRadius: '12px',
          border: `1px solid ${c.border}`,
          zIndex: 10,
          minWidth: '120px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        }}>
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => {
                onStatusChange(opt.value);
                setIsOpen(false);
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '8px 12px',
                background: 'transparent',
                border: 'none',
                color: opt.color,
                fontWeight: opt.value === status ? 'bold' : 'normal',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
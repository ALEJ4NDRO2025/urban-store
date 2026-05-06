
'use client';

import { c } from '../../lib/styles';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }
    if (currentPage - delta > 2) {
      range.unshift('...');
    }
    if (currentPage + delta < totalPages - 1) {
      range.push('...');
    }
    range.unshift(1);
    if (totalPages !== 1) range.push(totalPages);
    return range;
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px', alignItems: 'center' }}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={{
          padding: '8px 12px',
          background: 'transparent',
          border: `1px solid ${c.border}`,
          borderRadius: '6px',
          color: c.textMain,
          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
          opacity: currentPage === 1 ? 0.5 : 1,
        }}
      >
        Anterior
      </button>
      {getPageNumbers().map((page, idx) => (
        <button
          key={idx}
          onClick={() => typeof page === 'number' && onPageChange(page)}
          disabled={page === '...'}
          style={{
            padding: '8px 12px',
            background: currentPage === page ? c.primary : 'transparent',
            border: `1px solid ${c.border}`,
            borderRadius: '6px',
            color: currentPage === page ? '#000' : c.textMain,
            fontWeight: currentPage === page ? 'bold' : 'normal',
            cursor: page === '...' ? 'default' : 'pointer',
          }}
        >
          {page}
        </button>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{
          padding: '8px 12px',
          background: 'transparent',
          border: `1px solid ${c.border}`,
          borderRadius: '6px',
          color: c.textMain,
          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
          opacity: currentPage === totalPages ? 0.5 : 1,
        }}
      >
        Siguiente
      </button>
    </div>
  );
}
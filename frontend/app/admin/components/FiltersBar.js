
'use client';

import { useState } from 'react';
import { c } from '../../lib/styles';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function FiltersBar({
  filterStatus,
  setFilterStatus,
  searchTerm,
  setSearchTerm,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onClearFilters,
}) {
  return (
    <div style={{
      background: 'rgba(26,26,26,0.6)',
      backdropFilter: 'blur(12px)',
      borderRadius: '16px',
      padding: '20px 24px',
      marginBottom: '32px',
    }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
        {/* Búsqueda */}
        <div style={{ flex: '2', minWidth: '200px' }}>
          <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', color: c.textSub }}>Buscar</label>
          <input
            type="text"
            placeholder="Nº orden o email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              background: c.input,
              border: `1px solid ${c.border}`,
              borderRadius: '12px',
              color: c.textMain,
              fontSize: '14px',
            }}
          />
        </div>

        {/* Estado */}
        <div style={{ minWidth: '150px' }}>
          <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', color: c.textSub }}>Estado</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              background: c.input,
              border: `1px solid ${c.border}`,
              borderRadius: '12px',
              color: c.textMain,
              fontSize: '14px',
            }}
          >
            <option value="">Todos</option>
            <option value="pending">Pendiente</option>
            <option value="paid">Pagado</option>
            <option value="shipped">Enviado</option>
          </select>
        </div>

        {/* Fecha inicio */}
        <div style={{ minWidth: '150px' }}>
          <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', color: c.textSub }}>Desde</label>
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            dateFormat="yyyy-MM-dd"
            placeholderText="Seleccionar fecha"
            className="custom-datepicker"
            style={{
              width: '100%',
              padding: '10px 14px',
              background: c.input,
              border: `1px solid ${c.border}`,
              borderRadius: '12px',
              color: c.textMain,
            }}
          />
        </div>

        {/* Fecha fin */}
        <div style={{ minWidth: '150px' }}>
          <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', color: c.textSub }}>Hasta</label>
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            dateFormat="yyyy-MM-dd"
            placeholderText="Seleccionar fecha"
            className="custom-datepicker"
            style={{
              width: '100%',
              padding: '10px 14px',
              background: c.input,
              border: `1px solid ${c.border}`,
              borderRadius: '12px',
              color: c.textMain,
            }}
          />
        </div>

        {/* Botón limpiar */}
        <div>
          <button
            onClick={onClearFilters}
            style={{
              padding: '10px 20px',
              background: c.primary,
              border: 'none',
              borderRadius: '40px',
              color: '#000',
              fontWeight: 'bold',
              cursor: 'pointer',
              height: '42px',
            }}
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      <style jsx>{`
        .custom-datepicker {
          width: 100%;
          padding: 10px 14px;
          background: ${c.input};
          border: 1px solid ${c.border};
          border-radius: 12px;
          color: ${c.textMain};
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}
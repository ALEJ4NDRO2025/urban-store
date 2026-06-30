'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { c, styles } from '../lib/styles'

export default function CatalogFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // ═══════════════════════════════════════════════════════════════════════════
  // ESTADOS — Variables que controlan qué filtro está abierto
  // ═══════════════════════════════════════════════════════════════════════════

  // panelPinned: el usuario hizo click para dejarlo abierto (toggle)
  // panelHovering: el mouse está encima del panel
  // El panel se ve si CUALQUIERA de los dos es true (clic O hover)
  const [panelPinned, setPanelPinned] = useState(false)
  const [panelHovering, setPanelHovering] = useState(false)
  const panelOpen = panelPinned || panelHovering

  // isOpen: objeto que mantiene cuál filtro está expandido (true = abierto, false = cerrado)
  // Por defecto TODOS LOS FILTROS CERRADOS: category false, size false, price false
  const [isOpen, setIsOpen] = useState({
    category: false,  // Categoría cerrada por defecto
    size: false,      // Tallas cerradas por defecto
    price: false,     // Precio cerrado por defecto
  })

  // hover: objeto que controla qué botón está siendo hovereado
  // Necesario para mostrar efectos visuales sin interferir con clicks
  const [hoverStates, setHoverStates] = useState({
    category: false,
    size: false,
    price: false,
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // VALORES ACTUALES DE FILTROS (desde URL)
  // ═══════════════════════════════════════════════════════════════════════════

  // activeCategory: valor actual del filtro de categoría (ej: "camisetas")
  const activeCategory = searchParams.get('category')

  // activeSize: valor actual del filtro de talla (ej: "M")
  const activeSize = searchParams.get('size')

  // minPrice, maxPrice: rango de precio actual (ej: min=50, max=200)
  const minPrice = searchParams.get('min_price')
  const maxPrice = searchParams.get('max_price')

  // ═══════════════════════════════════════════════════════════════════════════
  // OPCIONES DISPONIBLES
  // ═══════════════════════════════════════════════════════════════════════════

  // Lista de categorías disponibles para filtrar
  const categories = ['Camisetas', 'Hoodies', 'Pantalones', 'Accesorios', 'Gorras']

  // Lista de tallas disponibles para filtrar
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

  // Lista de rangos de precio disponibles
  const priceRanges = [
    { label: 'Todos', min: null, max: null },
    { label: 'Menos de $50', min: null, max: 50 },
    { label: '$50 - $100', min: 50, max: 100 },
    { label: '$100 - $200', min: 100, max: 200 },
    { label: 'Más de $200', min: 200, max: null },
  ]

  // ═══════════════════════════════════════════════════════════════════════════
  // FUNCIONES — Acciones que el usuario puede hacer
  // ═══════════════════════════════════════════════════════════════════════════

  // toggleFilterSection: abre o cierra una sección de filtro (Categoría, Talla, Precio)
  // filterName: nombre de la sección ("category", "size", "price")
  const toggleFilterSection = (filterName) => {
    setIsOpen((prevState) => ({
      ...prevState,
      [filterName]: !prevState[filterName], // cambiar de false a true o viceversa
    }))
  }

  // applyFilter: aplica un filtro específico y actualiza la URL
  // filterName: tipo de filtro ("category", "size", "price")
  // value: valor del filtro (ej: "camisetas", "M", { min: 50, max: 100 })
  const applyFilter = (filterName, value) => {
    // Copiar parámetros actuales de la URL
    const params = new URLSearchParams(searchParams)

    if (filterName === 'category') {
      // Si el usuario selecciona la misma categoría, deseleccionarla
      if (params.get('category') === value) {
        params.delete('category')
      } else {
        // Si no, establecer la nueva categoría
        params.set('category', value)
      }
    } else if (filterName === 'size') {
      // Mismo comportamiento para talla
      if (params.get('size') === value) {
        params.delete('size')
      } else {
        params.set('size', value)
      }
    } else if (filterName === 'price') {
      // Para precio, si es "todos" (min=null, max=null), limpiar filtro
      if (value.min === null && value.max === null) {
        params.delete('min_price')
        params.delete('max_price')
      } else {
        // Si no, establecer los nuevos valores
        if (value.min) params.set('min_price', value.min)
        else params.delete('min_price')

        if (value.max) params.set('max_price', value.max)
        else params.delete('max_price')
      }
    }

    // Navegar a la URL con los nuevos parámetros
    router.push(`/catalog?${params.toString()}`)
  }

  // clearAllFilters: limpia TODOS los filtros y vuelve a /catalog
  const clearAllFilters = () => {
    router.push('/catalog')
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPONENTES REUTILIZABLES
  // ═══════════════════════════════════════════════════════════════════════════

  // FilterButton: Botón individual de filtro con hover y estado activo
  // label: texto del botón (ej: "Camisetas")
  // isActive: booleano que indica si este filtro está seleccionado
  // onClick: función que se ejecuta al hacer click
  const FilterButton = ({ label, isActive, onClick }) => {
    // hoveringThisButton: controla si el ratón está sobre ESTE botón específico
    const [hoveringThisButton, setHoveringThisButton] = useState(false)

    return (
      <button
        style={styles.filterButton(isActive, hoveringThisButton)}
        onMouseEnter={() => setHoveringThisButton(true)}
        onMouseLeave={() => setHoveringThisButton(false)}
        onClick={onClick}
      >
        {label}
        {/* Mostrar checkmark si está activo */}
        {isActive && (
          <span
            style={{
              marginLeft: '6px',
              fontWeight: '800',
            }}
          >
            ✓
          </span>
        )}
      </button>
    )
  }

  // FilterSection: Sección colapsable que contiene un grupo de filtros
  // title: título de la sección (ej: "Categoría")
  // filterName: identificador único ("category", "size", "price")
  // children: contenido dentro de la sección
  const FilterSection = ({ title, filterName, children }) => {
    // isExpanded: booleano que indica si esta sección está abierta
    const isExpanded = isOpen[filterName]

    // hoveringTitle: controla si el ratón está sobre el título
    const [hoveringTitle, setHoveringTitle] = useState(false)

    return (
      <div
        style={{
          marginBottom: '24px',
          animation: 'slideInLeft 0.4s ease-in-out',
        }}
      >
        {/* ENCABEZADO CLICKEABLE */}
        <button
          onClick={() => toggleFilterSection(filterName)}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            paddingBottom: '12px',
            borderBottom: `1.5px solid ${
              hoveringTitle ? c.primary : c.border
            }`,
            transition: 'all 0.2s ease-in-out',
          }}
          onMouseEnter={() => setHoveringTitle(true)}
          onMouseLeave={() => setHoveringTitle(false)}
        >
          {/* Título de la sección */}
          <h3
            style={{
              ...styles.heading3,
              fontSize: '16px',
              marginBottom: 0,
              color: hoveringTitle ? c.primary : c.textMain,
            }}
          >
            {title}
          </h3>

          {/* Flecha que rota cuando se abre */}
          <span
            style={{
              fontSize: '14px',
              color: hoveringTitle ? c.primary : c.textSub,
              transform: isExpanded ? 'rotate(0deg)' : 'rotate(-180deg)',
              transition: 'transform 0.3s ease-in-out',
            }}
          >
            ▼
          </span>
        </button>

        {/* CONTENIDO — Aparece/desaparece con animación max-height */}
        <div
          style={{
            maxHeight: isExpanded ? '500px' : '0px',
            overflow: 'hidden',
            transition: 'max-height 0.3s ease-in-out',
            paddingTop: isExpanded ? '16px' : '0px',
          }}
        >
          {children}
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER PRINCIPAL
  // ═══════════════════════════════════════════════════════════════════════════

  const activeFiltersCount = [activeCategory, activeSize, (minPrice || maxPrice) ? 'price' : null].filter(Boolean).length

  return (
    <div
      onMouseEnter={() => setPanelHovering(true)}
      onMouseLeave={() => setPanelHovering(false)}
    >
      {/* BARRA SIEMPRE VISIBLE — al hacer click o pasar el mouse por encima se abre el panel */}
      <button
        onClick={() => setPanelPinned((p) => !p)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          backgroundColor: c.card,
          border: `1.5px solid ${panelOpen ? c.primary : c.border}`,
          borderRadius: '8px',
          padding: '14px 20px',
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2 style={{ ...styles.heading2, fontSize: '16px', marginBottom: 0 }}>Filtros</h2>
          {activeFiltersCount > 0 && (
            <span
              style={{
                backgroundColor: c.primary,
                color: '#000',
                borderRadius: '20px',
                padding: '1px 9px',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              {activeFiltersCount}
            </span>
          )}
        </span>
        <span
          style={{
            fontSize: '14px',
            color: panelOpen ? c.primary : c.textSub,
            transform: panelOpen ? 'rotate(0deg)' : 'rotate(-180deg)',
            transition: 'transform 0.3s ease-in-out',
          }}
        >
          ▼
        </span>
      </button>

      {/* PANEL DESPLEGABLE — solo se muestra con click o hover sobre el bloque */}
      <div
        style={{
          maxHeight: panelOpen ? '2000px' : '0px',
          opacity: panelOpen ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.35s ease-in-out, opacity 0.25s ease-in-out, margin-top 0.35s ease-in-out',
          marginTop: panelOpen ? '10px' : '0px',
        }}
      >
        <div
          style={{
            backgroundColor: c.card,
            border: `1.5px solid ${c.border}`,
            borderRadius: '8px',
            padding: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          }}
        >
      {/* HEADER CON TÍTULO Y BOTÓN LIMPIAR */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: `1px solid ${c.border}`,
        }}
      >
        <h2
          style={{
            ...styles.heading2,
            fontSize: '18px',
            marginBottom: 0,
          }}
        >
          Filtros
        </h2>

        {/* BOTÓN "LIMPIAR" — Solo se muestra si hay filtros activos */}
        {(activeCategory || activeSize || minPrice || maxPrice) && (
          <button
            onClick={clearAllFilters}
            style={{
              backgroundColor: 'transparent',
              color: c.error,
              border: `1px solid ${c.error}`,
              padding: '6px 12px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '600',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              transition: 'all 0.2s ease-in-out',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent'
            }}
          >
            Limpiar Todo
          </button>
        )}
      </div>

      {/* SECCIÓN DE CATEGORÍA */}
      <FilterSection title="Categoría" filterName="category">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {categories.map((cat) => {
            // Verificar si esta categoría es la activa
            const isActive = activeCategory === cat.toLowerCase()

            return (
              <FilterButton
                key={cat}
                label={cat}
                isActive={isActive}
                onClick={() => applyFilter('category', cat.toLowerCase())}
              />
            )
          })}
        </div>
      </FilterSection>

      {/* SECCIÓN DE TALLA */}
      <FilterSection title="Talla" filterName="size">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
          }}
        >
          {sizes.map((size) => {
            // Verificar si esta talla es la activa
            const isActive = activeSize === size

            return (
              <FilterButton
                key={size}
                label={size}
                isActive={isActive}
                onClick={() => applyFilter('size', size)}
              />
            )
          })}
        </div>
      </FilterSection>

      {/* SECCIÓN DE PRECIO */}
      <FilterSection title="Precio" filterName="price">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {priceRanges.map((range) => {
            // Verificar si este rango de precio es el activo
            const isActive =
              Number(minPrice || 0) === (range.min || 0) &&
              Number(maxPrice || 999999) === (range.max || 999999)

            return (
              <FilterButton
                key={range.label}
                label={range.label}
                isActive={isActive}
                onClick={() => applyFilter('price', range)}
              />
            )
          })}
        </div>
      </FilterSection>

      {/* MOSTRA FILTROS ACTIVOS COMO BADGES */}
      {(activeCategory || activeSize || minPrice || maxPrice) && (
        <div
          style={{
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: `1px solid ${c.border}`,
            animation: 'slideInLeft 0.3s ease-in-out',
          }}
        >
          <p
            style={{
              ...styles.bodySmall,
              color: c.textWeak,
              marginBottom: '8px',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Filtros Activos:
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            {/* Badge de categoría */}
            {activeCategory && (
              <span
                style={{
                  backgroundColor: 'rgba(184, 134, 11, 0.15)',
                  color: c.primary,
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {activeCategory}
                <button
                  onClick={() =>
                    applyFilter('category', activeCategory)
                  }
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: c.primary,
                    cursor: 'pointer',
                    fontSize: '14px',
                    padding: 0,
                    fontWeight: '800',
                  }}
                >
                  ✕
                </button>
              </span>
            )}

            {/* Badge de talla */}
            {activeSize && (
              <span
                style={{
                  backgroundColor: 'rgba(184, 134, 11, 0.15)',
                  color: c.primary,
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                Talla: {activeSize}
                <button
                  onClick={() => applyFilter('size', activeSize)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: c.primary,
                    cursor: 'pointer',
                    fontSize: '14px',
                    padding: 0,
                    fontWeight: '800',
                  }}
                >
                  ✕
                </button>
              </span>
            )}

            {/* Badge de precio */}
            {(minPrice || maxPrice) && (
              <span
                style={{
                  backgroundColor: 'rgba(184, 134, 11, 0.15)',
                  color: c.primary,
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                ${minPrice || '0'} - ${maxPrice || '∞'}
                <button
                  onClick={() =>
                    applyFilter('price', { min: null, max: null })
                  }
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: c.primary,
                    cursor: 'pointer',
                    fontSize: '14px',
                    padding: 0,
                    fontWeight: '800',
                  }}
                >
                  ✕
                </button>
              </span>
            )}
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  )
}
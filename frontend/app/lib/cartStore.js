import { create } from 'zustand'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const useCartStore = create((set, get) => ({
  items: [],
  total: 0,
  itemCount: 0,
  loading: false,
  error: null,

  // Cargar carrito del servidor
  fetchCart: async () => {
    set({ loading: true })
    const token = localStorage.getItem('access')  // ← CAMBIO: busca 'access', no 'token'
    if (!token) {
      set({ loading: false })
      return
    }

    try {
      const res = await fetch(`${API_URL}/api/cart/`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      const data = await res.json()
      set({
        items: data.items || [],
        total: data.total || 0,
        itemCount: data.item_count || 0,
        error: null,
        loading: false,
      })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  // Agregar item al carrito
  addItem: async (cartItem) => {
    const token = localStorage.getItem('access')  // ← CAMBIO: busca 'access'
    if (!token) {
      set({ error: 'No token' })
      return
    }

    try {
      const res = await fetch(`${API_URL}/api/cart/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cartItem),
      })
      const data = await res.json()
      set({
        items: data.items || [],
        total: data.total || 0,
        itemCount: data.item_count || 0,
        error: null,
      })
    } catch (err) {
      set({ error: err.message })
    }
  },

  // Actualizar cantidad
  updateQuantity: async (product_slug, selected_size, selected_color, quantity) => {
    const token = localStorage.getItem('access')  // ← CAMBIO: busca 'access'
    if (!token) return

    try {
      const res = await fetch(`${API_URL}/api/cart/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_slug,
          selected_size,
          selected_color,
          quantity,
        }),
      })
      const data = await res.json()
      set({
        items: data.items || [],
        total: data.total || 0,
        itemCount: data.item_count || 0,
      })
    } catch (err) {
      set({ error: err.message })
    }
  },

  // Eliminar item
  removeItem: async (product_slug, selected_size, selected_color) => {
    const token = localStorage.getItem('access')  // ← CAMBIO: busca 'access'
    if (!token) return

    try {
      const res = await fetch(`${API_URL}/api/cart/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_slug,
          selected_size,
          selected_color,
        }),
      })
      const data = await res.json()
      set({
        items: data.items || [],
        total: data.total || 0,
        itemCount: data.item_count || 0,
      })
    } catch (err) {
      set({ error: err.message })
    }
  },

  // Crear orden
  createOrder: async (shippingAddress, notes = '') => {
    const token = localStorage.getItem('access')  // ← CAMBIO: busca 'access'
    if (!token) {
      set({ error: 'No token' })
      return null
    }

    try {
      const res = await fetch(`${API_URL}/api/orders/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shipping_address: shippingAddress,
          notes,
        }),
      })
      const data = await res.json()
      // Limpiar carrito
      set({
        items: [],
        total: 0,
        itemCount: 0,
        error: null,
      })
      return data
    } catch (err) {
      set({ error: err.message })
      return null
    }
  },

  // Limpiar carrito manualmente
  clearCart: () => set({ items: [], total: 0, itemCount: 0 }),
}))
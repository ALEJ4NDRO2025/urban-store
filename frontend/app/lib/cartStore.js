import { create } from 'zustand';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const useCartStore = create((set, get) => ({
  items: [],
  loadingCart: false,

  // ─── Cargar carrito desde el backend (cuando el usuario inicia sesión o se monta la app) ───
  fetchCart: async () => {
    const token = localStorage.getItem('access');
    if (!token) {
      set({ loadingCart: false });
      return;
    }

    set({ loadingCart: true });
    try {
      const res = await fetch(`${API_URL}/api/cart/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        // Asegurar que los items tengan la estructura correcta
        const items = (data.items || []).map(item => ({
          product_slug: item.product_slug,
          product_name: item.product_name,
          quantity: item.quantity,
          selected_size: item.selected_size,
          selected_color: item.selected_color,
          price_at_time: item.price_at_time || item.price_paid,
          image: item.image || '',
        }));
        set({ items, loadingCart: false });
      } else {
        set({ items: [], loadingCart: false });
      }
    } catch (err) {
      console.warn('Error cargando carrito:', err);
      set({ items: [], loadingCart: false });
    }
  },

  // ─── Sincronizar el carrito local con el backend ───
  syncCartToBackend: async (itemsToSync) => {
    const token = localStorage.getItem('access');
    if (!token) return;
    try {
      await fetch(`${API_URL}/api/cart/sync/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items: itemsToSync }),
      });
    } catch (err) {
      console.warn('Error sincronizando carrito:', err);
    }
  },

  // ─── Agregar un producto al carrito ──────────────────────────
  addItem: async (newItem) => {
    const token = localStorage.getItem('access');
    if (!token) throw new Error('No autenticado');

    const { items } = get();
    const existingIndex = items.findIndex(
      (item) =>
        item.product_slug === newItem.product_slug &&
        item.selected_size === newItem.selected_size &&
        item.selected_color === newItem.selected_color
    );

    let updatedItems;
    if (existingIndex >= 0) {
      updatedItems = [...items];
      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        quantity: updatedItems[existingIndex].quantity + (newItem.quantity || 1),
      };
    } else {
      updatedItems = [...items, { ...newItem, quantity: newItem.quantity || 1 }];
    }

    set({ items: updatedItems });
    // Sincronizar al backend
    await get().syncCartToBackend(updatedItems);
  },

  // ─── Actualizar cantidad de un item existente ─────────────────
  updateItemQuantity: async (productSlug, size, color, newQuantity) => {
    const token = localStorage.getItem('access');
    if (!token) return;

    const { items } = get();
    const updatedItems = items.map((item) =>
      item.product_slug === productSlug &&
      item.selected_size === size &&
      item.selected_color === color
        ? { ...item, quantity: newQuantity }
        : item
    );

    set({ items: updatedItems });
    await get().syncCartToBackend(updatedItems);
  },

  // ─── Eliminar un item del carrito ─────────────────────────────
  removeItem: async (productSlug, size, color) => {
    const token = localStorage.getItem('access');
    if (!token) return;

    const { items } = get();
    const updatedItems = items.filter(
      (item) =>
        !(
          item.product_slug === productSlug &&
          item.selected_size === size &&
          item.selected_color === color
        )
    );

    set({ items: updatedItems });
    await get().syncCartToBackend(updatedItems);
  },

  // ─── Vaciar carrito ───────────────────────────────────────────
  clearCart: async () => {
    const token = localStorage.getItem('access');
    if (!token) return;
    set({ items: [] });
    await get().syncCartToBackend([]);
  },

  // ─── Crear orden (mantén la que ya tenías, esta es una referencia) ───
  createOrder: async (shippingAddress, notes = '') => {
    const token = localStorage.getItem('access');
    if (!token) throw new Error('No autenticado');

    const { items } = get();
    if (items.length === 0) throw new Error('Carrito vacío');

    const res = await fetch(`${API_URL}/api/orders/create/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        items: items.map((item) => ({
          product_slug: item.product_slug,
          product_name: item.product_name,
          quantity: item.quantity,
          price_paid: item.price_at_time,
          selected_size: item.selected_size,
          selected_color: item.selected_color,
        })),
        shipping_address: shippingAddress,
        notes,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error creando la orden');
    }

    const order = await res.json();
    set({ items: [] });
    return order;
  },

  // ─── Total calculado automáticamente ──────────────────────────
  get total() {
    return get().items.reduce(
      (sum, item) => sum + item.price_at_time * item.quantity,
      0
    );
  },
}));
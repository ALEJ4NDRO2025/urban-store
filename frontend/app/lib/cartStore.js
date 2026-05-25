import { create } from 'zustand';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ─── Helpers de localStorage ─────────────────────────
const loadLocalCart = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('urban_cart_items');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalCart = (items) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('urban_cart_items', JSON.stringify(items));
};

// ─── Store ────────────────────────────────────────────
export const useCartStore = create((set, get) => ({
  items: loadLocalCart(),

  // Sincronizar con el backend (reactivado)
  syncWithBackend: async (items) => {
    const token = localStorage.getItem('access');
    if (!token) return;
    try {
      await fetch(`${API_URL}/api/cart/sync/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items }),
      });
    } catch (err) {
      console.warn('Error sincronizando carrito (no crítico):', err);
    }
  },

  // Cargar desde el backend al iniciar sesión
  loadCartFromBackend: async () => {
    const token = localStorage.getItem('access');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/cart/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          set({ items: data.items });
          saveLocalCart(data.items);
        }
      }
    } catch (err) {
      console.warn('No se pudo cargar el carrito del backend:', err);
    }
  },

  addItem: async (newItem) => {
    const token = localStorage.getItem('access');
    if (!token) throw new Error('No autenticado');

    const items = get().items;
    const existingIndex = items.findIndex(
      (i) =>
        i.product_slug === newItem.product_slug &&
        i.selected_size === newItem.selected_size &&
        i.selected_color === newItem.selected_color
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
    saveLocalCart(updatedItems);
    get().syncWithBackend(updatedItems);
  },

  updateItemQuantity: async (productSlug, size, color, newQuantity) => {
    const items = get().items.map((item) =>
      item.product_slug === productSlug &&
      item.selected_size === size &&
      item.selected_color === color
        ? { ...item, quantity: newQuantity }
        : item
    );
    set({ items });
    saveLocalCart(items);
    get().syncWithBackend(items);
  },

  removeItem: async (productSlug, size, color) => {
    const items = get().items.filter(
      (item) =>
        !(
          item.product_slug === productSlug &&
          item.selected_size === size &&
          item.selected_color === color
        )
    );
    set({ items });
    saveLocalCart(items);
    get().syncWithBackend(items);
  },

  clearCart: async () => {
    set({ items: [] });
    saveLocalCart([]);
    get().syncWithBackend([]);
  },

  createOrder: async (shippingAddress, notes = '', items = null) => {
    const token = localStorage.getItem('access');
    if (!token) throw new Error('No autenticado');

    const orderItems = items || get().items;
    console.log('📦 Items recibidos en createOrder:', orderItems);

    if (!orderItems || orderItems.length === 0) {
      console.error('❌ createOrder: el array de items está vacío.');
      throw new Error('El carrito está vacío');
    }

    const requestBody = {
      items: orderItems.map((item) => ({
        product_slug: item.product_slug,
        product_name: item.product_name,
        quantity: item.quantity,
        price_paid: parseFloat(item.price_at_time) || 0,
        selected_size: item.selected_size || '',
        selected_color: item.selected_color || '',
      })),
      shipping_address: shippingAddress,
      notes: notes || '',
    };

    console.log('🚀 Enviando orden al backend:', JSON.stringify(requestBody, null, 2));

    const res = await fetch(`${API_URL}/api/orders/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('❌ Error del backend:', errorData);
      throw new Error(errorData.error || 'Error creando la orden');
    }

    const order = await res.json();
    console.log('✅ Orden creada exitosamente:', order);

    set({ items: [] });
    saveLocalCart([]);
    get().syncWithBackend([]);
    return order;
  },

  get total() {
    return get().items.reduce((sum, item) => {
      const price = parseFloat(item.price_at_time) || 0;
      return sum + price * item.quantity;
    }, 0);
  },
}));
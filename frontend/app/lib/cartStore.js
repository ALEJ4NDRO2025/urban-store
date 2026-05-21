import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      // Agregar un producto
      addItem: (newItem) => {
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
      },

      // Actualizar cantidad de un producto
      updateItemQuantity: (productSlug, size, color, newQuantity) => {
        if (newQuantity < 1) return;
        const items = get().items.map((item) =>
          item.product_slug === productSlug &&
          item.selected_size === size &&
          item.selected_color === color
            ? { ...item, quantity: newQuantity }
            : item
        );
        set({ items });
      },

      // Eliminar un producto
      removeItem: (productSlug, size, color) => {
        const items = get().items.filter(
          (item) =>
            !(
              item.product_slug === productSlug &&
              item.selected_size === size &&
              item.selected_color === color
            )
        );
        set({ items });
      },

      // Vaciar carrito
      clearCart: () => set({ items: [] }),

      // Total calculado (robusto)
      get total() {
        return get().items.reduce((sum, item) => {
          const price = parseFloat(item.price_at_time) || 0;
          return sum + price * item.quantity;
        }, 0);
      },

      // Crear orden (se mantiene igual a tu última versión funcional)
      createOrder: async (shippingAddress, notes = '') => {
        const token = localStorage.getItem('access');
        if (!token) throw new Error('No autenticado');

        const items = get().items;
        if (items.length === 0) throw new Error('Carrito vacío');

        const res = await fetch(`${API_URL}/api/orders/`, {
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
        set({ items: [] }); // Limpiar carrito tras éxito
        return order;
      },
    }),
    {
      name: 'urban-cart', // clave en localStorage
    }
  )
);
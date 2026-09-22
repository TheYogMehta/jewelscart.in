import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useEffect, useState } from "react";

export interface CartItem {
  id: string;
  productId?: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  maxStock?: number | null;
  category?: string;
  type?: string;
  sku?: string;
  options?: Record<string, string | number>;
}

export interface DeliveryAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
}

export function calculateShippingFee(
  subtotal: number,
  state?: string,
): {
  fee: number;
  label: string;
  isFree: boolean;
  thresholdRemaining: number;
} {
  const FREE_SHIPPING_THRESHOLD = 5000;
  if (subtotal >= FREE_SHIPPING_THRESHOLD) {
    return {
      fee: 0,
      label: "FREE (Orders over ₹5,000)",
      isFree: true,
      thresholdRemaining: 0,
    };
  }

  const remaining = FREE_SHIPPING_THRESHOLD - subtotal;

  if (!state || !state.trim()) {
    return {
      fee: 0,
      label: "Select delivery address to calculate",
      isFree: false,
      thresholdRemaining: remaining,
    };
  }

  if (state.trim().toLowerCase() === "maharashtra") {
    return {
      fee: 99,
      label: "Flat ₹99 (Maharashtra)",
      isFree: false,
      thresholdRemaining: remaining,
    };
  }

  return {
    fee: 199,
    label: "Flat ₹199 (Pan-India)",
    isFree: false,
    thresholdRemaining: remaining,
  };
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  deliveryAddress: DeliveryAddress | null;

  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;

  setDeliveryAddress: (address: DeliveryAddress | null) => void;

  getItemCount: () => number;
  getItemQuantity: (id: string) => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      deliveryAddress: null,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      setDeliveryAddress: (address) => set({ deliveryAddress: address }),

      addItem: (item, qty = 1) => {
        set((state) => {
          const existingIndex = state.items.findIndex((i) => i.id === item.id);
          const maxStock =
            item.maxStock !== undefined && item.maxStock !== null
              ? item.maxStock
              : Infinity;

          if (existingIndex > -1) {
            const currentItem = state.items[existingIndex];
            const allowedMax =
              currentItem.maxStock !== undefined &&
              currentItem.maxStock !== null
                ? currentItem.maxStock
                : maxStock;
            const newQuantity = Math.min(
              currentItem.quantity + qty,
              allowedMax,
            );
            const updated = [...state.items];
            updated[existingIndex] = {
              ...currentItem,
              quantity: newQuantity,
              maxStock:
                item.maxStock !== undefined
                  ? item.maxStock
                  : currentItem.maxStock,
            };
            return { items: updated };
          }

          const initialQty = Math.min(qty, maxStock);
          return {
            items: [...state.items, { ...item, quantity: initialQty }],
          };
        });
      },

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),

      updateQuantity: (id, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter((i) => i.id !== id) };
          }
          return {
            items: state.items.map((i) => {
              if (i.id === id) {
                const maxStock =
                  i.maxStock !== undefined && i.maxStock !== null
                    ? i.maxStock
                    : Infinity;
                return { ...i, quantity: Math.min(quantity, maxStock) };
              }
              return i;
            }),
          };
        }),

      clearCart: () => set({ items: [] }),

      getItemCount: () =>
        get().items.reduce((total, item) => total + item.quantity, 0),

      getItemQuantity: (id: string) => {
        const item = get().items.find((i) => i.id === id);
        return item ? item.quantity : 0;
      },

      getSubtotal: () =>
        get().items.reduce(
          (total, item) => total + (item.price || 0) * item.quantity,
          0,
        ),
    }),
    {
      name: "jewelscart_bag_v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        deliveryAddress: state.deliveryAddress,
      }),
    },
  ),
);

export function useCartHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}

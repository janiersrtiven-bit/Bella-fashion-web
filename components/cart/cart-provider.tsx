"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  key: string;
  productId: number;
  variantId: number | null;
  name: string;
  slug: string;
  image: string;
  priceCents: number;
  quantity: number;
  stock: number;
  variantLabel?: string;
};

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  subtotalCents: number;
  hydrated: boolean;
  addItem: (item: Omit<CartItem, "key" | "quantity">, quantity?: number) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
};

const STORAGE_KEY = "bella-fashion-cart-v1";
const CartContext = createContext<CartContextValue | null>(null);

function makeKey(productId: number, variantId: number | null) {
  return `${productId}:${variantId ?? "base"}`;
}

function isStoredCart(value: unknown): value is CartItem[] {
  return Array.isArray(value) && value.every((item) =>
    item && typeof item === "object" &&
    typeof item.key === "string" &&
    Number.isInteger(item.productId) &&
    Number.isInteger(item.quantity) &&
    item.quantity > 0
  );
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
        if (isStoredCart(stored)) setItems(stored);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      } finally {
        setHydrated(true);
      }
    });
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [hydrated, items]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    hydrated,
    totalItems: items.reduce((total, item) => total + item.quantity, 0),
    subtotalCents: items.reduce((total, item) => total + item.priceCents * item.quantity, 0),
    addItem(item, quantity = 1) {
      const key = makeKey(item.productId, item.variantId);
      setItems((previous) => {
        const current = previous.find((entry) => entry.key === key);
        if (!current) return [...previous, { ...item, key, quantity: Math.min(Math.max(1, quantity), item.stock) }];
        return previous.map((entry) => entry.key === key
          ? { ...entry, ...item, quantity: Math.min(entry.quantity + Math.max(1, quantity), item.stock) }
          : entry
        );
      });
    },
    updateQuantity(key, quantity) {
      setItems((previous) => previous.map((item) => item.key === key
        ? { ...item, quantity: Math.min(Math.max(1, quantity), item.stock) }
        : item
      ));
    },
    removeItem(key) {
      setItems((previous) => previous.filter((item) => item.key !== key));
    },
    clearCart() {
      setItems([]);
    },
  }), [hydrated, items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart deve ser usado dentro de CartProvider");
  return context;
}

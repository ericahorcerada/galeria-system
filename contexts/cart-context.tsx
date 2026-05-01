"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const CART_STORAGE_KEY = "galeria_cart_v1";
const MAX_ITEM_QUANTITY = 99;

export interface CartItem {
  id: string;
  title: string;
  artist: string;
  price: number;
  image: string;
  quantity: number;
  category: string;
  medium?: string;
  dimensions?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function clampQuantity(quantity: number) {
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(MAX_ITEM_QUANTITY, Math.max(1, Math.floor(quantity)));
}

function normalizeCartItem(item: CartItem): CartItem {
  return {
    ...item,
    id: String(item.id),
    title: item.title.trim(),
    artist: item.artist.trim(),
    category: item.category.trim(),
    price: Math.max(0, Number(item.price) || 0),
    quantity: clampQuantity(item.quantity),
  };
}

function readStoredCart(): CartItem[] {
  if (typeof window === "undefined") return [];

  try {
    const rawCart = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!rawCart) return [];

    const parsed = JSON.parse(rawCart);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item): item is CartItem => Boolean(item?.id && item?.title && item?.artist))
      .map(normalizeCartItem);
  } catch {
    window.localStorage.removeItem(CART_STORAGE_KEY);
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setItems(readStoredCart());
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;

    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage may be unavailable in private browsing or constrained environments.
    }
  }, [hasHydrated, items]);

  const addItem = useCallback((item: CartItem) => {
    const nextItem = normalizeCartItem(item);

    setItems((currentItems) => {
      const existingItem = currentItems.find((cartItem) => cartItem.id === nextItem.id);

      if (!existingItem) return [...currentItems, nextItem];

      return currentItems.map((cartItem) =>
        cartItem.id === nextItem.id
          ? {
              ...cartItem,
              quantity: clampQuantity(cartItem.quantity + nextItem.quantity),
            }
          : cartItem,
      );
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id ? { ...item, quantity: clampQuantity(quantity) } : item,
      ),
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);

    try {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      // Ignore storage failures; the in-memory cart has already been cleared.
    }
  }, []);

  const getTotalPrice = useCallback(
    () => items.reduce((total, item) => total + item.price * item.quantity, 0),
    [items],
  );

  const getTotalItems = useCallback(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      getTotalPrice,
      getTotalItems,
    }),
    [items, addItem, removeItem, updateQuantity, clearCart, getTotalPrice, getTotalItems],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
}

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CartItem {
  itemId: number;
  name: string;
  price: number;
  quantity: number;
  barcode: string | null;
  imageUrl: string | null;
}

interface CartContextType {
  items: CartItem[];
  total: number;
  itemCount: number;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (itemId: number) => void;
  updateQuantity: (itemId: number, quantity: number) => void;
  setCart: (items: CartItem[]) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

const CART_STORAGE_KEY = '@sneaker_lounge_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from storage on mount
  useEffect(() => {
    AsyncStorage.getItem(CART_STORAGE_KEY)
      .then((stored) => {
        if (stored) {
          setItems(JSON.parse(stored));
        }
      })
      .catch(console.error);
  }, []);

  // Save cart to storage whenever it changes
  useEffect(() => {
    AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items)).catch(console.error);
  }, [items]);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.itemId === item.itemId);
      if (existing) {
        return prev.map((i) =>
          i.itemId === item.itemId ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { ...item, quantity }];
    });
  }, []);

  const removeItem = useCallback((itemId: number) => {
    setItems((prev) => prev.filter((i) => i.itemId !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: number, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.itemId !== itemId));
    } else {
      setItems((prev) =>
        prev.map((i) => (i.itemId === itemId ? { ...i, quantity } : i))
      );
    }
  }, []);

  const setCart = useCallback((newItems: CartItem[]) => {
    setItems(newItems);
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  return (
    <CartContext.Provider
      value={{
        items,
        total,
        itemCount,
        addItem,
        removeItem,
        updateQuantity,
        setCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TransferItem {
  itemId: number;
  name: string;
  price: number;
  quantity: number;
  maxQuantity: number;
  category?: string;
  subCategory?: string | null;
}

interface TransferContextType {
  items: TransferItem[];
  sourceBranchId: number | null;
  sourceBranchName: string;
  itemCount: number;
  addItem: (item: Omit<TransferItem, 'quantity'>, quantity?: number) => void;
  removeItem: (itemId: number) => void;
  updateQuantity: (itemId: number, quantity: number) => void;
  toggleItem: (item: Omit<TransferItem, 'quantity'>) => void;
  setSourceBranch: (id: number, name: string) => void;
  clearTransfer: () => void;
}

const TransferContext = createContext<TransferContextType | null>(null);

const TRANSFER_STORAGE_KEY = '@sneaker_lounge_transfer';

export function TransferProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<TransferItem[]>([]);
  const [sourceBranchId, setSourceBranchId] = useState<number | null>(null);
  const [sourceBranchName, setSourceBranchName] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load transfer state from storage on mount
  useEffect(() => {
    AsyncStorage.getItem(TRANSFER_STORAGE_KEY)
      .then((stored) => {
        if (stored) {
          try {
            const data = JSON.parse(stored);
            if (Array.isArray(data.items)) {
              setItems(data.items);
            }
            if (data.sourceBranchId !== undefined) {
              setSourceBranchId(data.sourceBranchId !== null ? Number(data.sourceBranchId) : null);
            }
            if (data.sourceBranchName) {
              setSourceBranchName(data.sourceBranchName);
            }
          } catch (e) {
            console.error('Failed to parse transfer storage', e);
          }
        }
      })
      .catch((err) => console.error('Error loading transfer storage:', err))
      .finally(() => {
        setIsLoaded(true);
      });
  }, []);

  // Save transfer state whenever it changes (only after initial load)
  useEffect(() => {
    if (!isLoaded) return;
    const payload = JSON.stringify({
      items,
      sourceBranchId,
      sourceBranchName,
    });
    AsyncStorage.setItem(TRANSFER_STORAGE_KEY, payload).catch((err) =>
      console.error('Error saving transfer storage:', err)
    );
  }, [items, sourceBranchId, sourceBranchName, isLoaded]);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const addItem = useCallback((item: Omit<TransferItem, 'quantity'>, quantity: number = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.itemId === item.itemId);
      if (existing) {
        return prev.map((i) =>
          i.itemId === item.itemId
            ? { ...i, quantity: Math.min(i.quantity + quantity, i.maxQuantity) }
            : i
        );
      }
      return [...prev, { ...item, quantity: Math.min(quantity, item.maxQuantity) }];
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
        prev.map((i) =>
          i.itemId === itemId ? { ...i, quantity: Math.min(quantity, i.maxQuantity) } : i
        )
      );
    }
  }, []);

  const toggleItem = useCallback((item: Omit<TransferItem, 'quantity'>) => {
    setItems((prev) => {
      const exists = prev.some((i) => i.itemId === item.itemId);
      if (exists) {
        return prev.filter((i) => i.itemId !== item.itemId);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const setSourceBranch = useCallback((id: number, name: string) => {
    setSourceBranchId(Number(id));
    setSourceBranchName(name);
  }, []);

  const clearTransfer = useCallback(() => {
    setItems([]);
    setSourceBranchId(null);
    setSourceBranchName('');
    AsyncStorage.removeItem(TRANSFER_STORAGE_KEY).catch(console.error);
  }, []);

  return (
    <TransferContext.Provider
      value={{
        items,
        sourceBranchId,
        sourceBranchName,
        itemCount,
        addItem,
        removeItem,
        updateQuantity,
        toggleItem,
        setSourceBranch,
        clearTransfer,
      }}
    >
      {children}
    </TransferContext.Provider>
  );
}

export function useTransfer() {
  const ctx = useContext(TransferContext);
  if (!ctx) throw new Error('useTransfer must be used inside TransferProvider');
  return ctx;
}

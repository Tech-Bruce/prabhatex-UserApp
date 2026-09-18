import { useState, useEffect, useCallback } from 'react';

const MAX_RECENT_PRODUCTS = 10;

export interface RecentProduct {
  id: string;
  productName: string;
  price: string;
  finalPrice: string;
  productImages: string[];
}

// In-memory global store to avoid AsyncStorage Native Module errors in this environment
let globalRecentlyViewed: RecentProduct[] = [];
let listeners: Array<(products: RecentProduct[]) => void> = [];

export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState<RecentProduct[]>(globalRecentlyViewed);

  useEffect(() => {
    // Subscribe to changes
    const listener = (products: RecentProduct[]) => {
      setRecentlyViewed(products);
    };
    listeners.push(listener);
    
    return () => {
      // Unsubscribe on unmount
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  const addProductToRecentlyViewed = useCallback((product: RecentProduct) => {
    // Remove the product if it already exists to put it at the top
    const filtered = globalRecentlyViewed.filter((p) => p.id !== product.id);
    const updated = [product, ...filtered].slice(0, MAX_RECENT_PRODUCTS);
    
    // Update global state and notify all listeners
    globalRecentlyViewed = updated;
    listeners.forEach(listener => listener(updated));
  }, []);

  return { recentlyViewed, addProductToRecentlyViewed };
}

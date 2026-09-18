import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from '@/src/utils/axiosInstance';
import Toast from 'react-native-toast-message';

export interface WishlistItem {
  id: string; // Product ID
  name: string;
  price: number;
  finalPrice: number;
  image: string;
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  addToWishlist: (item: WishlistItem) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  isLoadingWishlist: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isLoadingWishlist, setIsLoadingWishlist] = useState(false);

  const fetchWishlistFromAPI = useCallback(async () => {
    setIsLoadingWishlist(true);
    try {
      const res = await api.get('/wishlist/get');
      // Assume backend returns { data: [...] } where each item has `.product`
      if (res.data?.data) {
        const mappedWishlist: WishlistItem[] = res.data.data.map((item: any) => ({
          id: item.product?.id || item.productId,
          name: item.product?.productName || 'Unknown Product',
          price: parseFloat(item.product?.price || '0'),
          finalPrice: parseFloat(item.product?.finalPrice || '0'),
          image: (item.product?.productImages && item.product.productImages[0]) || '',
        }));
        setWishlist(mappedWishlist);
      }
    } catch (error) {
      console.error('Failed to fetch wishlist from backend', error);
    } finally {
      setIsLoadingWishlist(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchWishlistFromAPI();
    } else {
      setWishlist([]); // Clear guest wishlist to keep it simple, or keep it in-memory
    }
  }, [user, fetchWishlistFromAPI]);

  const addToWishlist = async (item: WishlistItem) => {
    // Optimistic UI update
    setWishlist((prev) => {
      if (!prev.find((w) => w.id === item.id)) {
        return [...prev, item];
      }
      return prev;
    });

    if (user) {
      try {
        await api.post('/wishlist/add', { productId: item.id });
      } catch (err) {
        console.error('API Add to Wishlist Failed', err);
        // Rollback on fail
        setWishlist((prev) => prev.filter((w) => w.id !== item.id));
        Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to add to wishlist' });
      }
    }
  };

  const removeFromWishlist = async (productId: string) => {
    const itemToRemove = wishlist.find((w) => w.id === productId);
    // Optimistic UI update
    setWishlist((prev) => prev.filter((w) => w.id !== productId));

    if (user) {
      try {
        await api.delete(`/wishlist/remove/${productId}`);
      } catch (err) {
        console.error('API Remove from Wishlist Failed', err);
        // Rollback on fail
        if (itemToRemove) {
          setWishlist((prev) => [...prev, itemToRemove]);
        }
        Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to remove from wishlist' });
      }
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some((item) => item.id === productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        isLoadingWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

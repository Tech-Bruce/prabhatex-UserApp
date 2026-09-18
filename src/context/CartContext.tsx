import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from '@/src/utils/axiosInstance';

export interface CartItem {
  id: string; // Product ID
  cartId?: string; // Backend Cart Item ID (only available when synced to backend)
  name: string;
  price: number;
  image: string;
  size?: string;
  quantity: number;
  maxStock: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => Promise<void>;
  removeFromCart: (id: string, cartId?: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number, cartId?: string) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
  isLoadingCart: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoadingCart, setIsLoadingCart] = useState(false);

  // Fetch cart from backend if authenticated
  const fetchCartFromAPI = useCallback(async () => {
    setIsLoadingCart(true);
    try {
      const res = await api.get('/cart');
      if (res.data?.data?.cartItems) {
        const mappedCart: CartItem[] = res.data.data.cartItems.map((item: any) => ({
          cartId: item.id,
          id: item.productId || item.product?.id,
          name: item.product?.productName || 'Unknown Product',
          price: parseFloat(item.product?.finalPrice || '0'),
          image: (item.product?.productImages && item.product.productImages[0]) || '',
          quantity: item.quantity,
          maxStock: item.product?.stockQuantity || 10,
        }));
        setCart(mappedCart);
      }
    } catch (error) {
      console.error('Failed to fetch cart from backend', error);
    } finally {
      setIsLoadingCart(false);
    }
  }, []);

  // Load cart initially
  useEffect(() => {
    const initializeCart = async () => {
      if (user) {
        await fetchCartFromAPI();
      }
      setIsLoaded(true);
    };

    initializeCart();
  }, [user, fetchCartFromAPI]);

  // Removed AsyncStorage save logic to prevent Native Module errors

  const addToCart = async (item: CartItem) => {
    if (user) {
      try {
        await api.post('/cart/add', {
          productId: item.id,
          quantity: item.quantity,
          image: item.image,
        });
        await fetchCartFromAPI();
      } catch (err) {
        console.error('API Add to Cart Failed', err);
      }
    } else {
      setCart((prevCart) => {
        const existingItem = prevCart.find((i) => i.id === item.id);
        if (existingItem) {
          return prevCart.map((i) =>
            i.id === item.id
              ? { ...i, quantity: Math.min(i.quantity + item.quantity, i.maxStock) }
              : i
          );
        }
        return [...prevCart, item];
      });
    }
  };

  const removeFromCart = async (id: string, cartId?: string) => {
    if (user && cartId) {
      try {
        await api.delete(`/cart/${cartId}`);
        await fetchCartFromAPI();
      } catch (err) {
        console.error('API Remove Cart Item Failed', err);
      }
    } else {
      setCart((prevCart) => prevCart.filter((item) => item.id !== id));
    }
  };

  const updateQuantity = async (id: string, quantity: number, cartId?: string) => {
    if (user && cartId) {
      try {
        await api.put(`/cart/${cartId}`, { quantity });
        await fetchCartFromAPI();
      } catch (err) {
        console.error('API Update Cart Failed', err);
      }
    } else {
      setCart((prevCart) =>
        prevCart.map((item) =>
          item.id === id ? { ...item, quantity } : item
        )
      );
    }
  };

  const clearCart = async () => {
    if (user) {
      try {
        await api.delete('/cart/clear');
        setCart([]);
      } catch (err) {
        console.error('API Clear Cart Failed', err);
      }
    } else {
      setCart([]);
    }
  };

  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isLoadingCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

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
  color?: string;
  quantity: number;
  maxStock: number;
  product?: any;
}

export const computeItemStock = (product: any, size?: string, color?: string): number => {
  if (!product) return 0;
  if (product.isActive === false) return 0;

  // 1. Size variant stock
  if (size && Array.isArray(product.sizes) && product.sizes.length > 0) {
    const sizeObj = product.sizes.find(
      (s: any) => String(s.size || '').trim().toLowerCase() === String(size).trim().toLowerCase()
    );
    return sizeObj ? Math.max(0, Number(sizeObj.stock || 0)) : 0;
  }

  // 2. Color variant stock (when no sizes configured, but colors configured)
  const hasSizes = Array.isArray(product.sizes) && product.sizes.length > 0;
  if (color && !hasSizes && Array.isArray(product.colors) && product.colors.length > 0) {
    const colorObj = product.colors.find((c: any) => {
      const cName = typeof c === 'object' && c !== null ? (c.color || c.name || '') : String(c || '');
      return String(cName).trim().toLowerCase() === String(color).trim().toLowerCase();
    });
    if (colorObj && typeof colorObj === 'object' && colorObj.stockQuantity !== undefined) {
      return Math.max(0, Number(colorObj.stockQuantity || 0));
    }
  }

  // 3. Total stock (Never use `|| 10`, because 0 means out of stock)
  return typeof product.stockQuantity === 'number'
    ? Math.max(0, product.stockQuantity)
    : Math.max(0, Number(product.stockQuantity || 0));
};

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => Promise<{ success: boolean; message?: string }>;
  removeFromCart: (id: string, cartId?: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number, cartId?: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
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
        const mappedCart: CartItem[] = res.data.data.cartItems.map((item: any) => {
          const product = item.product;
          const calculatedStock = computeItemStock(product, item.size, item.color);
          return {
            cartId: item.id,
            id: String(item.productId || product?.id),
            name: product?.productName || 'Unknown Product',
            price: parseFloat(product?.finalPrice || '0'),
            image: item.image || (product?.productImages && product.productImages[0]) || '',
            size: item.size || undefined,
            color: item.color || undefined,
            quantity: item.quantity,
            maxStock: calculatedStock,
            product,
          };
        });
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

  const addToCart = async (item: CartItem): Promise<{ success: boolean; message?: string }> => {
    if (user) {
      try {
        const res = await api.post('/cart/add', {
          productId: item.id,
          quantity: item.quantity,
          image: item.image,
          size: item.size,
          color: item.color,
        });
        await fetchCartFromAPI();
        return { success: true, message: res.data?.message || 'Added to cart' };
      } catch (err: any) {
        const errorMessage = err?.response?.data?.message || err?.message || 'Failed to add to cart';
        console.error('API Add to Cart Failed:', errorMessage, err?.response?.data || err);
        return { success: false, message: errorMessage };
      }
    } else {
      setCart((prevCart) => {
        const existingItem = prevCart.find(
          (i) => i.id === item.id && (i.color || '') === (item.color || '') && (i.size || '') === (item.size || '')
        );
        if (existingItem) {
          return prevCart.map((i) =>
            i.id === item.id && (i.color || '') === (item.color || '') && (i.size || '') === (item.size || '')
              ? { ...i, quantity: Math.min(i.quantity + item.quantity, i.maxStock) }
              : i
          );
        }
        return [...prevCart, item];
      });
      return { success: true, message: 'Added to cart' };
    }
  };

  const removeFromCart = async (id: string, cartId?: string) => {
    // Optimistically update local cart state immediately
    setCart((prevCart) => prevCart.filter((item) => {
      if (cartId && item.cartId === cartId) return false;
      if (!cartId && item.id === id) return false;
      return true;
    }));

    if (user) {
      const deleteIdentifier = cartId || id;
      if (deleteIdentifier) {
        try {
          await api.delete(`/cart/${deleteIdentifier}`);
          await fetchCartFromAPI();
        } catch (err: any) {
          console.error('API Remove Cart Item Failed:', err?.response?.data || err.message);
          await fetchCartFromAPI();
        }
      }
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
        refreshCart: fetchCartFromAPI,
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

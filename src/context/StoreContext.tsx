'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, FEATURED_PRODUCTS } from '@/data/mockData';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface StoreContextType {
  cart: CartItem[];
  wishlist: number[];
  quickViewProduct: Product | null;
  isCartOpen: boolean;
  isMobileNavOpen: boolean;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  toggleWishlist: (productId: number) => void;
  isInWishlist: (productId: number) => boolean;
  openQuickView: (product: Product) => void;
  closeQuickView: () => void;
  setIsCartOpen: (open: boolean) => void;
  setIsMobileNavOpen: (open: boolean) => void;
  totalCartPrice: number;
  totalCartItems: number;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([
    { product: FEATURED_PRODUCTS[0], quantity: 1 },
    { product: FEATURED_PRODUCTS[1], quantity: 2 },
  ]);
  const [wishlist, setWishlist] = useState<number[]>([1, 3]);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);

  const addToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const toggleWishlist = (productId: number) => {
    setWishlist((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
      );
  };

  const isInWishlist = (productId: number) => wishlist.includes(productId);

  const openQuickView = (product: Product) => setQuickViewProduct(product);
  const closeQuickView = () => setQuickViewProduct(null);

  const totalCartPrice = cart.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );

  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <StoreContext.Provider
      value={{
        cart,
        wishlist,
        quickViewProduct,
        isCartOpen,
        isMobileNavOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        toggleWishlist,
        isInWishlist,
        openQuickView,
        closeQuickView,
        setIsCartOpen,
        setIsMobileNavOpen,
        totalCartPrice,
        totalCartItems,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}

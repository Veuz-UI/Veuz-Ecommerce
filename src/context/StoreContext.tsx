'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, FEATURED_PRODUCTS } from '@/data/mockData';
import { triggerGlobalToast } from '@/context/ToastContext';

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

interface StoreContextType {
  cart: CartItem[];
  wishlist: number[];
  quickViewProduct: Product | null;
  isCartOpen: boolean;
  isMobileNavOpen: boolean;
  addToCart: (product: Product, quantity?: number, selectedColor?: string, selectedSize?: string) => void;
  removeFromCart: (productId: number, selectedColor?: string, selectedSize?: string) => void;
  updateQuantity: (productId: number, quantity: number, selectedColor?: string, selectedSize?: string) => void;
  updateCartItemVariant?: (index: number, newColor?: string, newSize?: string, newImage?: string) => void;
  clearCart: () => void;
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
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);

  // Load cart and wishlist from localStorage on client mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('veuz_cart');
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) setCart(parsed);
      }
      const savedWishlist = localStorage.getItem('veuz_wishlist');
      if (savedWishlist) {
        const parsed = JSON.parse(savedWishlist);
        if (Array.isArray(parsed)) setWishlist(parsed);
      }
    } catch (e) {
      // Ignore parse errors
    }
    setIsHydrated(true);
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem('veuz_cart', JSON.stringify(cart));
      } catch (e) {
        // Ignore write errors
      }
    }
  }, [cart, isHydrated]);

  // Save wishlist to localStorage
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem('veuz_wishlist', JSON.stringify(wishlist));
      } catch (e) {
        // Ignore write errors
      }
    }
  }, [wishlist, isHydrated]);

  const addToCart = (product: Product, quantity = 1, selectedColor?: string, selectedSize?: string) => {
    setCart((prev) => {
      const existing = prev.find(
        (item) =>
          item.product.id === product.id &&
          (selectedColor ? item.selectedColor === selectedColor : true) &&
          (selectedSize ? item.selectedSize === selectedSize : true)
      );
      if (existing) {
        return prev.map((item) =>
          item === existing ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { product, quantity, selectedColor, selectedSize }];
    });
    triggerGlobalToast('success', `"${product.name}" added to your cart.`, 'Added to Cart');
  };

  const removeFromCart = (productId: number, selectedColor?: string, selectedSize?: string) => {
    setCart((prev) =>
      prev.filter((item) => {
        if (item.product.id !== productId) return true;
        if (selectedColor && item.selectedColor !== selectedColor) return true;
        if (selectedSize && item.selectedSize !== selectedSize) return true;
        return false;
      })
    );
    triggerGlobalToast('danger', 'Item removed from your shopping cart.', 'Cart Updated');
  };

  const updateQuantity = (
    productId: number,
    quantity: number,
    selectedColor?: string,
    selectedSize?: string
  ) => {
    if (quantity <= 0) {
      removeFromCart(productId, selectedColor, selectedSize);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        const matches =
          item.product.id === productId &&
          (selectedColor ? item.selectedColor === selectedColor : true) &&
          (selectedSize ? item.selectedSize === selectedSize : true);
        return matches ? { ...item, quantity } : item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
    triggerGlobalToast('info', 'Your shopping cart has been cleared.', 'Cart Cleared');
  };

  const updateCartItemVariant = (
    index: number,
    newColor?: string,
    newSize?: string,
    newImage?: string
  ) => {
    setCart((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      return prev.map((item, idx) => {
        if (idx !== index) return item;
        let updatedProduct = item.product;
        const prodAny = item.product as any;
        const imageToUse =
          newImage ||
          (newColor && prodAny.colorImages && prodAny.colorImages[newColor] && prodAny.colorImages[newColor][0]);
        if (imageToUse) {
          updatedProduct = {
            ...item.product,
            image: imageToUse,
          };
        }
        return {
          ...item,
          product: updatedProduct,
          selectedColor: newColor !== undefined ? newColor : item.selectedColor,
          selectedSize: newSize !== undefined ? newSize : item.selectedSize,
        };
      });
    });
  };

  const toggleWishlist = (productId: number) => {
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      if (exists) {
        triggerGlobalToast('warning', 'Item removed from your wishlist.', 'Wishlist');
        return prev.filter((id) => id !== productId);
      } else {
        triggerGlobalToast('info', 'Item added to your wishlist!', 'Wishlist');
        return [...prev, productId];
      }
    });
  };

  const isInWishlist = (productId: number) => wishlist.includes(productId);

  const openQuickView = (product: Product) => setQuickViewProduct(product);
  const closeQuickView = () => setQuickViewProduct(null);

  const totalCartPrice = cart.reduce(
    (acc, item) => acc + (Number(item.product.price) || 0) * item.quantity,
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
        updateCartItemVariant,
        clearCart,
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
    return {
      cart: [],
      wishlist: [],
      quickViewProduct: null,
      isCartOpen: false,
      isMobileNavOpen: false,
      addToCart: () => {},
      removeFromCart: () => {},
      updateQuantity: () => {},
      updateCartItemVariant: () => {},
      clearCart: () => {},
      toggleWishlist: () => {},
      isInWishlist: () => false,
      openQuickView: () => {},
      closeQuickView: () => {},
      setIsCartOpen: () => {},
      setIsMobileNavOpen: () => {},
      totalCartPrice: 0,
      totalCartItems: 0,
    };
  }
  return context;
}

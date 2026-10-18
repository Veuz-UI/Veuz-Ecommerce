'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Product, FEATURED_PRODUCTS } from '@/data/mockData';
import { triggerGlobalToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';

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
  clearWishlist: () => void;
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

  // User-scoped storage keys
  let userId: number | string | null = null;
  try {
    const auth = useAuth();
    userId = auth?.user?.id ?? null;
  } catch (e) {
    // Fallback if rendered outside AuthProvider
  }

  const prevUserIdRef = useRef<number | string | null | undefined>(undefined);
  const isUserCartActionRef = useRef<boolean>(false);
  const isUserWishlistActionRef = useRef<boolean>(false);

  const getCartKey = (uid: number | string | null) => (uid ? `veuz_cart_user_${uid}` : 'veuz_cart_guest');
  const getWishlistKey = (uid: number | string | null) => (uid ? `veuz_wishlist_user_${uid}` : 'veuz_wishlist_guest');

  // Helper to fetch server cart for logged in user
  const fetchServerCart = async (uid: number | string) => {
    try {
      const res = await fetch(`/api/cart?userId=${uid}`);
      const data = await res.json();
      if (data?.success) {
        if (Array.isArray(data.cart)) {
          if (data.cart.length > 0) {
            setCart(data.cart);
            localStorage.setItem(getCartKey(uid), JSON.stringify(data.cart));
          } else {
            // Server cart is empty for this user. Check if local storage has existing items to push
            const localRaw = localStorage.getItem(getCartKey(uid));
            if (localRaw) {
              try {
                const parsed = JSON.parse(localRaw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  setCart(parsed);
                  fetch('/api/cart', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: uid, cart: parsed }),
                  }).catch(() => {});
                }
              } catch (e) {}
            }
          }
        }
        if (Array.isArray(data.wishlist)) {
          if (data.wishlist.length > 0) {
            setWishlist(data.wishlist);
            localStorage.setItem(getWishlistKey(uid), JSON.stringify(data.wishlist));
          } else {
            const localRaw = localStorage.getItem(getWishlistKey(uid));
            if (localRaw) {
              try {
                const parsed = JSON.parse(localRaw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  setWishlist(parsed);
                  fetch('/api/cart', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: uid, wishlist: parsed }),
                  }).catch(() => {});
                }
              } catch (e) {}
            }
          }
        }
      }
    } catch (e) {
      // Ignore network errors
    }
  };

  // Load cart and wishlist on client mount
  useEffect(() => {
    try {
      const activeCartKey = getCartKey(userId);
      const savedCart = localStorage.getItem(activeCartKey) || (!userId ? localStorage.getItem('veuz_cart') : null);
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) setCart(parsed);
      }

      const activeWishlistKey = getWishlistKey(userId);
      const savedWishlist = localStorage.getItem(activeWishlistKey) || (!userId ? localStorage.getItem('veuz_wishlist') : null);
      if (savedWishlist) {
        const parsed = JSON.parse(savedWishlist);
        if (Array.isArray(parsed)) setWishlist(parsed);
      }

      // Cleanup legacy global keys if migrated
      if (localStorage.getItem('veuz_cart')) {
        localStorage.removeItem('veuz_cart');
      }
      if (localStorage.getItem('veuz_wishlist')) {
        localStorage.removeItem('veuz_wishlist');
      }
    } catch (e) {
      // Ignore parse errors
    }

    if (userId) {
      fetchServerCart(userId);
    }

    prevUserIdRef.current = userId;
    setIsHydrated(true);
  }, []);

  // When user changes (login, logout, switch user)
  useEffect(() => {
    if (!isHydrated) return;
    if (prevUserIdRef.current === undefined) {
      prevUserIdRef.current = userId;
      if (userId) {
        fetchServerCart(userId);
      }
      return;
    }

    if (prevUserIdRef.current !== userId) {
      const prevUid = prevUserIdRef.current;
      prevUserIdRef.current = userId;

      if (userId === null) {
        // User logged out! Clean in-memory state
        setCart([]);
        setWishlist([]);
        localStorage.removeItem('veuz_cart_guest');
        localStorage.removeItem('veuz_wishlist_guest');
      } else {
        // Logged in or switched user
        fetchServerCart(userId);
      }
    }
  }, [userId, isHydrated]);

  // Save cart to user-scoped localStorage and sync to server only on user action
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(getCartKey(userId), JSON.stringify(cart));
      } catch (e) {
        // Ignore write errors
      }

      if (userId && isUserCartActionRef.current) {
        isUserCartActionRef.current = false;
        fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, cart }),
        }).catch(() => {});
      }
    }
  }, [cart, userId, isHydrated]);

  // Save wishlist to user-scoped localStorage and sync to server only on user action
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(getWishlistKey(userId), JSON.stringify(wishlist));
      } catch (e) {
        // Ignore write errors
      }

      if (userId && isUserWishlistActionRef.current) {
        isUserWishlistActionRef.current = false;
        fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, wishlist }),
        }).catch(() => {});
      }
    }
  }, [wishlist, userId, isHydrated]);

  const addToCart = (product: Product, quantity = 1, selectedColor?: string, selectedSize?: string) => {
    isUserCartActionRef.current = true;
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
    isUserCartActionRef.current = true;
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
    isUserCartActionRef.current = true;
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
    isUserCartActionRef.current = true;
    setCart([]);
    triggerGlobalToast('info', 'Your shopping cart has been cleared.', 'Cart Cleared');
  };

  const updateCartItemVariant = (
    index: number,
    newColor?: string,
    newSize?: string,
    newImage?: string
  ) => {
    isUserCartActionRef.current = true;
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
    if (!userId) {
      triggerGlobalToast('warning', 'Please sign in to save items to your wishlist.', 'Login Required');
      if (typeof window !== 'undefined') {
        window.location.href = '/login?redirect=/wishlist';
      }
      return;
    }
    isUserWishlistActionRef.current = true;
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

  const clearWishlist = () => {
    isUserWishlistActionRef.current = true;
    setWishlist([]);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(getWishlistKey(userId));
      } catch (e) {}
    }
    if (userId) {
      fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, wishlist: [] }),
      }).catch(() => {});
    }
    triggerGlobalToast('warning', 'Your wishlist has been cleared.', 'Wishlist Cleared');
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
        clearWishlist,
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
      wishlist: [] as number[],
      quickViewProduct: null,
      isCartOpen: false,
      isMobileNavOpen: false,
      addToCart: () => {},
      removeFromCart: () => {},
      updateQuantity: () => {},
      updateCartItemVariant: () => {},
      clearCart: () => {},
      clearWishlist: () => {},
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

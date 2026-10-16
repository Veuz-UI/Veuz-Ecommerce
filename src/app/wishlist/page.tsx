'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { useToast } from '@/context/ToastContext';
import { fetchProducts } from '@/services/productsService';
import { ProductItem } from '@/data/categoryProductsData';

export default function WishlistPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { wishlist, toggleWishlist, addToCart } = useStore();
  const { showToast } = useToast();

  const [allProducts, setAllProducts] = useState<ProductItem[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // Auth protection: Unauthenticated users are redirected to login
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?redirect=/wishlist');
    }
  }, [user, authLoading, router]);

  // Load catalog products to match wishlisted IDs
  useEffect(() => {
    let isMounted = true;
    fetchProducts()
      .then((prods) => {
        if (isMounted && Array.isArray(prods)) {
          setAllProducts(prods);
        }
      })
      .catch((err) => console.warn('Could not load products for wishlist:', err))
      .finally(() => {
        if (isMounted) setProductsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter products matching current wishlist IDs
  const wishlistedProducts = useMemo(() => {
    if (!wishlist || wishlist.length === 0 || allProducts.length === 0) return [];
    return allProducts.filter((p) => {
      const numId = Number(String(p.id).replace(/[^\d]/g, '')) || 0;
      return wishlist.includes(numId);
    });
  }, [wishlist, allProducts]);

  // Handle adding an item to cart from wishlist
  const handleAddToCart = (product: ProductItem) => {
    const rawPrice = product.currentPrice || product.price;
    const numPrice = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice || '129').replace(/[^\d.]/g, '')) || 129;
    const idNum = Number(String(product.id).replace(/[^\d]/g, '')) || Math.floor(Math.random() * 100000) + 1;

    const cartProduct: any = {
      id: idNum,
      name: product.title,
      price: numPrice > 0 ? numPrice : 129,
      image: product.image || (product.images && product.images[0]) || '/assets/imgs/theme/placeholder.svg',
      category: product.category || 'Safety Equipment',
    };

    const chosenColor = Array.isArray(product.colors) && product.colors.length > 0 ? product.colors[0] : undefined;
    const chosenSize = Array.isArray(product.sizes) && product.sizes.length > 0 ? product.sizes[0] : undefined;

    addToCart(cartProduct, 1, chosenColor, chosenSize);
  };

  // Handle adding all items to cart
  const handleAddAllToCart = () => {
    if (wishlistedProducts.length === 0) return;
    wishlistedProducts.forEach((p) => handleAddToCart(p));
    showToast('success', `Added ${wishlistedProducts.length} items to your shopping cart.`);
  };

  if (authLoading || (productsLoading && !user)) {
    return (
      <main className="main py-5" style={{ backgroundColor: '#f8fafc', minHeight: '80vh' }}>
        <div className="container text-center py-5">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading wishlist...</span>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <main className="main py-4 py-md-5" style={{ backgroundColor: '#f8fafc', minHeight: '85vh' }}>
      <div className="container">
        {/* Full-width Unified White Card Container */}
        <div
          className="bg-white rounded-4 border p-3 p-sm-4 p-md-5 w-100 shadow-sm"
          style={{
            borderColor: '#edf0f3',
            boxShadow: '0 4px 25px rgba(15, 23, 42, 0.04)',
          }}
        >
          {/* 1. Inline Breadcrumb */}
          <div className="d-flex align-items-center gap-2 mb-3 fs-13 text-muted">
            <Link href="/" className="text-muted text-decoration-none hover-primary">
              Home
            </Link>
            <span className="text-muted">/</span>
            <span className="text-dark fw-medium">My Wishlist</span>
          </div>

          {/* 2. Page Header */}
          <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom flex-wrap gap-3" style={{ borderColor: '#f1f5f9' }}>
            <div className="d-flex align-items-center gap-2">
              <h1
                className="fw-bold mb-0 text-dark d-flex align-items-center gap-2"
                style={{ fontSize: '24px', letterSpacing: '-0.5px' }}
              >
                My Wishlist
              </h1>
              <span
                className="d-inline-flex align-items-center justify-content-center text-white fw-bold rounded-circle shadow-sm"
                style={{
                  width: '26px',
                  height: '26px',
                  fontSize: '12px',
                  backgroundColor: '#0f172a',
                }}
              >
                {wishlistedProducts.length}
              </span>
            </div>

            {wishlistedProducts.length > 0 && (
              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddAllToCart}
                  className="btn btn-sm fw-bold px-3 py-2 text-white d-inline-flex align-items-center gap-2"
                  style={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    fontSize: '13px',
                    height: '38px',
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                  </svg>
                  <span>Add All to Cart</span>
                </button>
              </div>
            )}
          </div>

          {/* 3. Wishlist Content */}
          {wishlistedProducts.length === 0 ? (
            /* Empty State */
            <div className="text-center py-5 my-3">
              <div
                className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{
                  width: '74px',
                  height: '74px',
                  backgroundColor: '#fee2e2',
                  color: '#ef4444',
                }}
              >
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
              <h3 className="fw-bold text-dark mb-2" style={{ fontSize: '20px' }}>
                Your Wishlist is Empty
              </h3>
              <p className="text-muted mx-auto mb-4" style={{ maxWidth: '440px', fontSize: '14px', lineHeight: '1.6' }}>
                You haven&apos;t saved any safety items yet. Browse our verified industrial catalog and click the heart icon to save items here.
              </p>
              <Link
                href="/products"
                className="btn fw-bold px-4 text-white d-inline-flex align-items-center gap-2"
                style={{
                  height: '46px',
                  backgroundColor: '#0f172a',
                  borderRadius: '10px',
                  fontSize: '14px',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                <span>Explore Products</span>
              </Link>
            </div>
          ) : (
            /* Wishlist Items List */
            <div className="table-responsive">
              <table className="table align-middle mb-0" style={{ minWidth: '600px' }}>
                <thead>
                  <tr className="border-bottom" style={{ borderColor: '#f1f5f9', color: '#64748b', fontSize: '13px' }}>
                    <th scope="col" className="pb-3 fw-semibold" style={{ width: '45%' }}>Product</th>
                    <th scope="col" className="pb-3 fw-semibold text-center" style={{ width: '18%' }}>Price</th>
                    <th scope="col" className="pb-3 fw-semibold text-center" style={{ width: '15%' }}>Stock Status</th>
                    <th scope="col" className="pb-3 fw-semibold text-end" style={{ width: '22%' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {wishlistedProducts.map((prod) => {
                    const rawPrice = prod.currentPrice || prod.price;
                    const numPrice = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice || '129').replace(/[^\d.]/g, '')) || 129;
                    const numId = Number(String(prod.id).replace(/[^\d]/g, '')) || 1;

                    return (
                      <tr key={prod.id} className="border-bottom" style={{ borderColor: '#f8fafc' }}>
                        {/* Product Image + Title */}
                        <td className="py-3.5">
                          <div className="d-flex align-items-center gap-3">
                            <Link
                              href={`/product-details?id=${prod.id}`}
                              className="rounded-3 d-flex align-items-center justify-content-center p-1 flex-shrink-0 border bg-light"
                              style={{ width: '70px', height: '70px', borderColor: '#f1f5f9' }}
                            >
                              <img
                                src={prod.image || (prod.images && prod.images[0]) || '/assets/imgs/theme/placeholder.svg'}
                                alt={prod.title}
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  target.onerror = null;
                                  target.src = '/assets/imgs/theme/placeholder.svg';
                                }}
                              />
                            </Link>
                            <div>
                              <span className="text-muted fs-11 text-uppercase fw-semibold d-block mb-1">
                                {prod.category || 'Safety Equipment'}
                              </span>
                              <Link
                                href={`/product-details?id=${prod.id}`}
                                className="fw-bold text-dark text-decoration-none hover-primary fs-14 d-block"
                                style={{ lineHeight: '1.4', maxWidth: '320px' }}
                              >
                                {prod.title}
                              </Link>
                            </div>
                          </div>
                        </td>

                        {/* Price */}
                        <td className="py-3.5 text-center">
                          <span className="fw-bold text-dark fs-15">
                            {numPrice.toFixed(2)} <span className="fs-12 text-muted">SAR</span>
                          </span>
                        </td>

                        {/* Stock Status */}
                        <td className="py-3.5 text-center">
                          <span
                            className="badge rounded-pill fw-semibold px-2.5 py-1.5"
                            style={{ backgroundColor: '#ecfdf5', color: '#059669', fontSize: '11.5px' }}
                          >
                            In Stock
                          </span>
                        </td>

                        {/* Actions: Add to Cart + Remove */}
                        <td className="py-3.5 text-end">
                          <div className="d-inline-flex align-items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleAddToCart(prod)}
                              className="btn btn-sm fw-semibold text-white d-inline-flex align-items-center gap-1.5 px-3"
                              style={{
                                height: '36px',
                                backgroundColor: '#0f172a',
                                borderRadius: '8px',
                                fontSize: '12.5px',
                              }}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="9" cy="21" r="1"></circle>
                                <circle cx="20" cy="21" r="1"></circle>
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                              </svg>
                              <span>Add to Cart</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleWishlist(numId)}
                              className="btn btn-sm btn-outline-danger p-0 d-inline-flex align-items-center justify-content-center"
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '8px',
                                borderColor: '#fee2e2',
                                color: '#ef4444',
                                backgroundColor: '#fef2f2',
                              }}
                              title="Remove from wishlist"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

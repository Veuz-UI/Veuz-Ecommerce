'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, Star, Heart, ShoppingBag, ShieldCheck, Truck, RefreshCw, Gift } from 'lucide-react';
import { useStore } from '@/context/StoreContext';

export const QuickViewModal: React.FC = () => {
  const { quickViewProduct, closeQuickView, addToCart, toggleWishlist, isInWishlist } = useStore();
  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!quickViewProduct) return null;

  const currentImage = selectedImage || quickViewProduct.image;
  const isWish = isInWishlist(quickViewProduct.id);

  const imagesList = [
    quickViewProduct.image,
    quickViewProduct.hoverImage || quickViewProduct.image,
    '/assets/imgs/shop/p1.jpg',
    '/assets/imgs/shop/gift-big.jpg'
  ].filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeQuickView}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Gallery / Image Area */}
        <div className="md:w-1/2 bg-slate-50 p-6 flex flex-col items-center justify-between border-b md:border-b-0 md:border-r border-slate-100">
          <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-white shadow-sm border border-slate-200/60 mb-4">
            <Image
              src={currentImage}
              alt={quickViewProduct.name}
              fill
              className="object-cover object-center"
            />
          </div>

          {/* Thumbnails */}
          <div className="flex gap-2 w-full justify-center">
            {imagesList.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(img)}
                className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                  currentImage === img
                    ? 'border-emerald-600 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 opacity-70 hover:opacity-100'
                }`}
              >
                <Image src={img} alt="thumb" fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Product Details Area */}
        <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
          <div>
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-full">
              {quickViewProduct.category}
            </span>

            <h2 className="text-xl md:text-2xl font-bold text-slate-900 mt-2 mb-2 leading-tight">
              {quickViewProduct.name}
            </h2>

            {/* Rating & Reviews */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(quickViewProduct.rating)
                        ? 'fill-current text-amber-400'
                        : 'text-slate-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-slate-800">
                {quickViewProduct.rating}
              </span>
              <span className="text-xs text-slate-400">
                ({quickViewProduct.reviewsCount} customer reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-1">
              <span className="text-2xl md:text-3xl font-extrabold text-emerald-600">
                {quickViewProduct.price} SR
              </span>
              {quickViewProduct.oldPrice && (
                <span className="text-base text-slate-400 line-through">
                  {quickViewProduct.oldPrice} SR
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mb-4">Inclusive of VAT & custom print warranty</p>

            {/* Description */}
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              {quickViewProduct.description ||
                'Crafted with premium materials and high precision finishing, tailored for long-lasting everyday style.'}
            </p>

            {/* Gift banner */}
            {quickViewProduct.giftText && (
              <div className="flex items-center gap-2 p-3 bg-amber-50/80 border border-amber-200/60 rounded-xl text-amber-900 text-xs font-medium mb-6">
                <Gift className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Special Promotion: <strong>{quickViewProduct.giftText}</strong></span>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              {/* Quantity Selector */}
              <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100"
                >
                  -
                </button>
                <span className="w-10 text-center font-semibold text-slate-800 text-sm">
                  {qty}
                </span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100"
                >
                  +
                </button>
              </div>

              {/* Add to Cart */}
              <button
                onClick={() => {
                  addToCart(quickViewProduct, qty);
                  closeQuickView();
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-md shadow-emerald-600/20 active:scale-[0.98]"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart ({quickViewProduct.price * qty} SR)</span>
              </button>

              {/* Wishlist Toggle */}
              <button
                onClick={() => toggleWishlist(quickViewProduct.id)}
                className={`p-3 rounded-xl border transition-colors ${
                  isWish
                    ? 'bg-rose-50 border-rose-200 text-rose-600'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Heart className={`w-5 h-5 ${isWish ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Feature Badges */}
            <div className="grid grid-cols-3 gap-2 text-center pt-4 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
              <div className="flex flex-col items-center gap-1">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span>Fast Delivery</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Authentic Guarantee</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <RefreshCw className="w-4 h-4 text-emerald-600" />
                <span>Easy Returns</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

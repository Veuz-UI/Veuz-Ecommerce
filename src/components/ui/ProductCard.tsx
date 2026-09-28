'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Eye, ShoppingBag, Star, Gift } from 'lucide-react';
import { Product } from '@/data/mockData';
import { useStore } from '@/context/StoreContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, toggleWishlist, isInWishlist, openQuickView } = useStore();
  const isWish = isInWishlist(product.id);

  const getBadgeClass = (type?: string) => {
    switch (type) {
      case 'hot':
        return 'bg-rose-500 text-white';
      case 'sale':
        return 'bg-emerald-600 text-white';
      case 'discount':
        return 'bg-amber-500 text-white';
      case 'new':
        return 'bg-sky-600 text-white';
      default:
        return 'bg-emerald-600 text-white';
    }
  };

  return (
    <div className="group relative bg-white border border-slate-200/80 rounded-2xl p-4 transition-all duration-300 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/5 flex flex-col justify-between">
      {/* Badge */}
      {product.badge && (
        <span
          className={`absolute top-4 left-4 z-10 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm ${getBadgeClass(
            product.badge.type
          )}`}
        >
          {product.badge.text}
        </span>
      )}

      {/* Floating Action Buttons */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 opacity-0 translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
        <button
          onClick={() => toggleWishlist(product.id)}
          className={`p-2 rounded-full backdrop-blur-md shadow-md transition-colors ${
            isWish
              ? 'bg-rose-500 text-white hover:bg-rose-600'
              : 'bg-white/90 text-slate-700 hover:bg-emerald-500 hover:text-white'
          }`}
          title={isWish ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart className={`w-4 h-4 ${isWish ? 'fill-current' : ''}`} />
        </button>
        <button
          onClick={() => openQuickView(product)}
          className="p-2 rounded-full bg-white/90 backdrop-blur-md text-slate-700 shadow-md hover:bg-emerald-500 hover:text-white transition-colors"
          title="Quick View"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      {/* Image Container with Hover Flip */}
      <div className="relative w-full aspect-square overflow-hidden rounded-xl bg-slate-50 flex items-center justify-center mb-4 cursor-pointer" onClick={() => openQuickView(product)}>
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          className={`object-cover object-center transition-transform duration-500 group-hover:scale-105 ${
            product.hoverImage ? 'group-hover:opacity-0' : ''
          }`}
        />
        {product.hoverImage && (
          <Image
            src={product.hoverImage}
            alt={`${product.name} hover`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            className="object-cover object-center absolute inset-0 opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:scale-105"
          />
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <span className="text-xs font-medium text-slate-400 hover:text-emerald-600 transition-colors uppercase tracking-wider block mb-1">
            {product.category}
          </span>
          <h3 className="font-semibold text-slate-800 text-sm md:text-base line-clamp-2 hover:text-emerald-600 transition-colors mb-2 leading-snug">
            <Link href="#">{product.name}</Link>
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mb-2.5">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < Math.floor(product.rating)
                      ? 'fill-current text-amber-400'
                      : 'text-slate-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-bold text-slate-700">{product.rating}</span>
            <span className="text-xs text-slate-400">({product.reviewsCount})</span>
          </div>
        </div>

        {/* Pricing & VAT */}
        <div className="mt-2 pt-2 border-t border-slate-100">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-lg font-bold text-emerald-600">
              {product.price} SR
            </span>
            {product.oldPrice && (
              <span className="text-xs text-slate-400 line-through">
                {product.oldPrice} SR
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mb-3">Inclusive of VAT</p>

          {/* Promotional Gift Tag */}
          {product.giftText && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium mb-3">
              <Gift className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">{product.giftText}</span>
            </div>
          )}

          {/* Add to Cart Button */}
          <button
            onClick={() => addToCart(product)}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-3 rounded-xl transition-all duration-200 shadow-sm hover:shadow-emerald-600/20 active:scale-[0.98]"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="text-sm">Add to Cart</span>
          </button>
        </div>
      </div>
    </div>
  );
};

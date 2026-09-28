'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Flame, Star, ShoppingBag, Eye, Heart, Timer } from 'lucide-react';
import { FEATURED_PRODUCTS } from '@/data/mockData';
import { useStore } from '@/context/StoreContext';

export const DealOfTheDay: React.FC = () => {
  const { addToCart, openQuickView, toggleWishlist, isInWishlist } = useStore();

  // Deal countdown timer state
  const [timeLeft, setTimeLeft] = useState({
    days: 3,
    hours: 14,
    minutes: 42,
    seconds: 19,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const dealProducts = FEATURED_PRODUCTS.slice(0, 4);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      {/* Section Header with Live Clock Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-rose-500 font-semibold text-xs tracking-wider uppercase mb-1">
            <Flame className="w-4 h-4 animate-pulse" />
            <span>Limited Time Super Deal</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Deals of the Day
          </h2>
        </div>

        {/* Global Live Countdown Pill */}
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 px-4 py-2 rounded-2xl text-rose-900 shadow-xs">
          <Timer className="w-4 h-4 text-rose-600 animate-spin" style={{ animationDuration: '6s' }} />
          <span className="text-xs font-semibold">Ends In:</span>
          <div className="flex items-center gap-1 font-mono font-bold text-xs">
            <span className="bg-white px-2 py-0.5 rounded-md shadow-xs border border-rose-100">{String(timeLeft.days).padStart(2, '0')}d</span>
            <span>:</span>
            <span className="bg-white px-2 py-0.5 rounded-md shadow-xs border border-rose-100">{String(timeLeft.hours).padStart(2, '0')}h</span>
            <span>:</span>
            <span className="bg-white px-2 py-0.5 rounded-md shadow-xs border border-rose-100">{String(timeLeft.minutes).padStart(2, '0')}m</span>
            <span>:</span>
            <span className="bg-rose-600 text-white px-2 py-0.5 rounded-md shadow-xs">{String(timeLeft.seconds).padStart(2, '0')}s</span>
          </div>
        </div>
      </div>

      {/* Deals Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {dealProducts.map((product) => {
          const isWish = isInWishlist(product.id);
          const percentSold = product.soldCount && product.totalCount 
            ? Math.round((product.soldCount / product.totalCount) * 100) 
            : 75;

          return (
            <div
              key={product.id}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-emerald-500/30 transition-all duration-300 flex flex-col justify-between group"
            >
              {/* Product Image and Discount Badge */}
              <div className="relative aspect-4/3 overflow-hidden bg-slate-50 cursor-pointer" onClick={() => openQuickView(product)}>
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Floating Discount Badge */}
                <div className="absolute top-3 left-3 z-10 bg-rose-600 text-white font-black text-xs px-2.5 py-1 rounded-xl shadow-md uppercase tracking-wider">
                  Save 25%
                </div>

                {/* Floating Quick Action Buttons */}
                <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 opacity-0 translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
                    className={`p-2 rounded-full shadow-md backdrop-blur-md transition-colors ${
                      isWish ? 'bg-rose-500 text-white' : 'bg-white/90 text-slate-700 hover:bg-emerald-500 hover:text-white'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isWish ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); openQuickView(product); }}
                    className="p-2 rounded-full bg-white/90 text-slate-700 shadow-md backdrop-blur-md hover:bg-emerald-500 hover:text-white transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Mini Deal Countdown Overlay on Image */}
                <div className="absolute bottom-2 left-2 right-2 bg-slate-900/80 backdrop-blur-md text-white rounded-xl p-2 flex justify-around text-center text-[10px] font-mono">
                  <div>
                    <span className="font-bold text-emerald-400 block text-xs">{timeLeft.days}</span>
                    <span className="text-slate-400 text-[9px]">Days</span>
                  </div>
                  <span className="text-slate-600 self-center">:</span>
                  <div>
                    <span className="font-bold text-emerald-400 block text-xs">{timeLeft.hours}</span>
                    <span className="text-slate-400 text-[9px]">Hours</span>
                  </div>
                  <span className="text-slate-600 self-center">:</span>
                  <div>
                    <span className="font-bold text-emerald-400 block text-xs">{timeLeft.minutes}</span>
                    <span className="text-slate-400 text-[9px]">Mins</span>
                  </div>
                  <span className="text-slate-600 self-center">:</span>
                  <div>
                    <span className="font-bold text-rose-400 block text-xs">{timeLeft.seconds}</span>
                    <span className="text-slate-400 text-[9px]">Sec</span>
                  </div>
                </div>
              </div>

              {/* Product Info & Stock Progress */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    {product.category}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base line-clamp-2 hover:text-emerald-600 transition-colors mb-2">
                    <Link href="#">{product.name}</Link>
                  </h3>

                  {/* Rating */}
                  <div className="flex items-center gap-1.5 mb-3">
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-slate-700">{product.rating}</span>
                  </div>

                  {/* Pricing */}
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-xl font-extrabold text-emerald-600">{product.price} SR</span>
                    {product.oldPrice && (
                      <span className="text-xs text-slate-400 line-through">{product.oldPrice} SR</span>
                    )}
                  </div>

                  {/* Stock sold progress bar */}
                  <div className="space-y-1 mb-4">
                    <div className="flex justify-between text-[11px] font-semibold">
                      <span className="text-slate-500">Already Sold: <strong className="text-slate-800">{product.soldCount || 84}</strong></span>
                      <span className="text-slate-500">Available: <strong className="text-emerald-600">{product.totalCount || 100}</strong></span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${percentSold}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Add to Cart */}
                <button
                  onClick={() => addToCart(product)}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-md shadow-emerald-600/20 active:scale-[0.98]"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span className="text-sm">Claim Deal</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </section>
  );
};

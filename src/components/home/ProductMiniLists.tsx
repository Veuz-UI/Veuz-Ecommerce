'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, TrendingUp, Sparkles, Award, Clock } from 'lucide-react';
import { FEATURED_PRODUCTS, Product } from '@/data/mockData';
import { useStore } from '@/context/StoreContext';

export const ProductMiniLists: React.FC = () => {
  const { openQuickView } = useStore();

  const renderMiniColumn = (title: string, icon: React.ReactNode, products: Product[]) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
        <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
          {icon}
        </div>
        <h3 className="font-bold text-base text-slate-900">{title}</h3>
      </div>

      <div className="space-y-3">
        {products.map((product) => (
          <div
            key={product.id}
            onClick={() => openQuickView(product)}
            className="flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer group"
          >
            <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/60">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold text-slate-800 line-clamp-2 group-hover:text-emerald-600 transition-colors leading-snug mb-1">
                {product.name}
              </h4>
              <div className="flex items-center gap-1 mb-1">
                <Star className="w-3 h-3 text-amber-400 fill-current" />
                <span className="text-[11px] font-bold text-slate-700">{product.rating}</span>
                <span className="text-[10px] text-slate-400">({product.reviewsCount})</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-bold text-emerald-600">{product.price} SR</span>
                {product.oldPrice && (
                  <span className="text-[11px] text-slate-400 line-through">{product.oldPrice} SR</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {renderMiniColumn('Top Selling', <TrendingUp className="w-4 h-4" />, FEATURED_PRODUCTS.slice(0, 3))}
        {renderMiniColumn('Trending Products', <Sparkles className="w-4 h-4" />, FEATURED_PRODUCTS.slice(2, 5))}
        {renderMiniColumn('Recently Added', <Clock className="w-4 h-4" />, FEATURED_PRODUCTS.slice(4, 7))}
        {renderMiniColumn('Top Rated', <Award className="w-4 h-4" />, FEATURED_PRODUCTS.slice(1, 4))}
      </div>
    </section>
  );
};

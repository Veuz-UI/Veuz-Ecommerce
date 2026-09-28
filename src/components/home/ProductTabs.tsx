'use client';

import React, { useState } from 'react';
import { ProductCard } from '@/components/ui/ProductCard';
import { FEATURED_PRODUCTS } from '@/data/mockData';
import { Sparkles } from 'lucide-react';

const TABS = ['All', 'Tshirts', 'Bag Print', 'Gift Pack', 'Paper Cup', 'Cards & Stationery'];

export const ProductTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState('All');

  const filteredProducts = activeTab === 'All'
    ? FEATURED_PRODUCTS
    : FEATURED_PRODUCTS.filter((p) => p.category.toLowerCase() === activeTab.toLowerCase());

  return (
    <section id="products-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      {/* Section Header with Category Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-semibold text-xs tracking-wider uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Popular & Trending</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Popular Products
          </h2>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

    </section>
  );
};

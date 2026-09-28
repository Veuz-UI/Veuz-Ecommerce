'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CATEGORIES } from '@/data/mockData';
import { ArrowRight, Sparkles } from 'lucide-react';

export const CategorySection: React.FC = () => {
  return (
    <section id="categories-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-semibold text-xs tracking-wider uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curated Collections</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Featured Categories
          </h2>
        </div>

        <Link
          href="#products-section"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors group"
        >
          <span>View All Categories</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
        {CATEGORIES.map((category) => (
          <Link
            key={category.id}
            href="#products-section"
            className={`group p-3 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col items-center text-center ${category.bgColor}`}
          >
            {/* Category Image Circle */}
            <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden bg-white shadow-xs border border-white/60 mb-3 group-hover:scale-110 transition-transform duration-300">
              <Image
                src={category.image}
                alt={category.name}
                fill
                className="object-cover"
              />
            </div>

            {/* Title & Count */}
            <h3 className="font-bold text-xs sm:text-sm text-slate-800 line-clamp-2 leading-tight mb-1 group-hover:text-emerald-700 transition-colors">
              {category.name}
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">
              {category.itemCount} items
            </span>
          </Link>
        ))}
      </div>

    </section>
  );
};

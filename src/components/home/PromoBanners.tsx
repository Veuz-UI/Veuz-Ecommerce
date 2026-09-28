'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PROMO_BANNERS } from '@/data/mockData';
import { ArrowRight } from 'lucide-react';

export const PromoBanners: React.FC = () => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PROMO_BANNERS.map((banner) => (
          <div
            key={banner.id}
            className={`relative rounded-3xl overflow-hidden p-6 sm:p-7 bg-gradient-to-br ${banner.bgGradient} text-white shadow-xl flex flex-col justify-between min-h-[260px] group transition-transform hover:-translate-y-1 duration-300`}
          >
            {/* Background image overlay with soft blend */}
            <div className="absolute right-0 bottom-0 w-36 h-36 sm:w-44 sm:h-44 opacity-25 group-hover:opacity-40 transition-opacity duration-500 rounded-tl-full overflow-hidden">
              <Image
                src={banner.image}
                alt={banner.title}
                fill
                className="object-cover"
              />
            </div>

            {/* Top Badge & Subtitle */}
            <div className="z-10">
              <span className="inline-block text-[11px] font-extrabold uppercase tracking-widest bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white mb-3">
                {banner.discount}
              </span>
              <h3 className="text-xl sm:text-2xl font-black leading-tight max-w-[220px]">
                {banner.title}
              </h3>
              <p className="text-xs text-white/80 mt-2 max-w-[200px]">
                {banner.subtitle}
              </p>
            </div>

            {/* CTA Button */}
            <div className="z-10 mt-6">
              <Link
                href="#products-section"
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 ${banner.buttonColor}`}
              >
                <span>Shop Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

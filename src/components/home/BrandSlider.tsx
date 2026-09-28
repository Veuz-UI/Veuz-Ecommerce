'use client';

import React from 'react';
import Image from 'next/image';
import { CLIENT_LOGOS } from '@/data/mockData';

export const BrandSlider: React.FC = () => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-slate-200">
      <div className="text-center mb-6">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Trusted By Leading Brands & Corporates
        </span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-6 items-center justify-items-center opacity-70 grayscale hover:grayscale-0 transition-all duration-300">
        {CLIENT_LOGOS.map((client, idx) => (
          <div
            key={idx}
            className="relative w-28 h-12 flex items-center justify-center p-2 hover:scale-110 transition-transform duration-300"
          >
            <Image
              src={client.logo}
              alt={client.name}
              fill
              className="object-contain"
            />
          </div>
        ))}
      </div>
    </section>
  );
};

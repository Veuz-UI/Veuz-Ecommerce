'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, ChevronDown, ChevronRight, Phone, Mail, MapPin, Search } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { CATEGORIES } from '@/data/mockData';

export const MobileNav: React.FC = () => {
  const { isMobileNavOpen, setIsMobileNavOpen } = useStore();
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  if (!isMobileNavOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={() => setIsMobileNavOpen(false)}
      />

      <div className="fixed inset-y-0 left-0 max-w-full flex pr-10">
        <div className="w-screen max-w-xs sm:max-w-sm bg-white shadow-2xl flex flex-col justify-between overflow-y-auto animate-slideRight">
          
          {/* Top Bar */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="relative w-28 h-9">
              <Image
                src="/assets/imgs/theme/logo.jpg"
                alt="Veuz Logo"
                fill
                className="object-contain object-left"
              />
            </div>
            <button
              onClick={() => setIsMobileNavOpen(false)}
              className="p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Box */}
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products, brands..."
                className="w-full bg-slate-100/80 border border-slate-200 text-slate-800 text-sm rounded-xl py-2.5 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            </div>
          </div>

          {/* Nav Links */}
          <div className="flex-1 p-4 space-y-1">
            <Link
              href="/"
              onClick={() => setIsMobileNavOpen(false)}
              className="flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-emerald-600 bg-emerald-50 rounded-xl"
            >
              <span>Home</span>
              <ChevronRight className="w-4 h-4" />
            </Link>

            {/* Category Accordion */}
            <div>
              <button
                onClick={() => setCategoriesOpen(!categoriesOpen)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
              >
                <span>All Categories</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${categoriesOpen ? 'rotate-180' : ''}`} />
              </button>

              {categoriesOpen && (
                <div className="pl-4 pr-2 py-2 space-y-1 bg-slate-50/60 rounded-xl mt-1">
                  {CATEGORIES.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/category?category=${encodeURIComponent(cat.name)}`}
                      onClick={() => setIsMobileNavOpen(false)}
                      className="flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-600 hover:text-emerald-600 hover:bg-white rounded-lg transition-colors"
                    >
                      <span>{cat.name}</span>
                      <span className="text-[10px] bg-slate-200/60 px-1.5 py-0.5 rounded-full text-slate-500">
                        {cat.itemCount}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/offer-products"
              onClick={() => setIsMobileNavOpen(false)}
              className="flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <span>Special Offers & Deals</span>
              <span className="text-[10px] font-bold bg-rose-500 text-white px-2 py-0.5 rounded-full">HOT</span>
            </Link>

            <Link
              href="#"
              onClick={() => setIsMobileNavOpen(false)}
              className="flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <span>Vouchers & Rewards</span>
            </Link>

            <Link
              href="#"
              onClick={() => setIsMobileNavOpen(false)}
              className="flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <span>Track My Order</span>
            </Link>

            <Link
              href="#"
              onClick={() => setIsMobileNavOpen(false)}
              className="flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <span>My Account / Sign In</span>
            </Link>
          </div>

          {/* Contact Details in Drawer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/60 text-xs text-slate-500 space-y-2">
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>(+91) - 9876-124553</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-emerald-600" />
              <span>sales@veuz.com</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Riyadh, Saudi Arabia</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

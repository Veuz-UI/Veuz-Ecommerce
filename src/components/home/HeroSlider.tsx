'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles, ShoppingBag } from 'lucide-react';

const SLIDES = [
  {
    id: 1,
    badge: 'Exclusive Offer 2026',
    title: 'Don’t Miss Amazing Deals on Custom Apparel',
    subtitle: 'Save up to 50% on your first order with instant custom printing & doorstep delivery',
    buttonText: 'Shop Collection',
    image: '/assets/imgs/shop/tshrt.jpg',
    bgGradient: 'from-emerald-900 via-teal-900 to-slate-900',
    accentColor: 'text-emerald-400',
  },
  {
    id: 2,
    badge: 'Luxury Corporate Gifting',
    title: 'Bespoke Gift Boxes & Executive Hampers',
    subtitle: 'Tailored with personalized branding, premium finishes and express dispatch',
    buttonText: 'Explore Gift Packs',
    image: '/assets/imgs/shop/gift-big.jpg',
    bgGradient: 'from-amber-950 via-stone-900 to-slate-900',
    accentColor: 'text-amber-400',
  },
  {
    id: 3,
    badge: 'Custom Merchandising',
    title: 'Eco Canvas Totes, Cups & Drinkware',
    subtitle: 'High durability materials with vibrant, fade-resistant UV screen prints',
    buttonText: 'View Drinkware & Bags',
    image: '/assets/imgs/shop/cup.jpg',
    bgGradient: 'from-blue-950 via-slate-900 to-slate-900',
    accentColor: 'text-sky-400',
  },
];

export const HeroSlider: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto slide every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
      <div className="relative rounded-3xl overflow-hidden shadow-2xl min-h-[420px] sm:min-h-[480px] lg:min-h-[520px] flex items-center">
        
        {SLIDES.map((slide, index) => {
          const isActive = index === currentSlide;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 bg-gradient-to-r ${slide.bgGradient} flex items-center ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {/* Background ambient lighting */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-12">
                
                {/* Content */}
                <div className="lg:col-span-7 space-y-4 sm:space-y-6 text-white z-10">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold uppercase tracking-wider">
                    <Sparkles className={`w-3.5 h-3.5 ${slide.accentColor}`} />
                    <span className={slide.accentColor}>{slide.badge}</span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15] text-white">
                    {slide.title}
                  </h1>

                  <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
                    {slide.subtitle}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 pt-2">
                    <Link
                      href="#products-section"
                      className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm sm:text-base transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2 active:scale-95"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>{slide.buttonText}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>

                    <Link
                      href="#categories-section"
                      className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm sm:text-base backdrop-blur-md transition-all"
                    >
                      Browse Categories
                    </Link>
                  </div>
                </div>

                {/* Hero Feature Visual */}
                <div className="lg:col-span-5 hidden lg:flex justify-center items-center z-10">
                  <div className="relative w-80 h-80 xl:w-96 xl:h-96 rounded-3xl overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl p-3 group transform transition hover:scale-105 duration-500">
                    <div className="relative w-full h-full rounded-2xl overflow-hidden">
                      <Image
                        src={slide.image}
                        alt={slide.title}
                        fill
                        priority
                        className="object-cover object-center"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          );
        })}

        {/* Slider Controls */}
        <button
          onClick={prevSlide}
          className="absolute left-4 z-20 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 transition-all active:scale-90"
          aria-label="Previous Slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={nextSlide}
          className="absolute right-4 z-20 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 transition-all active:scale-90"
          aria-label="Next Slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Slide Pagination Dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentSlide ? 'w-8 bg-emerald-400' : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

      </div>
    </div>
  );
};

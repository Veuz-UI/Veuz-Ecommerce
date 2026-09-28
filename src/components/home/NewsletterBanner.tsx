'use client';

import React, { useState } from 'react';
import { Mail, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';

export const NewsletterBanner: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setTimeout(() => {
        setEmail('');
        setSubscribed(false);
      }, 5000);
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-8 sm:p-12 text-white shadow-2xl">
        
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Stay in the loop</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Subscribe to Our Newsletter
          </h2>

          <p className="text-sm sm:text-base text-slate-300">
            Get instant notifications about new collections, custom merchandise deals, and exclusive discount vouchers.
          </p>

          <form onSubmit={handleSubscribe} className="pt-4 flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
            <div className="relative flex-1">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address..."
                className="w-full bg-white/10 border border-white/20 text-white placeholder-slate-400 text-sm rounded-2xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white/20 transition-all backdrop-blur-md"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-4" />
            </div>

            <button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-6 py-3.5 rounded-2xl transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 active:scale-95 text-sm"
            >
              <span>Subscribe</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {subscribed && (
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-4 py-2 rounded-xl text-xs font-medium animate-fadeIn">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Thank you! You have been successfully subscribed.</span>
            </div>
          )}
        </div>

      </div>
    </section>
  );
};

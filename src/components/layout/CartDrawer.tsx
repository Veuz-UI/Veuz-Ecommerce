'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Trash2, ArrowRight, ShoppingBag, Plus, Minus } from 'lucide-react';
import { useStore } from '@/context/StoreContext';

export const CartDrawer: React.FC = () => {
  const { isCartOpen, setIsCartOpen, cart, removeFromCart, updateQuantity, totalCartPrice, totalCartItems } = useStore();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between animate-slideLeft">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-800">Your Cart ({totalCartItems})</h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 divide-y divide-slate-100">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <ShoppingBag className="w-16 h-16 stroke-1 text-slate-300 mb-3" />
                <h3 className="text-base font-semibold text-slate-700 mb-1">Your cart is empty</h3>
                <p className="text-xs text-slate-400 mb-6">Explore our popular designs and add items to your cart.</p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-all"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="py-4 flex gap-4 items-center">
                  <div className="relative w-18 h-18 rounded-xl overflow-hidden bg-slate-50 border border-slate-200/60 shrink-0">
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-slate-800 truncate mb-1">
                      {item.product.name}
                    </h4>
                    <span className="text-xs text-slate-400 block mb-2">{item.product.category}</span>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 p-0.5">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-6 h-6 rounded bg-white shadow-xs flex items-center justify-center text-slate-600 hover:bg-slate-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center font-bold text-xs text-slate-700">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-6 h-6 rounded bg-white shadow-xs flex items-center justify-center text-slate-600 hover:bg-slate-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-sm font-bold text-emerald-600">
                        {item.product.price * item.quantity} SR
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors ml-1"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Checkout / Footer Area */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Subtotal (incl. VAT)</span>
                <span className="text-lg font-bold text-slate-900">{totalCartPrice} SR</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Shipping fee</span>
                <span className="text-emerald-600 font-medium">Free Shipping</span>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Link
                  href="#"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-center text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="#"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium rounded-xl text-center text-xs transition-colors"
                >
                  View Full Cart Details
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

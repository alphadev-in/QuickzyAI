'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { Product } from '@/types';
import { Plus, Minus, Check, Snowflake, ShoppingCart, ArrowRight, ShieldCheck, Clock } from 'lucide-react';

export const CustomerStorefront: React.FC = () => {
  const {
    merchants,
    products,
    cart,
    addToCart,
    updateQuantity,
    cartMerchantIds,
    totalPriceCents,
    deliveryFeeCents,
    hasColdChainInCart,
    createTripFromCart,
    setActiveRole,
  } = useApp();

  const getProductQuantity = (productId: string) => {
    const item = cart.find((i) => i.product.id === productId);
    return item ? item.quantity : 0;
  };

  const handleCheckoutAndDispatch = () => {
    createTripFromCart();
    setActiveRole('dispatch');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-8">
      {/* Main Storefront Area */}
      <div className="lg:col-span-8 space-y-10">
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-800 p-8 border border-neutral-800 text-white shadow-2xl">
          <div className="relative z-10 max-w-xl space-y-3">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Now Serving London Neighborhoods (London Only) 🇬🇧</span>
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              Order from London’s best butchers, bakers & grocers in a{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-500">
                single basket.
              </span>
            </h1>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Available exclusively across London boroughs. One delivery fee, one dedicated rider, and guaranteed cold-chain protection under 25 minutes from store counter to your door.
            </p>
          </div>

          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-20 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />
        </div>

        {/* Merchants Groupings */}
        {merchants.map((merchant) => {
          const merchantProducts = products.filter((p) => p.merchantId === merchant.id);

          return (
            <div
              key={merchant.id}
              className="bg-neutral-900/60 rounded-3xl p-6 border border-neutral-800/80 shadow-lg"
            >
              {/* Merchant Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-neutral-800 gap-4">
                <div className="flex items-center space-x-4">
                  <img
                    src={merchant.image}
                    alt={merchant.name}
                    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-neutral-700"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-lg font-bold text-white">{merchant.name}</h2>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                        {merchant.category}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">{merchant.address}</p>
                    <div className="flex items-center space-x-3 text-xs text-neutral-400 mt-1">
                      <span className="text-amber-400 font-bold">★ {merchant.rating}</span>
                      <span>•</span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-emerald-400" />
                        <span>Prep: {merchant.prepTimeMinutes} mins</span>
                      </span>
                      <span>•</span>
                      <span className="text-emerald-400 font-medium">{merchant.badge}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs bg-emerald-950/80 border border-emerald-800 text-emerald-400 px-2.5 py-1 rounded-lg font-semibold inline-block">
                    {merchant.highStreetCorridor}
                  </span>
                </div>
              </div>

              {/* Product Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {merchantProducts.map((product) => {
                  const qty = getProductQuantity(product.id);

                  return (
                    <div
                      key={product.id}
                      className="bg-neutral-800/50 hover:bg-neutral-800/90 transition rounded-2xl p-4 border border-neutral-700/40 flex flex-col justify-between group"
                    >
                      <div className="flex space-x-3">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-20 h-20 rounded-xl object-cover ring-1 ring-neutral-700 shrink-0"
                        />
                        <div className="space-y-1">
                          <div className="flex items-start justify-between">
                            <h3 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition leading-snug">
                              {product.name}
                            </h3>
                          </div>
                          <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                            {product.description}
                          </p>

                          {/* Cold Chain Badge */}
                          {product.requiresColdBag && (
                            <div className="inline-flex items-center space-x-1 text-[10px] font-bold text-cyan-400 bg-cyan-950/80 border border-cyan-800/60 px-1.5 py-0.5 rounded">
                              <Snowflake className="w-2.5 h-2.5" />
                              <span>CHILLED (1-5°C) • THERMAL SEAL</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-neutral-700/40">
                        <span className="text-base font-extrabold text-white">
                          £{(product.priceCents / 100).toFixed(2)}
                        </span>

                        {qty === 0 ? (
                          <button
                            onClick={() => addToCart(product)}
                            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-neutral-700 hover:bg-emerald-500 hover:text-neutral-950 text-white text-xs font-bold transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                        ) : (
                          <div className="flex items-center space-x-2 bg-neutral-900 border border-neutral-700 rounded-xl p-1">
                            <button
                              onClick={() => updateQuantity(product.id, qty - 1)}
                              className="w-6 h-6 flex items-center justify-center rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs transition"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold text-emerald-400 w-4 text-center">
                              {qty}
                            </span>
                            <button
                              onClick={() => updateQuantity(product.id, qty + 1)}
                              className="w-6 h-6 flex items-center justify-center rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs transition"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Multi-Merchant Basket Summary Sidebar */}
      <div className="lg:col-span-4">
        <div className="sticky top-24 bg-neutral-900 rounded-3xl p-6 border border-neutral-800 shadow-2xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">Neighborhood Basket</h2>
            </div>
            <span className="text-xs font-bold bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-full border border-neutral-700">
              {cartMerchantIds.length} {cartMerchantIds.length === 1 ? 'Store' : 'Stores'}
            </span>
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center mx-auto text-neutral-500">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <p className="text-sm text-neutral-400 font-medium">Your basket is empty</p>
              <p className="text-xs text-neutral-500">
                Add products from any combination of local stores above!
              </p>
            </div>
          ) : (
            <>
              {/* Grouped by Merchant in the Cart */}
              <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                {cartMerchantIds.map((mId) => {
                  const merchant = merchants.find((m) => m.id === mId)!;
                  const merchantItems = cart.filter((i) => i.merchant.id === mId);

                  return (
                    <div
                      key={mId}
                      className="bg-neutral-800/40 rounded-2xl p-3 border border-neutral-800 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-neutral-300">
                        <span className="flex items-center space-x-1.5 text-emerald-400">
                          <span>🏬</span>
                          <span>{merchant.name}</span>
                        </span>
                        <span className="text-[10px] text-neutral-400">{merchant.prepTimeMinutes}m prep</span>
                      </div>

                      <div className="divide-y divide-neutral-800/60">
                        {merchantItems.map((item) => (
                          <div
                            key={item.product.id}
                            className="py-1.5 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center space-x-2">
                              <span className="text-neutral-400 font-semibold">{item.quantity}x</span>
                              <span className="text-neutral-200">{item.product.name}</span>
                              {item.product.requiresColdBag && (
                                <Snowflake className="w-3 h-3 text-cyan-400 shrink-0" />
                              )}
                            </div>
                            <span className="text-neutral-300 font-semibold ml-2">
                              £{((item.product.priceCents * item.quantity) / 100).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Cold-Chain Assurance Banner */}
              {hasColdChainInCart && (
                <div className="bg-cyan-950/40 border border-cyan-800/60 rounded-2xl p-3 space-y-1.5">
                  <div className="flex items-center space-x-2 text-xs font-bold text-cyan-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Cold-Chain Protection Included</span>
                  </div>
                  <p className="text-[11px] text-cyan-200/70 leading-relaxed">
                    Perishable meats/fish are sealed in insulated temperature-controlled pouches with frozen cool-packs.
                  </p>
                </div>
              )}

              {/* Price Calculation */}
              <div className="space-y-2 pt-4 border-t border-neutral-800 text-xs">
                <div className="flex justify-between text-neutral-400">
                  <span>Store Items Subtotal</span>
                  <span className="text-neutral-200">
                    £{((totalPriceCents - deliveryFeeCents) / 100).toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between text-neutral-400">
                  <div>
                    <span>Unified Multi-Store Delivery</span>
                    <span className="text-[10px] text-emerald-400 ml-1">(Consolidated Route)</span>
                  </div>
                  <span className="text-neutral-200">£{(deliveryFeeCents / 100).toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-neutral-800">
                  <span>Total</span>
                  <span className="text-emerald-400 text-base">£{(totalPriceCents / 100).toFixed(2)}</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleCheckoutAndDispatch}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-neutral-950 font-black text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
              >
                <span>Checkout & Generate Route</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

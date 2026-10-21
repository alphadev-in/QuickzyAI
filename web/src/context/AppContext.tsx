'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product, Merchant, DeliveryTrip, Waypoint } from '@/types';
import { INITIAL_MERCHANTS, INITIAL_PRODUCTS } from '@/data/mockData';

interface AppContextType {
  merchants: Merchant[];
  products: Product[];
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartMerchantIds: string[];
  totalPriceCents: number;
  deliveryFeeCents: number;
  hasColdChainInCart: boolean;
  // Dispatch / Trips
  activeTrip: DeliveryTrip | null;
  createTripFromCart: () => void;
  verifyWaypointHandshake: (waypointId: string, coldSafetyChecked: boolean) => void;
  // Active demo role
  activeRole: 'customer' | 'merchant' | 'driver' | 'dispatch';
  setActiveRole: (role: 'customer' | 'merchant' | 'driver' | 'dispatch') => void;
  // Selected merchant for vendor portal
  selectedMerchantId: string;
  setSelectedMerchantId: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [merchants] = useState<Merchant[]>(INITIAL_MERCHANTS);
  const [products] = useState<Product[]>(INITIAL_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([
    {
      product: INITIAL_PRODUCTS[0], // Ribeye (Cold)
      quantity: 1,
      merchant: INITIAL_MERCHANTS[0],
    },
    {
      product: INITIAL_PRODUCTS[3], // Sourdough Loaf (Ambient)
      quantity: 1,
      merchant: INITIAL_MERCHANTS[1],
    },
  ]);

  const [activeRole, setActiveRole] = useState<'customer' | 'merchant' | 'driver' | 'dispatch'>('customer');
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>('merch_butcher');
  const [activeTrip, setActiveTrip] = useState<DeliveryTrip | null>(null);

  // Initialize a demo trip on load
  useEffect(() => {
    generateDemoTrip();
  }, []);

  const generateDemoTrip = () => {
    const waypoints: Waypoint[] = [
      {
        id: 'wp_butcher',
        type: 'pickup',
        merchantId: 'merch_butcher',
        locationName: 'Islington Prime Butchers',
        address: '142 Upper Street, Islington, N1 1QP',
        lat: 51.5398,
        lng: -0.1022,
        status: 'pending',
        hasColdChain: true,
        qrPayload: 'QZK-BUTCHER-8921-TOKEN',
        backupPin: '4829',
        itemsSummary: '1x Dry-Aged Ribeye (280g) [❄️ Chilled]',
      },
      {
        id: 'wp_bakery',
        type: 'pickup',
        merchantId: 'merch_bakery',
        locationName: 'Sourdough & Co. Bakery',
        address: '158 Upper Street, Islington, N1 1RA',
        lat: 51.5412,
        lng: -0.1029,
        status: 'pending',
        hasColdChain: false,
        qrPayload: 'QZK-BAKERY-3142-TOKEN',
        backupPin: '9134',
        itemsSummary: '1x Signature Sourdough Loaf',
      },
      {
        id: 'wp_dropoff',
        type: 'dropoff',
        locationName: 'Customer Doorstep (Karan P.)',
        address: '28 Canonbury Square, Islington, N1 2AL',
        lat: 51.5435,
        lng: -0.0982,
        status: 'pending',
        hasColdChain: true,
        itemsSummary: 'Complete Neighborhood Basket (2 Stores, 2 Items)',
      },
    ];

    setActiveTrip({
      id: 'TRIP-LON-8291',
      driverName: 'Marco Bellini (Quickzy Pro Rider)',
      driverVehicle: 'E-Cargo Bike (Thermal Box #04)',
      status: 'active',
      totalDistanceKm: 2.1,
      estimatedMinutes: 22,
      waypoints,
      currentWaypointIndex: 0,
      coldChainLimitMins: 25,
    });
  };

  const addToCart = (product: Product) => {
    const merchant = merchants.find((m) => m.id === product.merchantId);
    if (!merchant) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1, merchant }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => setCart([]);

  const cartMerchantIds = Array.from(new Set(cart.map((item) => item.merchant.id)));

  const itemsSubtotalCents = cart.reduce(
    (acc, item) => acc + item.product.priceCents * item.quantity,
    0
  );

  // Flat base delivery + incremental multi-merchant discount fee
  const deliveryFeeCents =
    cart.length === 0 ? 0 : cartMerchantIds.length === 1 ? 249 : 249 + (cartMerchantIds.length - 1) * 99;

  const totalPriceCents = itemsSubtotalCents + deliveryFeeCents;

  const hasColdChainInCart = cart.some((item) => item.product.requiresColdBag);

  const createTripFromCart = () => {
    if (cart.length === 0) return;

    const pickups: Waypoint[] = cartMerchantIds.map((mId) => {
      const merchant = merchants.find((m) => m.id === mId)!;
      const merchantItems = cart.filter((i) => i.merchant.id === mId);
      const isCold = merchantItems.some((i) => i.product.requiresColdBag);

      return {
        id: `wp_${mId}_${Date.now()}`,
        type: 'pickup',
        merchantId: mId,
        locationName: merchant.name,
        address: merchant.address,
        lat: merchant.lat,
        lng: merchant.lng,
        status: 'pending',
        hasColdChain: isCold,
        qrPayload: `QZK-${merchant.name.toUpperCase().slice(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}`,
        backupPin: `${Math.floor(1000 + Math.random() * 9000)}`,
        itemsSummary: merchantItems.map((i) => `${i.quantity}x ${i.product.name}`).join(', '),
      };
    });

    const dropoff: Waypoint = {
      id: `wp_dropoff_${Date.now()}`,
      type: 'dropoff',
      locationName: 'Customer Doorstep',
      address: '28 Canonbury Square, Islington, N1 2AL',
      lat: 51.5435,
      lng: -0.0982,
      status: 'pending',
      hasColdChain: hasColdChainInCart,
      itemsSummary: `Consolidated delivery from ${cartMerchantIds.length} stores`,
    };

    setActiveTrip({
      id: `TRIP-LON-${Math.floor(1000 + Math.random() * 9000)}`,
      driverName: 'Marco Bellini (Quickzy Pro Rider)',
      driverVehicle: 'E-Cargo Bike (Thermal Box #04)',
      status: 'active',
      totalDistanceKm: Number((1.2 + cartMerchantIds.length * 0.6).toFixed(1)),
      estimatedMinutes: 15 + cartMerchantIds.length * 5,
      waypoints: [...pickups, dropoff],
      currentWaypointIndex: 0,
      coldChainLimitMins: 25,
    });
  };

  const verifyWaypointHandshake = (waypointId: string) => {
    if (!activeTrip) return;

    const updatedWaypoints = activeTrip.waypoints.map((wp) => {
      if (wp.id === waypointId) {
        return { ...wp, status: 'completed' as const };
      }
      return wp;
    });

    const nextIndex = updatedWaypoints.findIndex((wp) => wp.status === 'pending');
    const isAllDone = nextIndex === -1;

    setActiveTrip({
      ...activeTrip,
      waypoints: updatedWaypoints,
      currentWaypointIndex: isAllDone ? updatedWaypoints.length - 1 : nextIndex,
      status: isAllDone ? 'completed' : 'active',
    });
  };

  return (
    <AppContext.Provider
      value={{
        merchants,
        products,
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartMerchantIds,
        totalPriceCents,
        deliveryFeeCents,
        hasColdChainInCart,
        activeTrip,
        createTripFromCart,
        verifyWaypointHandshake,
        activeRole,
        setActiveRole,
        selectedMerchantId,
        setSelectedMerchantId,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

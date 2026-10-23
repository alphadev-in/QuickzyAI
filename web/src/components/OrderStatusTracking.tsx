'use client';

import React, { useState } from 'react';
import { QuickzyOrder, OrderStatus, UserRole } from '@/types/delivery';
import { updateOrderStatus } from '@/lib/orderService';
import {
  Package,
  Pill,
  Utensils,
  Search,
  CheckCircle,
  Truck,
  Clock,
  ArrowRight,
  FileText,
  MapPin,
  Bell,
  Camera,
  CheckCircle2,
  Activity,
} from 'lucide-react';
import { OpenStreetMapViewer } from './OpenStreetMapViewer';

interface OrderStatusTrackingProps {
  orders: QuickzyOrder[];
  currentUserRole: UserRole;
  onRefreshOrders: () => void;
}

export const OrderStatusTracking: React.FC<OrderStatusTrackingProps> = ({
  orders,
  currentUserRole,
  onRefreshOrders,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(orders[0]?.id || null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Sync selected order with latest orders
  React.useEffect(() => {
    if (orders.length > 0 && (!selectedOrderId || !orders.some((o) => o.id === selectedOrderId))) {
      setSelectedOrderId(orders[0].id);
    }
  }, [orders, selectedOrderId]);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || orders[0] || null;

  const filteredOrders = orders.filter((o) => {
    if (!o || !o.id) return false;
    const q = searchQuery.toLowerCase();
    const pk = o.pickupAddress?.postcode || '';
    const dp = o.dropoffAddress?.postcode || '';
    const tp = o.type || '';
    return (
      o.id.toLowerCase().includes(q) ||
      pk.toLowerCase().includes(q) ||
      dp.toLowerCase().includes(q) ||
      tp.toLowerCase().includes(q)
    );
  });

  const handleAdvanceStatus = async (orderId: string, nextStatus: OrderStatus) => {
    setIsUpdating(true);
    await updateOrderStatus(
      orderId,
      nextStatus,
      nextStatus === 'out_for_delivery' ? 'Fleet Unit #London-North-4' : undefined
    );
    setIsUpdating(false);
    onRefreshOrders();
  };

  const getStatusStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'booked':
        return 0;
      case 'collected':
        return 1;
      case 'out_for_delivery':
        return 2;
      case 'delivered':
        return 3;
      default:
        return 0;
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 lg:p-8 shadow-2xl max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-neutral-800 gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Order Status & Live Tracking</span>
            <span className="text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              REAL-TIME
            </span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Tracking lifecycle: Booked ➔ Collected ➔ Out for Delivery ➔ Delivered (With Invoices)
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID or Postcode..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders List Column */}
        <div className="lg:col-span-1 space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
          {filteredOrders.map((order) => {
            const isSelected = selectedOrder?.id === order.id;
            return (
              <div
                key={order.id}
                onClick={() => setSelectedOrderId(order.id)}
                className={`p-3.5 rounded-xl border transition cursor-pointer ${
                  isSelected
                    ? 'border-emerald-500 bg-neutral-950 shadow-md shadow-emerald-500/10'
                    : 'border-neutral-800 bg-neutral-950/50 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-mono font-bold text-white">{order.id}</span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      order.status === 'delivered'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : order.status === 'out_for_delivery'
                        ? 'bg-cyan-500/20 text-cyan-400 animate-pulse'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {order.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-neutral-300">
                  {order.type === 'pharmacy' ? (
                    <Pill className="w-3.5 h-3.5 text-emerald-400" />
                  ) : order.type === 'food' ? (
                    <Utensils className="w-3.5 h-3.5 text-orange-400" />
                  ) : (
                    <Package className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                  <span className="capitalize">{order.type}</span>
                  <span>•</span>
                  <span className="font-bold text-emerald-400">£{order.priceGbp?.toFixed(2) || '0.00'}</span>
                </div>

                <div className="mt-2 text-[11px] text-neutral-400 font-mono flex items-center justify-between">
                  <span>{order.pickupAddress?.postcode || 'N/A'}</span>
                  <span>➔</span>
                  <span>{order.dropoffAddress?.postcode || 'N/A'}</span>
                </div>
              </div>
            );
          })}

          {filteredOrders.length === 0 && (
            <p className="text-xs text-neutral-500 text-center py-10">No orders found.</p>
          )}
        </div>

        {/* Detailed Status Inspector */}
        <div className="lg:col-span-2 bg-neutral-950 border border-neutral-800 rounded-xl p-6 flex flex-col justify-between">
          {selectedOrder ? (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-800/80 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-white font-mono">{selectedOrder.id}</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                      {selectedOrder.type}
                    </span>
                    {selectedOrder.parcel?.isRestricted && (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Restricted
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">Booked by: {selectedOrder.userEmail || 'Client Account'}</p>
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-xs text-neutral-400">Invoice Reference</p>
                  <p className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1 sm:justify-end">
                    <FileText className="w-3.5 h-3.5" />
                    <span>{selectedOrder.invoiceId || `INV-${selectedOrder.id}`}</span>
                  </p>
                </div>
              </div>

              {/* Notification Banner */}
              {selectedOrder.notificationAlert && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2.5 animate-pulse-glow">
                  <Bell className="w-4 h-4 shrink-0" />
                  <div className="flex-1">
                    <span className="font-bold">Live Notification: </span>
                    <span>{selectedOrder.notificationAlert}</span>
                  </div>
                </div>
              )}

              {/* Handover & Proof of Delivery Card (If Delivered) */}
              {selectedOrder.status === 'delivered' && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Delivery Handover Confirmed & Signed
                    </span>
                    {selectedOrder.deliveredAt && (
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {new Date(selectedOrder.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  {selectedOrder.handoverNotes && (
                    <p className="text-neutral-300">
                      <strong className="text-neutral-200">Handover Notes:</strong> {selectedOrder.handoverNotes}
                    </p>
                  )}
                  {selectedOrder.proofOfDeliveryPhoto && (
                    <div>
                      <p className="text-[11px] font-bold text-neutral-300 mb-1.5 flex items-center gap-1">
                        <Camera className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Proof of Delivery Photo</span>
                      </p>
                      <div className="relative rounded-xl overflow-hidden border border-emerald-500/30 max-w-sm">
                        <img
                          src={selectedOrder.proofOfDeliveryPhoto}
                          alt="Proof of Handover"
                          className="w-full h-40 object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Activity Trail / Order Timeline */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Order Activity & Handover History</span>
                </p>
                <div className="space-y-2">
                  {(selectedOrder.activities && selectedOrder.activities.length > 0
                    ? selectedOrder.activities
                    : [
                        {
                          timestamp: selectedOrder.createdAt,
                          action: 'Order Booked & Confirmed',
                          actor: selectedOrder.userEmail || 'Client',
                          details: 'Placed order with rapid London same-day delivery service.',
                          location: `${selectedOrder.pickupAddress.line1} (${selectedOrder.pickupAddress.postcode})`,
                        },
                      ]
                  ).map((act, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/80 flex items-start gap-3 text-xs"
                    >
                      <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-neutral-200">{act.action}</span>
                          <span className="text-[10px] text-neutral-500 font-mono">
                            {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400">
                          By <strong className="text-neutral-300">{act.actor}</strong>
                          {act.location ? ` • At ${act.location}` : ''}
                        </p>
                        {act.details && <p className="text-[11px] text-neutral-300">{act.details}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step Progress Tracker */}
              <div>
                <p className="text-xs font-bold text-neutral-300 uppercase tracking-wider mb-3">
                  Live Dispatch Status
                </p>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  {['booked', 'collected', 'out_for_delivery', 'delivered'].map((st, i) => {
                    const currentIdx = getStatusStepIndex(selectedOrder.status);
                    const isDone = i <= currentIdx;
                    const isCurrent = i === currentIdx;

                    return (
                      <div key={st} className="space-y-1.5">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            isDone ? 'bg-emerald-500 shadow-sm shadow-emerald-500/30' : 'bg-neutral-800'
                          }`}
                        />
                        <p
                          className={`text-[11px] font-bold capitalize ${
                            isCurrent
                              ? 'text-emerald-400'
                              : isDone
                              ? 'text-neutral-200'
                              : 'text-neutral-500'
                          }`}
                        >
                          {st.replace(/_/g, ' ')}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Route & Parcel Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800/80 space-y-1">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                    Pickup Location
                  </span>
                  <p className="text-neutral-200 font-medium">{selectedOrder.pickupAddress?.line1 || 'Quickzy London Hub'}</p>
                  <p className="text-neutral-400 font-mono text-[11px]">
                    {selectedOrder.pickupAddress?.city || 'London'}, {selectedOrder.pickupAddress?.postcode || 'N/A'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800/80 space-y-1">
                  <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                    Drop-off Location
                  </span>
                  <p className="text-neutral-200 font-medium">{selectedOrder.dropoffAddress?.line1 || 'Destination'}</p>
                  <p className="text-neutral-400 font-mono text-[11px]">
                    {selectedOrder.dropoffAddress?.city || 'London'}, {selectedOrder.dropoffAddress?.postcode || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Native OpenStreetMap Routing & Location Display */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-neutral-300">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Live London Dispatch Route (OpenStreetMap)</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    {selectedOrder.pickupAddress?.postcode || 'N/A'} ➔ {selectedOrder.dropoffAddress?.postcode || 'N/A'}
                  </span>
                </div>
                <OpenStreetMapViewer
                  pickupLat={selectedOrder.pickupAddress?.lat || 51.5074}
                  pickupLng={selectedOrder.pickupAddress?.lng || -0.1278}
                  pickupLabel={`${selectedOrder.pickupAddress?.line1 || 'Pickup'} (${selectedOrder.pickupAddress?.postcode || ''})`}
                  dropoffLat={selectedOrder.dropoffAddress?.lat || 51.5155}
                  dropoffLng={selectedOrder.dropoffAddress?.lng || -0.1419}
                  dropoffLabel={`${selectedOrder.dropoffAddress?.line1 || 'Dropoff'} (${selectedOrder.dropoffAddress?.postcode || ''})`}
                  className="h-56"
                />
              </div>

              {selectedOrder.parcel && (
                <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs space-y-2">
                  <span className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider">
                    Parcel Manifest
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-neutral-400 text-[11px]">
                    <div>
                      Weight: <span className="text-white font-bold">{selectedOrder.parcel.weightKg} kg</span>
                    </div>
                    <div>
                      Dimensions:{' '}
                      <span className="text-white font-bold">
                        {selectedOrder.parcel.lengthCm}x{selectedOrder.parcel.widthCm}x{selectedOrder.parcel.heightCm} cm
                      </span>
                    </div>
                    <div>
                      Contents: <span className="text-white font-bold">{selectedOrder.parcel.contentsDescription}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Admin / Dispatcher Simulation Controls */}
              <div className="pt-4 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-[11px] text-neutral-400">
                  <span>Assigned Courier: </span>
                  <span className="text-emerald-400 font-bold">
                    {selectedOrder.assignedDriverName || 'London Route Batcher Fleet'}
                  </span>
                </div>

                {/* Status progression triggers */}
                <div className="flex gap-2">
                  {selectedOrder.status === 'booked' && (
                    <button
                      onClick={() => handleAdvanceStatus(selectedOrder.id, 'collected')}
                      disabled={isUpdating}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs font-bold border border-emerald-500/30 transition"
                    >
                      Mark Collected
                    </button>
                  )}
                  {selectedOrder.status === 'collected' && (
                    <button
                      onClick={() => handleAdvanceStatus(selectedOrder.id, 'out_for_delivery')}
                      disabled={isUpdating}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 text-xs font-bold border border-cyan-500/30 transition"
                    >
                      Dispatch Out for Delivery
                    </button>
                  )}
                  {selectedOrder.status === 'out_for_delivery' && (
                    <button
                      onClick={() => handleAdvanceStatus(selectedOrder.id, 'delivered')}
                      disabled={isUpdating}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 text-neutral-950 hover:bg-emerald-400 text-xs font-bold transition"
                    >
                      Complete Delivery (Handshake)
                    </button>
                  )}
                  {selectedOrder.status === 'delivered' && (
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Delivered & Invoiced
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-neutral-500 text-xs">
              Select an order from the left to inspect its live status.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

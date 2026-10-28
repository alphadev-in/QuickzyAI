'use client';

import React, { useEffect, useState } from 'react';
import { Bell, BellRing, X } from 'lucide-react';
import { DriverNotification } from '@/types/delivery';
import { deleteNotification, markNotificationRead, subscribeToDriverNotifications } from '@/lib/orderService';

interface CustomerNotificationsProps {
  email: string;
}

// Order history for the customer: booked, driver assigned, collected, delivered, returned.
// Notifications are stored per recipient, so this reads only the signed-in user's own items.
export const CustomerNotifications: React.FC<CustomerNotificationsProps> = ({ email }) => {
  const [items, setItems] = useState<DriverNotification[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => subscribeToDriverNotifications(email, setItems), [email]);

  const unread = items.filter((n) => !n.read).length;
  const visible = showAll ? items : items.slice(0, 4);

  if (items.length === 0) {
    return (
      <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-400 flex items-center gap-2">
        <Bell className="w-4 h-4" /> No notifications yet. Updates about your orders will appear here.
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black text-white flex items-center gap-2">
          {unread > 0 ? <BellRing className="w-4 h-4 text-amber-400" /> : <Bell className="w-4 h-4 text-neutral-400" />}
          Notifications {unread > 0 && <span className="text-amber-400">({unread} new)</span>}
        </p>
        {items.length > 4 && (
          <button type="button" onClick={() => setShowAll((v) => !v)} className="text-[11px] font-bold text-emerald-400">
            {showAll ? 'Show less' : `Show all (${items.length})`}
          </button>
        )}
      </div>

      <div className="space-y-2">
        {visible.map((n) => (
          <div
            key={n.id}
            className={`relative p-3 pr-10 rounded-xl border text-xs ${
              n.read ? 'bg-neutral-950 border-neutral-800 text-neutral-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-100'
            }`}
          >
            <button
              type="button"
              onClick={() => !n.read && markNotificationRead(n.id)}
              className="text-left w-full"
            >
              <span className="font-bold block">{n.title}</span>
              <span className="block mt-0.5">{n.message}</span>
              <span className="block mt-1 text-[10px] text-neutral-500">
                {new Date(n.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
            </button>
            <button
              type="button"
              onClick={() => deleteNotification(n.id)}
              aria-label="Remove notification"
              className="absolute top-2 right-2 min-h-[36px] min-w-[36px] flex items-center justify-center text-neutral-500 hover:text-red-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import { SupportChat } from '@/components/SupportChat';

// Answers to the questions customers ask most. Keep these in line with how the app really works.
const FAQS: { q: string; a: string }[] = [
  {
    q: 'How do I book a delivery?',
    a: 'Choose Book, pick Pharmacy, Food & Grocery or Parcel & Freight, enter the pickup and drop-off postcodes, add the parcel details, and add the delivery to your basket. Then pay by card or from your credit balance.',
  },
  {
    q: 'How is the price worked out?',
    a: 'Price = base fee + weight + distance. Each category has its own rates. Orders over £30 get 10% off. The breakdown is shown before you pay.',
  },
  {
    q: 'What are the parcel size limits?',
    a: 'Each category has a maximum weight and maximum length, width and height. The booking form shows the limits and will not let you add a parcel that is over them.',
  },
  {
    q: 'Why do I need to add a photo?',
    a: 'Photos of the parcel are required for food and parcel bookings. Pharmacy bookings do not need one. The photo is kept with your order.',
  },
  {
    q: 'Do you deliver age-restricted items?',
    a: 'Yes, but only to people aged 25 or over. Enter the recipient date of birth when you book. The driver checks it at the door and will not hand over the item if the age or date of birth does not match.',
  },
  {
    q: 'Where is my parcel?',
    a: 'Open Orders to see the timeline and the latest driver location. Notifications tell you when a driver is assigned, when the parcel is collected, and when it is delivered.',
  },
  {
    q: 'What happens if the delivery fails?',
    a: 'The driver records the reason and the parcel may be returned to dispatch. Dispatch will then send it out again. You will get a notification each time the status changes.',
  },
  {
    q: 'Can I cancel an order or change the address?',
    a: 'Start a chat with support as soon as possible and give your order number. Changes can only be made before the parcel is collected.',
  },
  {
    q: 'How do I get a refund or use credit?',
    a: 'Credit you buy is added to your balance and can be used to pay for bookings. Start a chat with support about any payment problem and include the payment reference.',
  },
];

interface HelpCenterProps {
  email: string;
}

// Help tab: FAQ first, then the chat with support
export const HelpCenter: React.FC<HelpCenterProps> = ({ email }) => {
  const [tab, setTab] = useState<'faq' | 'chat'>('faq');

  return (
    <div className="max-w-2xl mx-auto w-full space-y-4">
      <div role="tablist" aria-label="Help sections" className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-neutral-900 border border-neutral-800">
        {([
          { id: 'faq', label: 'FAQ' },
          { id: 'chat', label: 'Chat with support' },
        ] as const).map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`min-h-[44px] rounded-xl text-xs font-black transition ${tab === t.id ? 'bg-emerald-500 text-neutral-950' : 'text-neutral-400 hover:text-white'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'faq' ? (
        <div className="space-y-2">
          {FAQS.map((item) => (
            <details key={item.q} className="group p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
              <summary className="cursor-pointer list-none flex items-center justify-between gap-3 text-sm font-bold text-white min-h-[32px]">
                {item.q}
                <span className="text-neutral-500 group-open:rotate-45 transition text-lg leading-none">+</span>
              </summary>
              <p className="text-xs text-neutral-300 leading-relaxed pt-2">{item.a}</p>
            </details>
          ))}
          <button type="button" onClick={() => setTab('chat')} className="w-full min-h-[48px] rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-200">
            Didn’t find your answer? Chat with support
          </button>
        </div>
      ) : (
        <SupportChat email={email} mode="page" />
      )}
    </div>
  );
};

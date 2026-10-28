'use client';

import React, { useEffect, useRef, useState } from 'react';
import { LifeBuoy, X, Send, CheckCircle2 } from 'lucide-react';
import {
  SupportMessage,
  SupportThread,
  sendSupportMessage,
  subscribeToMessages,
  subscribeToThread,
} from '@/lib/support';

interface SupportChatProps {
  email: string;
}

// Help button and chat for any signed-in user. Replies from the Quickzy team appear live.
export const SupportChat: React.FC<SupportChatProps> = ({ email }) => {
  const [open, setOpen] = useState(false);
  const [thread, setThread] = useState<SupportThread | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  // Listen only while the panel is open, to keep reads down
  useEffect(() => {
    if (!open) return;
    const unsubThread = subscribeToThread(email, setThread);
    const unsubMessages = subscribeToMessages(email, setMessages);
    return () => {
      unsubThread();
      unsubMessages();
    };
  }, [open, email]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    setError('');
    try {
      await sendSupportMessage(email, 'customer', email, draft);
      setDraft('');
    } catch (err: any) {
      setError(err?.message || 'Message could not be sent. Check your connection.');
    } finally {
      setSending(false);
    }
  };

  const resolved = thread?.status === 'resolved';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Get help from Quickzy support"
        className="fixed right-4 bottom-24 lg:bottom-6 z-40 px-4 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-xs shadow-xl shadow-emerald-500/30 flex items-center gap-2"
      >
        <LifeBuoy className="w-4 h-4" /> Help
      </button>

      {open && (
        <div className="fixed inset-0 lg:inset-auto lg:right-6 lg:bottom-6 z-50 flex flex-col bg-neutral-950 lg:bg-neutral-900 lg:border lg:border-neutral-700 lg:rounded-2xl lg:w-96 lg:h-[30rem] shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
            <div>
              <p className="text-sm font-black text-white">Quickzy support</p>
              <p className="text-[11px] text-neutral-400">
                {resolved ? 'This issue is marked resolved.' : 'We usually reply within the hour.'}
              </p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close chat" className="min-h-[44px] min-w-[44px] flex items-center justify-center text-neutral-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-2">
            {messages.length === 0 && (
              <p className="text-xs text-neutral-500 text-center py-6">Tell us what went wrong with your booking or delivery.</p>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.from === 'customer' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs whitespace-pre-wrap ${
                    m.from === 'customer' ? 'bg-emerald-500 text-neutral-950' : 'bg-neutral-800 text-neutral-100'
                  }`}
                >
                  {m.from === 'admin' && <span className="block text-[10px] font-bold opacity-70">Quickzy support</span>}
                  {m.text}
                </div>
              </div>
            ))}
            {resolved && (
              <p className="text-[11px] text-emerald-400 flex items-center justify-center gap-1.5 pt-2">
                <CheckCircle2 className="w-3.5 h-3.5" /> Resolved. Send a message if you need more help.
              </p>
            )}
          </div>

          {error && <p className="px-4 text-xs text-red-400">{error}</p>}
          <form onSubmit={send} className="p-3 border-t border-neutral-800 flex gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type your message"
              maxLength={2000}
              className="flex-1 min-h-[44px] bg-neutral-950 border border-neutral-800 rounded-xl px-3 text-white focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              aria-label="Send message"
              className="min-h-[44px] min-w-[44px] rounded-xl bg-emerald-500 text-neutral-950 flex items-center justify-center disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

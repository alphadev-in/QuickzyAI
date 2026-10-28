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
  /** page: full screen tab on phones. floating: desktop corner panel */
  mode: 'page' | 'floating';
}

// Help and chat for any signed-in user. Replies from the Quickzy team appear live.
export const SupportChat: React.FC<SupportChatProps> = ({ email, mode }) => {
  const [open, setOpen] = useState(mode === 'page');
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

  const panel = (
        <div
          className={
            mode === 'page'
              ? 'flex flex-col h-[calc(100dvh-9rem)] min-h-[420px] max-w-2xl mx-auto w-full bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden'
              : 'flex flex-col w-96 h-[30rem] bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl overflow-hidden'
          }
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
            <div>
              <p className="text-sm font-black text-white">Quickzy support</p>
              <p className="text-[11px] text-neutral-400">
                {resolved ? 'This issue is marked resolved.' : 'We usually reply within the hour.'}
              </p>
            </div>
            {mode === 'floating' && (
              <button type="button" onClick={() => setOpen(false)} aria-label="Close chat" className="min-h-[44px] min-w-[44px] flex items-center justify-center text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            )}
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
          <form onSubmit={send} className="p-3 border-t border-neutral-800 flex gap-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
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
  );

  if (mode === 'page') return panel;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Get help from Quickzy support"
        className="hidden lg:flex fixed right-6 bottom-6 z-40 px-4 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-xs shadow-xl shadow-emerald-500/30 items-center gap-2"
      >
        <LifeBuoy className="w-4 h-4" /> Help
      </button>
      {open && <div className="hidden lg:block fixed right-6 bottom-6 z-50">{panel}</div>}
    </>
  );
};

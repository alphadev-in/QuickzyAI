'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, RotateCcw, Send } from 'lucide-react';
import {
  SupportMessage,
  SupportThread,
  sendSupportMessage,
  setSupportStatus,
  subscribeToAllThreads,
  subscribeToMessages,
} from '@/lib/support';

const ADMIN_EMAIL = 'prajapatikaranc@gmail.com';

// Admin inbox: every support thread, open ones first. Reply in the thread, then resolve or reopen it.
export const AdminSupportInbox: React.FC = () => {
  const [threads, setThreads] = useState<SupportThread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => subscribeToAllThreads(setThreads), []);

  useEffect(() => {
    if (!activeId) return;
    return subscribeToMessages(activeId, setMessages);
  }, [activeId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const active = threads.find((t) => t.id === activeId) || null;

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active || !reply.trim()) return;
    setSending(true);
    setError('');
    try {
      await sendSupportMessage(active, 'admin', ADMIN_EMAIL, reply);
      setReply('');
    } catch (err: any) {
      setError(err?.message || 'Reply could not be sent');
    } finally {
      setSending(false);
    }
  };

  const toggleStatus = async () => {
    if (!active) return;
    try {
      await setSupportStatus(active.id, active.status === 'open' ? 'resolved' : 'open');
    } catch (err: any) {
      setError(err?.message || 'Status could not be changed');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-1 bg-neutral-900 border border-neutral-800 rounded-2xl p-3 space-y-2 max-h-[560px] overflow-y-auto">
        <p className="text-xs font-bold text-white px-1">Support inbox ({threads.filter((t) => t.status === 'open').length} open)</p>
        {threads.length === 0 && <p className="text-xs text-neutral-500 px-1 py-4">No support requests yet.</p>}
        {threads.map((t) => {
          const needsReply = t.status === 'open' && t.lastFrom === 'customer';
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveId(t.id)}
              className={`w-full text-left p-3 rounded-xl border text-xs transition ${
                activeId === t.id ? 'border-emerald-500 bg-emerald-500/10' : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700'
              }`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="font-mono text-white truncate">{t.ownerEmail}</span>
                {needsReply ? (
                  <span className="text-[10px] font-bold text-amber-300">Needs reply</span>
                ) : (
                  <span className={`text-[10px] font-bold ${t.status === 'resolved' ? 'text-neutral-500' : 'text-emerald-400'}`}>
                    {t.status === 'resolved' ? 'Resolved' : 'Open'}
                  </span>
                )}
              </span>
              <span className="block text-[11px] text-neutral-500 truncate">{t.subject}</span>
              <span className="block text-neutral-400 truncate mt-1">{t.lastMessage}</span>
            </button>
          );
        })}
      </div>

      <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col min-h-[420px]">
        {!active ? (
          <p className="text-xs text-neutral-500 m-auto">Select a conversation to reply.</p>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-neutral-800">
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{active.ownerEmail}</p>
                <p className="text-[11px] text-neutral-400">{active.status === 'resolved' ? 'Resolved' : 'Open'}</p>
              </div>
              <button
                type="button"
                onClick={toggleStatus}
                className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 ${
                  active.status === 'open' ? 'bg-emerald-500 text-neutral-950' : 'bg-neutral-800 text-neutral-200'
                }`}
              >
                {active.status === 'open' ? <><CheckCircle2 className="w-3.5 h-3.5" /> Resolve</> : <><RotateCcw className="w-3.5 h-3.5" /> Reopen</>}
              </button>
            </div>

            <div ref={listRef} className="flex-1 overflow-y-auto py-3 space-y-2 max-h-[420px]">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.from === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs whitespace-pre-wrap ${m.from === 'admin' ? 'bg-emerald-500 text-neutral-950' : 'bg-neutral-800 text-neutral-100'}`}>
                    <span className="block text-[10px] font-bold opacity-70">{m.from === 'admin' ? 'You (support)' : m.authorEmail}</span>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            {error && <p className="text-xs text-red-400 pb-2">{error}</p>}
            <form onSubmit={sendReply} className="flex gap-2 pt-2 border-t border-neutral-800">
              <input
                type="text"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Reply to the customer"
                maxLength={2000}
                className="flex-1 min-h-[44px] bg-neutral-950 border border-neutral-800 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <button type="submit" disabled={sending || !reply.trim()} className="min-h-[44px] px-4 rounded-xl bg-emerald-500 text-neutral-950 font-black text-xs flex items-center gap-1.5 disabled:opacity-40">
                <Send className="w-3.5 h-3.5" /> Send
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

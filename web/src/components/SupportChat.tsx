'use client';

import React, { useEffect, useRef, useState } from 'react';
import { LifeBuoy, X, Send, CheckCircle2, ArrowLeft, Plus } from 'lucide-react';
import {
  SupportMessage,
  SupportThread,
  createSupportThread,
  sendSupportMessage,
  subscribeToMessages,
  subscribeToMyThreads,
} from '@/lib/support';

interface SupportChatProps {
  email: string;
  /** page: the Help tab. floating: desktop corner panel */
  mode: 'page' | 'floating';
}

// Customer and driver chats with Quickzy support. Several chats are allowed; each stays until resolved.
export const SupportChat: React.FC<SupportChatProps> = ({ email, mode }) => {
  const [open, setOpen] = useState(false);
  const [threads, setThreads] = useState<SupportThread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [composingNew, setComposingNew] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  const active = threads.find((t) => t.id === activeId) || null;
  const showing = mode === 'page' || open;

  useEffect(() => {
    if (!showing) return;
    return subscribeToMyThreads(email, setThreads);
  }, [showing, email]);

  useEffect(() => {
    if (!activeId) return;
    return subscribeToMessages(activeId, setMessages);
  }, [activeId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const startNew = () => {
    setActiveId(null);
    setMessages([]);
    setComposingNew(true);
    setError('');
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setError('');
    try {
      if (composingNew || !active) {
        const id = await createSupportThread(email, text);
        setComposingNew(false);
        setActiveId(id);
      } else {
        await sendSupportMessage(active, 'customer', email, text);
      }
      setDraft('');
    } catch (err: any) {
      setError(err?.message || 'Message could not be sent. Check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  const showThread = active || composingNew;

  const body = (
    <>
      {!showThread ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <button
            type="button"
            onClick={startNew}
            className="w-full min-h-[48px] rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-sm flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Start a new chat
          </button>
          {threads.length === 0 && <p className="text-xs text-neutral-500 text-center py-6">You have no chats yet.</p>}
          {threads.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveId(t.id)}
              className="w-full text-left p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700"
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-white truncate">{t.subject}</span>
                <span className={`text-[10px] font-bold shrink-0 ${t.status === 'resolved' ? 'text-neutral-500' : 'text-emerald-400'}`}>
                  {t.status === 'resolved' ? 'Resolved' : 'Open'}
                </span>
              </span>
              <span className="block text-[11px] text-neutral-400 truncate mt-1">{t.lastMessage}</span>
            </button>
          ))}
        </div>
      ) : (
        <>
          <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-2">
            {messages.length === 0 && (
              <p className="text-xs text-neutral-500 text-center py-6">Tell us what happened with your order or delivery.</p>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.from === 'customer' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs whitespace-pre-wrap ${m.from === 'customer' ? 'bg-emerald-500 text-neutral-950' : 'bg-neutral-800 text-neutral-100'}`}>
                  {m.from === 'admin' && <span className="block text-[10px] font-bold opacity-70">Quickzy support</span>}
                  {m.text}
                </div>
              </div>
            ))}
            {active?.status === 'resolved' && (
              <p className="text-[11px] text-emerald-400 flex items-center justify-center gap-1.5 pt-2">
                <CheckCircle2 className="w-3.5 h-3.5" /> Support marked this resolved. Send a message to reopen it.
              </p>
            )}
          </div>
          {error && <p className="px-4 text-xs text-red-400">{error}</p>}
          <form onSubmit={send} className="p-3 border-t border-neutral-800 flex gap-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={composingNew ? 'Describe your issue' : 'Type your message'}
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
        </>
      )}
    </>
  );

  const title = showThread ? (active?.subject || 'New chat') : 'Your chats';

  const header = (
    <div className="flex items-center gap-2 px-3 py-3 border-b border-neutral-800">
      {showThread && (
        <button
          type="button"
          onClick={() => {
            setActiveId(null);
            setComposingNew(false);
            setError('');
          }}
          aria-label="Back to chats"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-neutral-300 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-white truncate">{title}</p>
        <p className="text-[11px] text-neutral-400">We usually reply within the hour.</p>
      </div>
      {mode === 'floating' && (
        <button type="button" onClick={() => setOpen(false)} aria-label="Close chat" className="min-h-[44px] min-w-[44px] flex items-center justify-center text-neutral-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );

  if (mode === 'page') {
    return (
      <div className="flex flex-col h-[calc(100dvh-9rem)] min-h-[420px] max-w-2xl mx-auto w-full bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
        {header}
        {body}
      </div>
    );
  }

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
      {open && (
        <div className="hidden lg:flex fixed right-6 bottom-6 z-50 flex-col w-96 h-[30rem] bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl overflow-hidden">
          {header}
          {body}
        </div>
      )}
    </>
  );
};

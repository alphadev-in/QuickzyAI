import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// One support thread per user, keyed by their email: support_threads/{email}
// Messages live in support_threads/{email}/messages. Admin replies with from = 'admin'.
export type SupportStatus = 'open' | 'resolved';
export type SupportSender = 'customer' | 'admin';

export interface SupportThread {
  id: string;
  ownerEmail: string;
  status: SupportStatus;
  lastMessage: string;
  lastFrom: SupportSender;
  updatedAt: string;
}

export interface SupportMessage {
  id: string;
  from: SupportSender;
  authorEmail: string;
  text: string;
  createdAt: string;
}

const toIso = (value: unknown) => {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  return typeof value === 'string' ? value : new Date().toISOString();
};

export function subscribeToThread(email: string, onChange: (thread: SupportThread | null) => void): () => void {
  const key = email.toLowerCase();
  return onSnapshot(doc(db, 'support_threads', key), (snap) => {
    if (!snap.exists()) return onChange(null);
    const d = snap.data();
    onChange({
      id: snap.id,
      ownerEmail: d.ownerEmail,
      status: d.status || 'open',
      lastMessage: d.lastMessage || '',
      lastFrom: d.lastFrom || 'customer',
      updatedAt: toIso(d.updatedAt),
    });
  }, (err) => console.warn('Support thread listener failed:', err));
}

export function subscribeToMessages(email: string, onChange: (messages: SupportMessage[]) => void): () => void {
  const q = query(collection(db, 'support_threads', email.toLowerCase(), 'messages'), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SupportMessage, 'id' | 'createdAt'>), createdAt: toIso(d.data().createdAt) })));
  }, (err) => console.warn('Support messages listener failed:', err));
}

// Admin: all threads, most recent first
export function subscribeToAllThreads(onChange: (threads: SupportThread[]) => void): () => void {
  return onSnapshot(collection(db, 'support_threads'), (snap) => {
    const threads = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ownerEmail: data.ownerEmail || d.id,
        status: (data.status || 'open') as SupportStatus,
        lastMessage: data.lastMessage || '',
        lastFrom: (data.lastFrom || 'customer') as SupportSender,
        updatedAt: toIso(data.updatedAt),
      };
    });
    onChange(threads.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
  }, (err) => console.warn('Support inbox listener failed:', err));
}

export async function sendSupportMessage(
  threadEmail: string,
  from: SupportSender,
  authorEmail: string,
  text: string
): Promise<void> {
  const key = threadEmail.toLowerCase();
  const trimmed = text.trim();
  if (!trimmed) return;
  const now = new Date().toISOString();
  await addDoc(collection(db, 'support_threads', key, 'messages'), {
    from,
    authorEmail: authorEmail.toLowerCase(),
    text: trimmed.slice(0, 2000),
    createdAt: now,
  });
  await setDoc(
    doc(db, 'support_threads', key),
    {
      ownerEmail: key,
      // A customer's new message reopens a resolved thread
      status: from === 'customer' ? 'open' : undefined,
      lastMessage: trimmed.slice(0, 200),
      lastFrom: from,
      updatedAt: now,
    },
    { merge: true }
  );
}

export async function setSupportStatus(threadEmail: string, status: SupportStatus): Promise<void> {
  await updateDoc(doc(db, 'support_threads', threadEmail.toLowerCase()), { status, updatedAt: new Date().toISOString() });
}

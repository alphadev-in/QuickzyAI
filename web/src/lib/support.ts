import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  orderBy,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// support_threads/{threadId}: one document per chat. ownerEmail is the customer or driver.
// Messages live in support_threads/{threadId}/messages with ownerEmail copied onto each message
// so the Firestore rules can check it without extra reads.
export type SupportStatus = 'open' | 'resolved';
export type SupportSender = 'customer' | 'admin';

export interface SupportThread {
  id: string;
  ownerEmail: string;
  subject: string;
  status: SupportStatus;
  lastMessage: string;
  lastFrom: SupportSender;
  updatedAt: string;
  createdAt: string;
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

const toThread = (id: string, d: Record<string, any>): SupportThread => ({
  id,
  ownerEmail: d.ownerEmail || '',
  subject: d.subject || 'Support request',
  status: (d.status || 'open') as SupportStatus,
  lastMessage: d.lastMessage || '',
  lastFrom: (d.lastFrom || 'customer') as SupportSender,
  updatedAt: toIso(d.updatedAt),
  createdAt: toIso(d.createdAt),
});

// The signed-in user's own chats (newest first, sorted in the app to avoid a composite index)
export function subscribeToMyThreads(email: string, onChange: (threads: SupportThread[]) => void): () => void {
  const q = query(collection(db, 'support_threads'), where('ownerEmail', '==', email.toLowerCase()));
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => toThread(d.id, d.data())).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))),
    (err) => console.warn('Support threads listener failed:', err)
  );
}

// Admin: every chat, newest first
export function subscribeToAllThreads(onChange: (threads: SupportThread[]) => void): () => void {
  return onSnapshot(
    collection(db, 'support_threads'),
    (snap) => onChange(snap.docs.map((d) => toThread(d.id, d.data())).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))),
    (err) => console.warn('Support inbox listener failed:', err)
  );
}

export function subscribeToMessages(threadId: string, onChange: (messages: SupportMessage[]) => void): () => void {
  const q = query(collection(db, 'support_threads', threadId, 'messages'), orderBy('createdAt', 'asc'));
  return onSnapshot(
    q,
    (snap) =>
      onChange(
        snap.docs.map((d) => {
          const data = d.data();
          return { id: d.id, from: data.from, authorEmail: data.authorEmail, text: data.text, createdAt: toIso(data.createdAt) };
        })
      ),
    (err) => console.warn('Support messages listener failed:', err)
  );
}

// Starts a new chat with its first message. Returns the new thread id.
export async function createSupportThread(ownerEmail: string, firstMessage: string): Promise<string> {
  const owner = ownerEmail.toLowerCase();
  const text = firstMessage.trim();
  const now = new Date().toISOString();
  const ref = await addDoc(collection(db, 'support_threads'), {
    ownerEmail: owner,
    subject: text.slice(0, 80),
    status: 'open',
    lastMessage: text.slice(0, 200),
    lastFrom: 'customer',
    createdAt: now,
    updatedAt: now,
  });
  await addDoc(collection(db, 'support_threads', ref.id, 'messages'), {
    ownerEmail: owner,
    from: 'customer',
    authorEmail: owner,
    text: text.slice(0, 2000),
    createdAt: now,
  });
  return ref.id;
}

export async function sendSupportMessage(
  thread: Pick<SupportThread, 'id' | 'ownerEmail'>,
  from: SupportSender,
  authorEmail: string,
  text: string
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;
  const now = new Date().toISOString();
  await addDoc(collection(db, 'support_threads', thread.id, 'messages'), {
    ownerEmail: thread.ownerEmail.toLowerCase(),
    from,
    authorEmail: authorEmail.toLowerCase(),
    text: trimmed.slice(0, 2000),
    createdAt: now,
  });
  await setDoc(
    doc(db, 'support_threads', thread.id),
    {
      // A customer's new message reopens a resolved chat
      status: from === 'customer' ? 'open' : undefined,
      lastMessage: trimmed.slice(0, 200),
      lastFrom: from,
      updatedAt: now,
    },
    { merge: true }
  );
}

export async function setSupportStatus(threadId: string, status: SupportStatus): Promise<void> {
  await updateDoc(doc(db, 'support_threads', threadId), { status, updatedAt: new Date().toISOString() });
}

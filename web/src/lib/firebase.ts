import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBeuUHB43t5yVs5KbzJ3iqZ0nxgy1XMQx4",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "allshoplocaluk.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "allshoplocaluk",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "allshoplocaluk.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "980182296141",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:980182296141:web:f61471ea6cfd455ad1de04",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-0CLKT4Z35Y",
};

// Initialize Firebase client safely on Next.js
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// Optional fields are often undefined (e.g. bulkImportId, restrictedCategory). By default Firestore rejects
// the whole write when it sees undefined, so orders silently never reached the database. Ignore them instead.
// initializeFirestore throws if it already ran (hot reload), so fall back to the existing instance.
function createFirestore() {
  try {
    return initializeFirestore(app, { ignoreUndefinedProperties: true });
  } catch {
    return getFirestore(app);
  }
}
export const db = createFirestore();
export const auth = getAuth(app);

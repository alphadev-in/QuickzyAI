import type { Analytics } from 'firebase/analytics';
import { app } from './firebase';

let analyticsPromise: Promise<Analytics | null> | null = null;

// Loads Firebase Analytics once. Only call after the visitor has accepted analytics cookies.
// Resolves null where analytics is not supported (for example some privacy browsers or server rendering).
export function startAnalytics(): Promise<Analytics | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (!analyticsPromise) {
    analyticsPromise = import('firebase/analytics').then(async ({ getAnalytics, isSupported }) => {
      if (!(await isSupported())) return null;
      return getAnalytics(app);
    });
  }
  return analyticsPromise;
}

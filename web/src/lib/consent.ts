// Cookie consent (UK GDPR / PECR). The choice is stored in a first-party cookie for 12 months.
// Analytics is loaded only after the visitor accepts; nothing is sent to Google Analytics before that.

export const CONSENT_COOKIE = 'quickzy_consent';
export type ConsentChoice = 'accepted' | 'rejected';

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function getConsent(): ConsentChoice | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=(accepted|rejected)`));
  return match ? (match[1] as ConsentChoice) : null;
}

export function setConsent(choice: ConsentChoice): void {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${CONSENT_COOKIE}=${choice}; max-age=${ONE_YEAR_SECONDS}; path=/; SameSite=Lax${secure}`;
}

export function clearConsent(): void {
  document.cookie = `${CONSENT_COOKIE}=; max-age=0; path=/; SameSite=Lax`;
}

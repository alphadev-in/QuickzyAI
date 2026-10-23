import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Privacy Policy',
  description: 'How Quickzy collects, uses and protects personal data for London same-day courier bookings.',
  path: '/privacy',
});

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

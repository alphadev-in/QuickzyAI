import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Terms of Service',
  description: 'Terms of service for Quickzy same-day London courier bookings, payments and deliveries.',
  path: '/terms',
});

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

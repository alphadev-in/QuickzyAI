import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Business Onboarding',
  description: 'Set up a business account with Quickzy for same-day London pharmacy, food and parcel deliveries and bulk CSV imports.',
  path: '/onboarding',
});

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

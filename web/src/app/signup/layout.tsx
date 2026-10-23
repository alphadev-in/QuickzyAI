import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Create a Free Account',
  description: 'Create a free Quickzy account to book same-day London deliveries, save addresses and track orders.',
  path: '/signup',
});

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

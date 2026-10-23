import { pageMetadata } from '@/lib/seo';

// Internal console: keep it out of search results
export const metadata = pageMetadata({
  title: 'Admin Console',
  description: 'Quickzy internal operations console.',
  path: '/admin',
  noIndex: true,
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

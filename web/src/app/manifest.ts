import type { MetadataRoute } from 'next';

// Web app manifest: lets customers and drivers install Quickzy to their home screen
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Quickzy | Same-Day London Courier',
    short_name: 'Quickzy',
    description: 'Same-day London delivery for pharmacy, food and parcels.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#09090b',
    theme_color: '#10b981',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}

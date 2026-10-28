import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  // Old service URLs (in search results and old links) move to live location pages
  async redirects() {
    return [
      { source: "/services/pharmacy-delivery", destination: "/locations/city-of-london/pharmacy", permanent: true },
      { source: "/services/food-groceries", destination: "/locations/shoreditch/food", permanent: true },
      { source: "/services/parcel-courier", destination: "/locations/canary-wharf/parcel", permanent: true },
      { source: "/services/:path*", destination: "/locations", permanent: true },
    ];
  },
};

export default nextConfig;

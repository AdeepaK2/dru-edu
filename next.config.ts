import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    TZ: 'Australia/Melbourne',
  },
  // Configure for Firebase hosting
  output: 'standalone',
  experimental: {
    // Enable server components
    serverComponentsExternalPackages: ['firebase-admin'],
  },
};

export default nextConfig;

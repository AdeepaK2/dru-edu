import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    TZ: 'Australia/Melbourne',
  },
  // Configure for Firebase hosting
  output: 'standalone',
  // Move serverComponentsExternalPackages to root level
  serverExternalPackages: ['firebase-admin'],
  // Performance optimizations
  poweredByHeader: false,
  // Enable compression
  compress: true,
  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
  },
  // swcMinify is enabled by default in Next.js 15
};

export default nextConfig;

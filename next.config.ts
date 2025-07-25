import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    TZ: 'Australia/Melbourne',
  },
  // Conditional configuration based on environment
  ...(process.env.NODE_ENV === 'production' && process.env.FIREBASE_DEPLOY === 'true' 
    ? {
        // Static export for Firebase hosting deployment
        output: 'export',
        trailingSlash: true,
        images: {
          unoptimized: true,
        },
      }
    : {
        // Development configuration with API routes
        output: 'standalone',
        images: {
          formats: ['image/webp', 'image/avif'],
          deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
          imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        },
      }
  ),
  // Move serverComponentsExternalPackages to root level
  serverExternalPackages: ['firebase-admin'],
  // Performance optimizations
  poweredByHeader: false,
  compress: true,
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@/components/ui'],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  // Custom webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Optimize for teacher dashboard
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // Split chunks for better caching
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: -10,
          chunks: 'all',
        },
        teacher: {
          test: /[\\/]src[\\/](app[\\/]teacher|components[\\/]teacher)[\\/]/,
          name: 'teacher',
          priority: 10,
          chunks: 'all',
        },
        ui: {
          test: /[\\/]src[\\/]components[\\/]ui[\\/]/,
          name: 'ui',
          priority: 20,
          chunks: 'all',
        },
      },
    };

    // Completely disable minification to avoid the plugin error in development
    if (dev) {
      config.optimization.minimize = false;
    }
    
    return config;
  },
};

export default nextConfig;

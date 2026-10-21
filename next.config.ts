import type { NextConfig } from "next";

const BACKEND_INTERNAL_URL = (
  process.env.BACKEND_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'http://localhost:5000'
).replace(/\/$/, '');

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.106', 'localhost:3000'],
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: `${BACKEND_INTERNAL_URL}/api/auth/:path*`,
      },
      {
        source: '/api/admin/users/:path*',
        destination: `${BACKEND_INTERNAL_URL}/api/admin/users/:path*`,
      },
      {
        source: '/api/health',
        destination: `${BACKEND_INTERNAL_URL}/api/health`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
    ],
  },
};

export default nextConfig;

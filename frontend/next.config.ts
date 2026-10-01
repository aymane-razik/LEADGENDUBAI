import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  async rewrites() {
    const backendOrigin = process.env.BACKEND_ORIGIN ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';
    return [{ source: '/api/:path*', destination: `${backendOrigin.replace(/\/$/, '')}/api/:path*` }];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },
};

export default nextConfig;

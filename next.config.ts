// next.config.ts
import { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images from Spotify’s CDN
  images: {
    domains: ["i.scdn.co"],
  },

  // Let production builds succeed even if ESLint finds issues
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

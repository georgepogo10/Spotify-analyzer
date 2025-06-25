// next.config.ts
import { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images from Spotify’s CDN
  images: {
    domains: ["i.scdn.co"],
  },

  // (Keep any other settings you already had)
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    allowedDevOrigins: ["http://127.0.0.1:3000", "http://localhost:3000"],
  },
};

export default nextConfig;

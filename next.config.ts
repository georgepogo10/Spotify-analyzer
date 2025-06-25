// next.config.ts
import { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Allow production builds to complete even if there are ESLint errors
    ignoreDuringBuilds: true,
  },
  experimental: {
    allowedDevOrigins: [
      "http://127.0.0.1:3000",
      "http://localhost:3000"
    ],
  },
};

export default nextConfig;

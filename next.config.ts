// next.config.ts
import { NextConfig } from "next";

const nextConfig: NextConfig = {
  // your existing settings...
  experimental: {
    allowedDevOrigins: [
      "http://127.0.0.1:3000",
      "http://localhost:3000"
    ],
  },
};

export default nextConfig;

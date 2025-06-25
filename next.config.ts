// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Allow production builds to succeed even with ESLint errors
    ignoreDuringBuilds: true,
  },
  experimental: {
    allowedDevOrigins: [
      "http://127.0.0.1:3000",
      "http://localhost:3000"
    ],
  },
};

module.exports = nextConfig;

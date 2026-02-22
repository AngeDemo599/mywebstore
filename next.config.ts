import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "**.alicdn.com",
      },
      {
        protocol: "https",
        hostname: "**.aliexpress.com",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "**.fbcdn.net",
      },
    ],
  },
};

export default nextConfig;

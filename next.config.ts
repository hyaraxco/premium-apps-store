import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // React <ViewTransition> shared-element morph (card → PDP)
    viewTransition: true,
  },
};

export default nextConfig;

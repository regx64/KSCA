import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every page here reads the Supabase session cookie (per-user RLS results),
  // so Cache Components' static-shell model buys nothing; pages render
  // dynamically per request instead.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

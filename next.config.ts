import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Fix "inferred workspace root" warning by explicitly setting the root
    root: path.resolve(__dirname),
  },
};

export default nextConfig;

import type { NextConfig } from "next";
import path from 'path';

const nextConfig: NextConfig & { turbopack?: { root?: string } } = {
  output: 'standalone',
  turbopack: {
    root: path.resolve(__dirname)
  }
};

export default nextConfig;

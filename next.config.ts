import type { NextConfig } from "next";

// Explicitly set Turbopack root to this project directory so Next doesn't infer the workspace root
// (silences the warning when multiple lockfiles exist on the machine)
const nextConfig: NextConfig & { turbopack?: { root?: string } } = {
  /* config options here */
  turbopack: {
    // Use '.' to point to the directory containing this config (project root)
    root: '.'
  }
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['rehype-highlight', 'rehype-katex', 'remark-math', 'remark-gfm'],
};

export default nextConfig;

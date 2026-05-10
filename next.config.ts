import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep pdf-parse and mammoth out of the webpack bundle so they can use
  // native Node.js APIs (fs, Buffer) in Vercel serverless functions.
  serverExternalPackages: ["mammoth"],
};

export default nextConfig;

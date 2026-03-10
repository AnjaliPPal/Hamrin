import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Use this directory as workspace root (avoids multiple lockfiles warning)
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;

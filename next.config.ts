import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "zyntex-bucket.s3.sa-east-1.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "xmerchan-files.s3.sa-east-1.amazonaws.com",
        pathname: "/**",
      },
    ],
    minimumCacheTTL: 60 * 10,
  },
};

export default nextConfig;

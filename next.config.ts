import type { NextConfig } from "next";

const backendApiUrl =
  process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || "";

const normalizedBackendApiUrl = backendApiUrl
  ? backendApiUrl.endsWith("/api")
    ? backendApiUrl
    : `${backendApiUrl}/api`
  : "";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "zyntex-bucket.s3.sa-east-1.amazonaws.com",
        pathname: "/**",
      },
    ],
    minimumCacheTTL: 60 * 10,
  },
  async rewrites() {
    if (!normalizedBackendApiUrl) {
      return [];
    }

    return [
      {
        source: "/api/:path*",
        destination: `${normalizedBackendApiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;

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

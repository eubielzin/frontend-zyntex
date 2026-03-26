export function buildApiUrl(path = "") {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (!baseUrl) {
    return normalizedPath;
  }

  const normalizedBaseUrl = baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;

  return `${normalizedBaseUrl}${normalizedPath}`;
}

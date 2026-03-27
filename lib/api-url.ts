export function buildApiUrl(path = "") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const apiPath = `/api${normalizedPath}`;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";

  if (!baseUrl) {
    return apiPath;
  }

  if (
    typeof window !== "undefined" &&
    (window.location.protocol === "https:" || baseUrl.startsWith("http://"))
  ) {
    return apiPath;
  }

  const normalizedBaseUrl = baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;

  return `${normalizedBaseUrl}${normalizedPath}`;
}

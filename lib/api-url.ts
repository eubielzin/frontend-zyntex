export function buildApiUrl(path = "") {
  const base = process.env.NEXT_PUBLIC_API_URL || "";
  const normalizedBase = base.endsWith("/api") ? base : `${base}/api`;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${normalizedBase}${normalizedPath}`;
}

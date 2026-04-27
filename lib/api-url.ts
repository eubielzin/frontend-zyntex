export function buildApiUrl(path = "") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  const apiPath = `/api${normalizedPath}`
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || ""

  if (!baseUrl) {
    return apiPath
  }

  const normalizedBaseUrl = baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`

  if (typeof window === "undefined") {
    return `${normalizedBaseUrl}${normalizedPath}`
  }

  const isSecurePage = window.location.protocol === "https:"
  const isInsecureApi = normalizedBaseUrl.startsWith("http://")

  if (isSecurePage && isInsecureApi) {
    return apiPath
  }

  return `${normalizedBaseUrl}${normalizedPath}`
}

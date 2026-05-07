import { cookies } from "next/headers"

export const AUTH_COOKIE_NAME = "token"

export function normalizeAuthToken(token?: string | null) {
  const normalizedToken = token?.trim() || ""

  if (!normalizedToken) {
    return null
  }

  return normalizedToken.replace(/^Bearer\s+/i, "").trim()
}

export function buildAuthorizationHeader(token?: string | null) {
  const normalizedToken = normalizeAuthToken(token)

  if (!normalizedToken) {
    return null
  }

  return `Bearer ${normalizedToken}`
}

export async function getAuthToken() {
  const cookieStore = await cookies()
  return normalizeAuthToken(cookieStore.get(AUTH_COOKIE_NAME)?.value) || null
}

export async function isAuthenticated() {
  const token = await getAuthToken()
  return Boolean(token)
}

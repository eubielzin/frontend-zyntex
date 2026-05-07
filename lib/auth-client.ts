"use client"

const AUTH_STORAGE_KEY = "auth_token"
const AUTH_USER_STORAGE_KEY = "auth_user"
const DEFAULT_MAX_AGE = 60 * 60 * 8
const REMEMBER_ME_MAX_AGE = 60 * 60 * 24 * 30

export interface StoredAuthUser {
  username: string
  email?: string | null
  role?: string | null
}

export function normalizeClientToken(token?: string | null) {
  const normalizedToken = token?.trim() || ""

  if (!normalizedToken) {
    return null
  }

  return normalizedToken.replace(/^Bearer\s+/i, "").trim()
}

export function getStoredAuthToken() {
  if (typeof window === "undefined") {
    return null
  }

  const cookieToken = normalizeClientToken(getCookieValue(AUTH_STORAGE_KEY))

  if (cookieToken) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    return cookieToken
  }

  const legacyToken = normalizeClientToken(window.localStorage.getItem(AUTH_STORAGE_KEY))

  if (!legacyToken) {
    return null
  }

  writeCookie(AUTH_STORAGE_KEY, legacyToken, DEFAULT_MAX_AGE)
  window.localStorage.removeItem(AUTH_STORAGE_KEY)
  return legacyToken
}

export function storeAuthToken(token?: string | null, rememberMe = false) {
  if (typeof window === "undefined") {
    return null
  }

  const normalizedToken = normalizeClientToken(token)

  if (!normalizedToken) {
    clearCookie(AUTH_STORAGE_KEY)
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }

  writeCookie(
    AUTH_STORAGE_KEY,
    normalizedToken,
    rememberMe ? REMEMBER_ME_MAX_AGE : DEFAULT_MAX_AGE
  )
  window.localStorage.removeItem(AUTH_STORAGE_KEY)
  return normalizedToken
}

export function getStoredAuthUser(): StoredAuthUser | null {
  if (typeof window === "undefined") {
    return null
  }

  const rawValue = getCookieValue(AUTH_USER_STORAGE_KEY)

  if (!rawValue) {
    return null
  }

  try {
    const parsedValue = JSON.parse(rawValue) as StoredAuthUser

    if (!parsedValue?.username) {
      return null
    }

    return parsedValue
  } catch {
    return null
  }
}

export function storeAuthUser(user?: StoredAuthUser | null, rememberMe = false) {
  if (typeof window === "undefined") {
    return null
  }

  if (!user?.username?.trim()) {
    clearCookie(AUTH_USER_STORAGE_KEY)
    return null
  }

  const normalizedUser: StoredAuthUser = {
    username: user.username.trim(),
    email: user.email?.trim() || "",
    role: user.role?.trim() || "",
  }

  writeCookie(
    AUTH_USER_STORAGE_KEY,
    JSON.stringify(normalizedUser),
    rememberMe ? REMEMBER_ME_MAX_AGE : DEFAULT_MAX_AGE
  )

  return normalizedUser
}

export function clearStoredAuthToken() {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY)
  clearCookie(AUTH_STORAGE_KEY)
}

export function clearStoredAuthUser() {
  if (typeof window === "undefined") {
    return
  }

  clearCookie(AUTH_USER_STORAGE_KEY)
}

export function buildClientAuthorizationHeader(token?: string | null) {
  const normalizedToken = normalizeClientToken(token)

  if (!normalizedToken) {
    return null
  }

  return `Bearer ${normalizedToken}`
}

function getCookieValue(name: string) {
  if (typeof document === "undefined") {
    return null
  }

  const cookiePrefix = `${encodeURIComponent(name)}=`
  const cookieEntry = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(cookiePrefix))

  if (!cookieEntry) {
    return null
  }

  return decodeURIComponent(cookieEntry.slice(cookiePrefix.length))
}

function writeCookie(name: string, value: string, maxAge: number) {
  if (typeof document === "undefined") {
    return
  }

  const secureAttribute = window.location.protocol === "https:" ? "; Secure" : ""
  document.cookie =
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secureAttribute}`
}

function clearCookie(name: string) {
  if (typeof document === "undefined") {
    return
  }

  const secureAttribute = window.location.protocol === "https:" ? "; Secure" : ""
  document.cookie =
    `${encodeURIComponent(name)}=; Path=/; Max-Age=0; SameSite=Lax${secureAttribute}`
}

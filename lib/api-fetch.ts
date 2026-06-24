"use client"

import { buildClientAuthorizationHeader, getStoredAuthToken } from "./auth-client"
import { buildApiUrl } from "./api-url"

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = path.startsWith("http") || path.startsWith("/api") ? path : buildApiUrl(path)
  const authHeader = buildClientAuthorizationHeader(getStoredAuthToken())

  const headers = new Headers(options.headers as HeadersInit)

  if (!headers.has("Content-Type") && options.body !== undefined) {
    headers.set("Content-Type", "application/json")
  }

  if (authHeader) {
    headers.set("Authorization", authHeader)
  }

  return fetch(url, { ...options, headers })
}

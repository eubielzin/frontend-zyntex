"use client"

import { useEffect } from "react"

import {
  buildClientAuthorizationHeader,
  getStoredAuthToken,
} from "@/lib/auth-client"

declare global {
  interface Window {
    __zyntexAuthFetchPatched?: boolean
  }
}

const isApiRequest = (url: string) => {
  if (!url) {
    return false
  }

  if (url.startsWith("/api/")) {
    return true
  }

  if (typeof window === "undefined") {
    return false
  }

  return url.startsWith(`${window.location.origin}/api/`)
}

export function AuthBootstrap() {
  useEffect(() => {
    if (typeof window === "undefined" || window.__zyntexAuthFetchPatched) {
      return
    }

    const originalFetch = window.fetch.bind(window)

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url

      if (!isApiRequest(requestUrl)) {
        return originalFetch(input, init)
      }

      const authHeader = buildClientAuthorizationHeader(getStoredAuthToken())

      if (!authHeader) {
        return originalFetch(input, init)
      }

      if (input instanceof Request) {
        if (input.headers.get("Authorization")) {
          return originalFetch(input, init)
        }

        const headers = new Headers(input.headers)
        headers.set("Authorization", authHeader)

        return originalFetch(
          new Request(input, {
            headers,
          }),
          init
        )
      }

      const headers = new Headers(init?.headers)

      if (!headers.has("Authorization")) {
        headers.set("Authorization", authHeader)
      }

      return originalFetch(input, {
        ...init,
        credentials: init?.credentials ?? "include",
        headers,
      })
    }

    window.__zyntexAuthFetchPatched = true
  }, [])

  return null
}

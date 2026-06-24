import { NextRequest, NextResponse } from "next/server"

import {
  AUTH_COOKIE_NAME,
  buildAuthorizationHeader,
  normalizeAuthToken,
} from "@/lib/auth"

const getBackendBaseUrl = () => {
  const backendBaseUrl =
    process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || ""

  if (!backendBaseUrl) {
    throw new Error("BACKEND_API_URL nao configurada")
  }

  return backendBaseUrl.endsWith("/api")
    ? backendBaseUrl
    : `${backendBaseUrl}/api`
}

const buildBackendUrl = (path: string[], request: Request) => {
  const url = new URL(request.url)
  return `${getBackendBaseUrl()}/${path.join("/")}${url.search}`
}

const CLIENT_TOKEN_COOKIE = "auth_token"

const readAuthToken = (request: NextRequest): string | null => {
  // 1. Token já enviado explicitamente pelo cliente no header
  const incomingAuth = request.headers.get("authorization")
  if (incomingAuth) return normalizeAuthToken(incomingAuth)

  // 2. Cookie HttpOnly definido pelo servidor no login
  const serverCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value
  if (serverCookie) return normalizeAuthToken(serverCookie)

  // 3. Cookie não-HttpOnly definido pelo cliente após login
  const clientCookie = request.cookies.get(CLIENT_TOKEN_COOKIE)?.value
  if (clientCookie) return normalizeAuthToken(decodeURIComponent(clientCookie))

  return null
}

const buildForwardHeaders = (request: NextRequest) => {
  const headers = new Headers()
  const authToken = readAuthToken(request)
  const allowedHeaders = new Set([
    "accept",
    "accept-language",
    "content-type",
    "if-match",
    "if-none-match",
    "range",
  ])

  request.headers.forEach((value, key) => {
    const normalizedKey = key.toLowerCase()

    if (!allowedHeaders.has(normalizedKey)) {
      return
    }

    headers.set(key, value)
  })

  if (authToken) {
    const authorizationHeader = buildAuthorizationHeader(authToken)
    if (authorizationHeader) {
      headers.set("Authorization", authorizationHeader)
    }
  }

  return {
    headers,
    hasAuthToken: Boolean(authToken),
  }
}

const proxyRequest = async (
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) => {
  try {
    const { path } = await context.params
    const { headers, hasAuthToken } = buildForwardHeaders(request)
    const backendUrl = buildBackendUrl(path, request)
    const method = request.method.toUpperCase()
    const shouldSendBody = !["GET", "HEAD"].includes(method)

    const backendResponse = await fetch(backendUrl, {
      method,
      headers,
      body: shouldSendBody ? await request.arrayBuffer() : undefined,
      cache: "no-store",
    })

    const responseHeaders = new Headers()
    backendResponse.headers.forEach((value, key) => {
      if (key.toLowerCase() === "content-encoding") {
        return
      }

      responseHeaders.set(key, value)
    })

    if (process.env.NODE_ENV !== "production") {
      responseHeaders.set("x-auth-cookie-present", hasAuthToken ? "true" : "false")
    }

    return new NextResponse(backendResponse.body, {
      status: backendResponse.status,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error("Erro ao fazer proxy da API:", error)

    return NextResponse.json(
      { message: "Erro ao conectar com o backend" },
      { status: 500 }
    )
  }
}

export const GET = proxyRequest
export const POST = proxyRequest
export const PUT = proxyRequest
export const PATCH = proxyRequest
export const DELETE = proxyRequest

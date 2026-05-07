import { NextResponse } from "next/server"

import { AUTH_COOKIE_NAME, normalizeAuthToken } from "@/lib/auth"

const getBackendLoginUrl = () => {
  const backendBaseUrl =
    process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || ""

  if (!backendBaseUrl) {
    throw new Error("BACKEND_API_URL nao configurada")
  }

  const normalizedBaseUrl = backendBaseUrl.endsWith("/api")
    ? backendBaseUrl
    : `${backendBaseUrl}/api`

  return `${normalizedBaseUrl}/auth/login`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const rememberMe = Boolean(body?.rememberMe)

    const response = await fetch(getBackendLoginUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: body?.username,
        password: body?.password,
      }),
      cache: "no-store",
    })

    const responseData = await response.json().catch(() => null)

    if (!response.ok) {
      return NextResponse.json(
        {
          message:
            responseData?.message ||
            responseData?.error ||
            "Usuario ou senha invalidos",
        },
        { status: response.status }
      )
    }

    const token =
      responseData?.token ||
      responseData?.accessToken ||
      responseData?.access_token

    const normalizedToken = normalizeAuthToken(token)

    if (!normalizedToken) {
      return NextResponse.json(
        { message: "Token nao retornado pela autenticacao" },
        { status: 401 }
      )
    }

    const nextResponse = NextResponse.json({
      ...responseData,
      authenticated: true,
      token: normalizedToken,
    })

    nextResponse.cookies.set(AUTH_COOKIE_NAME, normalizedToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 8,
    })

    return nextResponse
  } catch (error) {
    console.error("Erro ao autenticar login:", error)

    return NextResponse.json(
      { message: "Erro ao conectar com o servidor" },
      { status: 500 }
    )
  }
}

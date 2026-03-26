import { NextRequest } from "next/server";

const METHODS_WITHOUT_BODY = new Set(["GET", "HEAD"]);

function getBackendBaseUrl() {
  const baseUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || "";

  if (!baseUrl) {
    throw new Error("BACKEND_API_URL ou NEXT_PUBLIC_API_URL não configurada");
  }

  return baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;
}

async function forwardRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const backendPath = path.join("/");
  const backendUrl = `${getBackendBaseUrl()}/${backendPath}${request.nextUrl.search}`;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
    redirect: "manual",
  };

  if (!METHODS_WITHOUT_BODY.has(request.method)) {
    init.body = await request.text();
  }

  const response = await fetch(backendUrl, init);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return forwardRequest(request, context);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return forwardRequest(request, context);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return forwardRequest(request, context);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return forwardRequest(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return forwardRequest(request, context);
}

export async function OPTIONS(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return forwardRequest(request, context);
}

export async function HEAD(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return forwardRequest(request, context);
}

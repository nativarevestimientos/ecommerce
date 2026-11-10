import { NextResponse } from "next/server";
import crypto from "crypto";

function normalizeExternalBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, "");
  return trimmed.replace(/\/api$/, "");
}

function resolveExternalApiBase(): string {
  const fallback = "https://nativarevestimientos.vercel.app";
  const raw =
    (
      process.env.NEXT_PUBLIC_API_BASE ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      ""
    )
      .trim()
      .replace(/\/+$/, "");
  const candidate = raw || fallback;
  if (/^https?:\/\//i.test(candidate)) return normalizeExternalBaseUrl(candidate);
  if (candidate.startsWith("/")) return fallback;
  const protocol =
    candidate.includes(":") || !candidate.includes(".") ? "http" : "https";
  return normalizeExternalBaseUrl(`${protocol}://${candidate}`);
}

function buildSecurityHeaders(payload: string, method: "GET" | "PATCH" = "GET") {
  const apiKey = process.env.EXTERNAL_API_API_KEY || "";
  const sharedSecret = process.env.EXTERNAL_API_SHARED_SECRET || "";
  const serviceToken =
    process.env.EXTERNAL_API_SERVICE_TOKEN ||
    process.env.EXTERNAL_API_SERVICE_BEARER ||
    "";
  const timestamp = Date.now().toString();
  const bodyString = method === "GET" ? "" : payload;
  const signature = sharedSecret
    ? crypto.createHmac("sha256", sharedSecret).update(`${timestamp}:${bodyString}`).digest("hex")
    : "";

  return {
    "Content-Type": "application/json",
    ...(apiKey ? { "X-Api-Key": apiKey } : {}),
    ...(signature
      ? {
          "X-Request-Timestamp": timestamp,
          "X-Request-Signature": signature,
          "X-Request-Hash": "HMAC-SHA256",
        }
      : {}),
    ...(serviceToken ? { Authorization: `Bearer ${serviceToken}` } : {}),
  } as Record<string, string>;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    
    if (!orderId) {
      return NextResponse.json(
        { error: "ID de orden requerido" },
        { status: 400 }
      );
    }

    console.log('🔄 Obteniendo orden:', orderId);

    const reqUrl = new URL(request.url);
    const queryString = reqUrl.searchParams.toString();
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization') || '';

    // Enviar a la API externa para obtener la orden
    const base = resolveExternalApiBase();
    const apiBase = `${base}/api`;
    const fullUrl = `${apiBase}/orders/${encodeURIComponent(orderId)}`;
    
    console.log('🌐 Llamando a API externa:', fullUrl);
    
    const headers: Record<string, string> = {
      ...buildSecurityHeaders("", "GET"),
      ...(authHeader ? { Authorization: authHeader } : {}),
    };

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers,
    });

    console.log('📡 Respuesta de API externa:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error de API externa:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      throw new Error(`API externa respondió con ${response.status}: ${errorText}`);
    }

    const responseData = await response.json();
    
    console.log('✅ Orden obtenida:', responseData);

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('❌ Error al obtener orden:', error);
    
    return NextResponse.json(
      { 
        error: "Error al obtener orden",
        details: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;

    if (!orderId) {
      return NextResponse.json(
        { error: "ID de orden requerido" },
        { status: 400 }
      );
    }

    const patchData = await request.json().catch(() => null);
    if (!patchData || typeof patchData !== "object") {
      return NextResponse.json(
        { error: "Payload de actualización inválido" },
        { status: 400 }
      );
    }

    const authHeader =
      request.headers.get("authorization") ||
      request.headers.get("Authorization") ||
      "";
    const base = resolveExternalApiBase();
    const apiBase = `${base}/api`;
    const fullUrl = `${apiBase}/orders/${encodeURIComponent(orderId)}`;
    const rawBody = JSON.stringify(patchData);

    const headers: Record<string, string> = {
      ...buildSecurityHeaders(rawBody, "PATCH"),
      ...(authHeader ? { Authorization: authHeader } : {}),
    };

    const response = await fetch(fullUrl, {
      method: "PATCH",
      headers,
      body: rawBody,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(`API externa respondió con ${response.status}: ${errorText}`);
    }

    const responseData = await response.json().catch(() => null);
    return NextResponse.json(responseData ?? { success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Error al actualizar orden",
        details: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 500 }
    );
  }
}

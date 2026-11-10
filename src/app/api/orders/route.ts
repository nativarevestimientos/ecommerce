import { NextResponse } from "next/server";
import crypto from "crypto";

function normalizeExternalBaseUrl(raw: string): string {
  const trimmed = (raw || '').trim().replace(/\/+$/, "");
  return trimmed.replace(/\/api$/, "");
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId") || "";

    if (!userId) {
      return NextResponse.json(
        { error: "userId (email) requerido" },
        { status: 400 }
      );
    }

    // Base del backend externo (usar dominio vercel.app según guía)
    const externalApiUrl =
      process.env.NEXT_PUBLIC_API_BASE ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "https://nativarevestimientos.vercel.app";
    const base = normalizeExternalBaseUrl(externalApiUrl);
    const apiBase = `${base}/api`;
    const fullUrl = `${apiBase}/orders?userId=${encodeURIComponent(userId)}`;

    const apiKey = process.env.EXTERNAL_API_API_KEY || "";
    const sharedSecret = process.env.EXTERNAL_API_SHARED_SECRET || "";
    const serviceToken = process.env.EXTERNAL_API_SERVICE_TOKEN || "";

    const timestamp = Date.now().toString();
    const rawBody = "";
    const signaturePayload = `${timestamp}:${rawBody}`;
    const hmac = sharedSecret
      ? crypto.createHmac("sha256", sharedSecret).update(signaturePayload).digest("hex")
      : "";

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(apiKey ? { "X-Api-Key": apiKey } : {}),
      ...(timestamp ? { "X-Request-Timestamp": timestamp } : {}),
      ...(hmac ? { "X-Request-Hash": "HMAC-SHA256", "X-Request-Signature": hmac } : {}),
      ...(serviceToken ? { Authorization: `Bearer ${serviceToken}` } : {}),
    };

    const response = await fetch(fullUrl, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return NextResponse.json(
        { error: "Error al consultar órdenes", details: errorText || response.statusText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Error interno al obtener órdenes",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}

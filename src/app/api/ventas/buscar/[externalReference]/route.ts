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

export async function GET(
  request: Request,
  { params }: { params: { externalReference: string } }
) {
  try {
    const externalReference = params.externalReference;
    
    if (!externalReference) {
      return NextResponse.json(
        { error: "External reference requerido" },
        { status: 400 }
      );
    }

    console.log('🔍 Buscando venta por external reference:', externalReference);

    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization') || '';
    const base = resolveExternalApiBase();
    const fullUrl = `${base}/api/ventas/buscar/${encodeURIComponent(externalReference)}`;
    
    console.log('🌐 Llamando a API externa:', fullUrl);

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
      if (response.status === 404) {
        return NextResponse.json({
          success: false,
          message: "Venta no encontrada"
        });
      }
      
      const errorText = await response.text();
      console.error('❌ Error de API externa:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      return NextResponse.json({
        success: false,
        message: "No se pudo verificar venta existente",
        upstreamStatus: response.status,
      });
    }

    const responseData = await response.json();
    
    console.log('✅ Venta encontrada:', responseData);

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('❌ Error al buscar venta:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: "Error al buscar venta",
        details: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";

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
  if (/^https?:\/\//i.test(candidate)) {
    return candidate.replace(/\/api$/, "");
  }
  if (candidate.startsWith("/")) {
    return fallback;
  }
  const protocol =
    candidate.includes(":") || !candidate.includes(".") ? "http" : "https";
  return `${protocol}://${candidate}`.replace(/\/api$/, "");
}

export async function POST(
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

    const payload = await request.json().catch(() => ({}));

    const base = resolveExternalApiBase();
    const fullUrl = `${base}/api/orders/${encodeURIComponent(orderId)}/payment-webhook`;

    const apiKey = process.env.EXTERNAL_API_API_KEY || "";
    const sharedSecret = process.env.EXTERNAL_API_SHARED_SECRET || "";
    const serviceToken = process.env.EXTERNAL_API_SERVICE_TOKEN || process.env.EXTERNAL_API_SERVICE_BEARER || "";
    const timestamp = Date.now().toString();
    const rawBody = JSON.stringify(payload);
    const signature = sharedSecret
      ? require("crypto").createHmac("sha256", sharedSecret).update(`${timestamp}:${rawBody}`).digest("hex")
      : "";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey) headers["X-Api-Key"] = apiKey;
    if (signature) {
      headers["X-Request-Timestamp"] = timestamp;
      headers["X-Request-Hash"] = "HMAC-SHA256";
      headers["X-Request-Signature"] = signature;
    }
    if (serviceToken) headers["Authorization"] = `Bearer ${serviceToken}`;

    const response = await fetch(fullUrl, {
      method: "POST",
      headers,
      body: rawBody,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API externa respondió con ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Error procesando webhook de pago",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}

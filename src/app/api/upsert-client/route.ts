import { NextResponse } from "next/server";
import crypto from "crypto";

function normalizeExternalBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, "");
  return trimmed.replace(/\/api$/, "");
}

function buildHmacHeaders(rawBody: string) {
  const apiKey = process.env.EXTERNAL_API_API_KEY || "";
  const sharedSecret = process.env.EXTERNAL_API_SHARED_SECRET || "";
  const timestamp = Date.now().toString();
  const signature = sharedSecret
    ? crypto.createHmac("sha256", sharedSecret).update(`${timestamp}:${rawBody}`).digest("hex")
    : "";
  const headers: Record<string, string> = {};
  if (apiKey) headers["X-Api-Key"] = apiKey;
  if (signature) {
    headers["X-Request-Timestamp"] = timestamp;
    headers["X-Request-Signature"] = signature;
    headers["X-Request-Hash"] = "HMAC-SHA256";
  }
  return headers;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const nombre = String(body?.nombre || "");
    const telefono = String(body?.telefono || "");
    const dni = String(body?.dni || "");
    const cuit = String(body?.cuit || "").trim();
    const origen = String(body?.origen || "ecommerce");

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    const externalApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE || "";
    if (!externalApiUrl) {
      return NextResponse.json(
        { error: "API externa no configurada (NEXT_PUBLIC_API_BASE_URL / NEXT_PUBLIC_API_BASE)" },
        { status: 500 }
      );
    }

    const base = normalizeExternalBaseUrl(externalApiUrl);
    const apiBase = `${base}/api/v1`;

    const authBearer = process.env.EXTERNAL_API_SERVICE_TOKEN || process.env.EXTERNAL_API_SERVICE_BEARER || "";
    const getHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...buildHmacHeaders(""),
    };
    if (authBearer) {
      getHeaders["Authorization"] = `Bearer ${authBearer}`;
    }
    const resGet = await fetch(`${apiBase}/clientes/by-email?email=${encodeURIComponent(email)}`, {
      method: "GET",
      headers: getHeaders,
    });

    let externalClientId: string | null = null;
    if (resGet.ok) {
      const existing = await resGet.json().catch(() => null);
      if (existing && (existing.id || existing._id)) {
        externalClientId = existing.id || existing._id;
      }
    } else if (resGet.status !== 404) {
      const text = await resGet.text().catch(() => "");
      return NextResponse.json({ error: "Error buscando cliente", details: text }, { status: resGet.status });
    }

    const upsertPayload = {
      email,
      nombre,
      telefono,
      dni,
      ...(cuit ? { cuit } : {}),
      origen,
    };
    const upsertRaw = JSON.stringify(upsertPayload);
    const upsertHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...buildHmacHeaders(upsertRaw),
    };
    if (authBearer) {
      upsertHeaders["Authorization"] = `Bearer ${authBearer}`;
    }

    if (externalClientId) {
      const resPut = await fetch(`${apiBase}/clientes/by-email/${encodeURIComponent(email)}`, {
        method: "PUT",
        headers: upsertHeaders,
        body: upsertRaw,
      });
      if (!resPut.ok) {
        const text = await resPut.text().catch(() => "");
        return NextResponse.json({ error: "No se pudo actualizar cliente", details: text }, { status: resPut.status });
      }
      const updated = await resPut.json().catch(() => null);
      return NextResponse.json({ ok: true, clienteId: externalClientId, data: updated });
    } else {
      const resPost = await fetch(`${apiBase}/clientes`, {
        method: "POST",
        headers: upsertHeaders,
        body: upsertRaw,
      });
      if (!resPost.ok) {
        const text = await resPost.text().catch(() => "");
        return NextResponse.json({ error: "No se pudo crear cliente", details: text }, { status: resPost.status });
      }
      const created = await resPost.json().catch(() => null);
      const id = created?.id || created?._id || null;
      return NextResponse.json({ ok: true, clienteId: id, data: created });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Fallo en upsert de cliente", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

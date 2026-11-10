import { NextResponse } from "next/server";
import crypto from "crypto";
import { processNavePayment } from "@/lib/navePaymentProcessing";

function verifyWebhookSignature(
  rawBody: string,
  request: Request,
): { ok: boolean; reason: string } {
  const mode = String(process.env.NAVE_GALICIA_WEBHOOK_SIGNATURE_MODE || "disabled")
    .trim()
    .toLowerCase();
  if (mode === "disabled") return { ok: true, reason: "disabled" };

  if (mode === "hmac_sha256_body_hex") {
    const secret = String(process.env.NAVE_GALICIA_WEBHOOK_SECRET || "").trim();
    const headerName = String(
      process.env.NAVE_GALICIA_WEBHOOK_SIGNATURE_HEADER || "x-webhook-signature",
    )
      .trim()
      .toLowerCase();
    if (!secret) return { ok: false, reason: "missing_secret" };
    const provided = String(request.headers.get(headerName) || "").trim();
    if (!provided) return { ok: false, reason: "missing_signature_header" };

    const computed = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    try {
      const providedBuffer = Buffer.from(provided, "hex");
      const computedBuffer = Buffer.from(computed, "hex");
      const ok =
        providedBuffer.length === computedBuffer.length &&
        crypto.timingSafeEqual(providedBuffer, computedBuffer);
      return { ok, reason: ok ? "ok" : "mismatch" };
    } catch {
      return { ok: false, reason: "compare_error" };
    }
  }

  return { ok: false, reason: "unsupported_signature_mode" };
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = verifyWebhookSignature(rawBody, request);
  if (!signature.ok) {
    return NextResponse.json(
      { error: "Firma de webhook inválida", reason: signature.reason },
      { status: 401 },
    );
  }

  let data: any;
  try {
    data = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    return NextResponse.json({ error: "JSON de webhook inválido" }, { status: 400 });
  }

  const paymentId = String(data?.payment_id || "").trim();
  const externalPaymentId = String(data?.external_payment_id || "").trim();
  const paymentCheckUrl = String(data?.payment_check_url || "").trim();
  if (!paymentId || !externalPaymentId || !paymentCheckUrl) {
    return NextResponse.json(
      {
        error:
          "El evento Nave debe incluir payment_id, external_payment_id y payment_check_url",
      },
      { status: 400 },
    );
  }

  try {
    const result = await processNavePayment({
      internalApiBase: new URL(request.url).origin,
      externalPaymentId,
      paymentId,
      paymentCheckUrl,
      webhookData: data,
      source: "webhook",
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[nave_galicia:webhook] No se pudo procesar el pago verificado", {
      paymentId,
      externalPaymentId,
      error: error instanceof Error ? error.message : String(error),
    });
    // Nave can retry the notification; do not acknowledge a payment that was
    // not verified or whose order/sale update did not complete.
    return NextResponse.json(
      {
        error: "No se pudo procesar la notificación de Nave",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import crypto from "crypto";

const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

if (!MP_ACCESS_TOKEN) {
  console.error("MERCADOPAGO_ACCESS_TOKEN no está configurado");
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
  if (/^https?:\/\//i.test(candidate)) return candidate.replace(/\/api$/, "");
  if (candidate.startsWith("/")) return fallback;
  const protocol =
    candidate.includes(":") || !candidate.includes(".") ? "http" : "https";
  return `${protocol}://${candidate}`.replace(/\/api$/, "");
}

function signedHeaders(rawBody: string, authHeader = ""): Record<string, string> {
  const apiKey = process.env.EXTERNAL_API_API_KEY || "";
  const sharedSecret = process.env.EXTERNAL_API_SHARED_SECRET || "";
  const serviceToken =
    process.env.EXTERNAL_API_SERVICE_TOKEN ||
    process.env.EXTERNAL_API_SERVICE_BEARER ||
    "";
  const timestamp = Date.now().toString();
  const signature = sharedSecret
    ? crypto.createHmac("sha256", sharedSecret).update(`${timestamp}:${rawBody}`).digest("hex")
    : "";

  return {
    "Content-Type": "application/json",
    ...(apiKey ? { "X-Api-Key": apiKey } : {}),
    ...(signature
      ? {
          "X-Request-Timestamp": timestamp,
          "X-Request-Hash": "HMAC-SHA256",
          "X-Request-Signature": signature,
        }
      : {}),
    ...(serviceToken ? { Authorization: `Bearer ${serviceToken}` } : {}),
    ...(authHeader ? { Authorization: authHeader } : {}),
  };
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    let data: any = {};
    try {
      data = rawBody ? JSON.parse(rawBody) : {};
    } catch (e) {
      console.error("Error al parsear JSON del webhook (se continúa):", e);
      data = {};
    }

    const action = typeof data?.action === "string" ? data.action : undefined;
    const inferredType = action?.includes(".") ? action.split(".")[0] : undefined;
    const type = data?.type || inferredType;
    const notificationData = data?.data || {};
    const url = new URL(request.url);
    const qpId = url.searchParams.get("id");
    const internalApiBase = `${url.protocol}//${url.host}`;
    const externalApiBase = resolveExternalApiBase();
    const paymentId = notificationData?.id || data?.id || qpId;
    const traceId = `mp-${Date.now()}-${String(paymentId || "nopayment")}`;

    if (type !== "payment") {
      return NextResponse.json(
        { message: "Tipo de notificación no manejado" },
        { status: 200 }
      );
    }

    if (!paymentId) {
      console.warn("Webhook recibido sin paymentId; se responde 200 para evitar fallos en MP");
      return NextResponse.json({ success: true });
    }
    
    if (!MP_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: "Access token no configurado" },
        { status: 500 }
      );
    }
    
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      const status = response.status;
      const text = await response.text().catch(() => "");
      console.error("Pago de Mercado Pago no disponible", { status, text, paymentId });
      return NextResponse.json({ success: true });
    }

    const paymentData = await response.json();

    const orderId = paymentData.metadata?.orderId || paymentData.external_reference;
    console.log("Webhook MP: pago obtenido", {
      traceId,
      paymentId: paymentData.id || paymentId,
      paymentStatus: paymentData.status,
      orderId,
    });

    if (!orderId) {
      console.warn("Webhook: orderId no presente en metadata; se responde 200");
      return NextResponse.json({ success: true });
    }

    let orderStatus = "pending";
    if (paymentData.status === "approved") {
      orderStatus = "success";
    } else if (paymentData.status === "rejected") {
      orderStatus = "failed";
    }

    try {
      const paymentWebhookPayload = JSON.stringify({
        paymentId: paymentData.id,
        paymentStatus: paymentData.status,
        status: orderStatus,
        metadata: paymentData.metadata ?? {},
      });
      const paymentWebhookRes = await fetch(
        `${externalApiBase}/api/orders/${encodeURIComponent(orderId)}/payment-webhook`,
        {
          method: "POST",
          headers: signedHeaders(paymentWebhookPayload),
          body: paymentWebhookPayload,
        }
      );
      if (!paymentWebhookRes.ok) {
        const paymentWebhookError = await paymentWebhookRes.text().catch(() => "");
        throw new Error(`orders payment-webhook ${paymentWebhookRes.status}: ${paymentWebhookError}`);
      }
      console.log("Webhook MP: estado de orden actualizado", {
        traceId,
        orderId,
        orderStatus,
      });
    } catch (apiError) {
      console.error("Error al actualizar pedido en API externa:", {
        traceId,
        orderId,
        orderStatus,
        error: apiError instanceof Error ? apiError.message : apiError,
      });
    }

    if (orderStatus === "success") {
      try {
        const orderRes = await fetch(
          `${externalApiBase}/api/orders/${encodeURIComponent(orderId)}`,
          { method: "GET", headers: signedHeaders("") }
        );
        if (!orderRes.ok) {
          const orderError = await orderRes.text().catch(() => "");
          throw new Error(`orders get ${orderRes.status}: ${orderError}`);
        }
        const order = await orderRes.json();
        const normalizedOrder = (order && typeof order === "object")
          ? (order.data ?? order)
          : {};
        const userEmail =
          normalizedOrder?.customerInfo?.email ||
          normalizedOrder?.customerInfo?.correo ||
          "";
        const serviceToken =
          process.env.EXTERNAL_API_SERVICE_TOKEN ||
          process.env.EXTERNAL_API_SERVICE_BEARER ||
          "";

        const shippingFromMetadata = Number(paymentData?.metadata?.shippingCost ?? 0);
        const shippingFromPayment = Number(
          paymentData?.shipping_cost ??
          paymentData?.transaction_details?.shipping_cost ??
          paymentData?.charges_details?.shipping ??
          0
        );
        const shippingFromOrder = Number(
          normalizedOrder?.deliveryInfo?.shippingPrice ??
          normalizedOrder?.shippingPrice ??
          normalizedOrder?.shippingCost ??
          normalizedOrder?.envio?.costo ??
          0
        );
        const paidAmountResolved = Number(
          paymentData?.total_paid_amount ??
          paymentData?.transaction_details?.total_paid_amount ??
          paymentData?.transaction_amount ??
          0
        );

        const saveVentaRes = await fetch(`${internalApiBase}/api/save-venta`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(serviceToken ? { Authorization: `Bearer ${serviceToken}` } : {}),
          },
          body: JSON.stringify({
            externalReference: orderId,
            orderData: normalizedOrder,
            userEmail,
            paymentMethod: "mercadopago",
            paidAmount: paidAmountResolved,
            forceEmail: true,
            shippingCost:
              shippingFromOrder > 0
                ? shippingFromOrder
                : (shippingFromMetadata > 0 ? shippingFromMetadata : shippingFromPayment),
          }),
        });
        if (!saveVentaRes.ok) {
          const saveVentaError = await saveVentaRes.text().catch(() => "");
          throw new Error(`save-venta ${saveVentaRes.status}: ${saveVentaError}`);
        }
        console.log("Webhook MP: venta guardada y email disparado", {
          traceId,
          orderId,
        });
      } catch (e) {
        console.error(
          "Error creando venta y disparando email desde webhook:",
          {
            traceId,
            orderId,
            error: e instanceof Error ? e.message : e,
          }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en webhook Mercado Pago:", error);
    return NextResponse.json(
      { error: "Error procesando la notificación" },
      { status: 500 }
    );
  }
}

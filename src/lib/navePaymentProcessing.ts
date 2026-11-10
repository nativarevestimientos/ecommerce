import crypto from "crypto";
import {
  fetchNavePayment,
  getByPath,
  getNaveGaliciaAccessToken,
  getNaveUrls,
  mapNavePaymentStatus,
  sanitizeForStorage,
  truncate,
} from "@/lib/naveGalicia";
import {
  getProviderPaymentSession,
  upsertProviderPaymentSession,
} from "@/lib/providerPaymentSessions";

type ProcessNavePaymentInput = {
  internalApiBase: string;
  externalPaymentId: string;
  paymentId: string;
  paymentCheckUrl?: string | null;
  webhookData?: unknown;
  source: "webhook" | "return";
};

function resolveExternalApiBase(): string | null {
  const raw = String(
    process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE || "",
  )
    .trim()
    .replace(/\/+$/, "");
  if (!raw || raw.startsWith("/")) return null;
  if (/^https?:\/\//i.test(raw)) return raw.replace(/\/api$/, "");
  const protocol = raw.includes(":") || !raw.includes(".") ? "http" : "https";
  return `${protocol}://${raw}`.replace(/\/api$/, "");
}

function signedHeaders(rawBody = ""): Record<string, string> {
  const apiKey = process.env.EXTERNAL_API_API_KEY || "";
  const sharedSecret = process.env.EXTERNAL_API_SHARED_SECRET || "";
  const serviceToken =
    process.env.EXTERNAL_API_SERVICE_TOKEN ||
    process.env.EXTERNAL_API_SERVICE_BEARER ||
    "";
  const timestamp = Date.now().toString();
  const signature = sharedSecret
    ? crypto
        .createHmac("sha256", sharedSecret)
        .update(`${timestamp}:${rawBody}`)
        .digest("hex")
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
  };
}

function readOrderTotal(order: any): number | null {
  const candidates = [
    order?.pricing?.total,
    Number(order?.total) +
      Number(
        order?.pricing?.shipping ??
          order?.deliveryInfo?.shippingPrice ??
          order?.shippingPrice ??
          order?.shippingCost ??
          0,
      ),
    order?.total,
  ];
  for (const value of candidates) {
    const amount = Number(value);
    if (Number.isFinite(amount) && amount > 0) {
      return Math.round(amount * 100) / 100;
    }
  }
  return null;
}

function readNavePaymentAmount(payment: any): { amount: number; currency: string } | null {
  const transactions = Array.isArray(payment?.transactions) ? payment.transactions : [];
  if (transactions.length) {
    let amount = 0;
    let currency = "";
    for (const transaction of transactions) {
      const total = transaction?.total_amount ?? transaction?.amount;
      const value = Number(total?.value);
      const itemCurrency = String(total?.currency || "").trim().toUpperCase();
      if (!Number.isFinite(value) || !itemCurrency) return null;
      if (currency && currency !== itemCurrency) return null;
      currency = itemCurrency;
      amount += value;
    }
    return { amount: Math.round(amount * 100) / 100, currency };
  }

  const topLevelAmount = payment?.total_amount ?? payment?.amount;
  const amount = Number(topLevelAmount?.value);
  const currency = String(topLevelAmount?.currency || "").trim().toUpperCase();
  return Number.isFinite(amount) && currency
    ? { amount: Math.round(amount * 100) / 100, currency }
    : null;
}

function safePaymentSnapshot(payment: any) {
  return {
    id: payment?.id || payment?.payment_id || null,
    external_payment_id: payment?.external_payment_id || null,
    status: payment?.status
      ? {
          name: payment.status.name || null,
          reason_code: payment.status.reason_code || null,
          reason_name: payment.status.reason_name || null,
        }
      : null,
    seller: { pos_id: getByPath(payment, "seller.pos_id") || null },
    transactions: Array.isArray(payment?.transactions)
      ? payment.transactions.map((transaction: any) => ({
          id: transaction?.id || null,
          transaction_type: transaction?.transaction_type || null,
          amount: transaction?.amount || null,
          total_amount: transaction?.total_amount || null,
          tip_amount: transaction?.tip_amount || null,
        }))
      : [],
  };
}

function getShippingCost(order: any): number {
  const candidates = [
    order?.pricing?.shipping,
    order?.deliveryInfo?.shippingPrice,
    order?.shippingPrice,
    order?.shippingCost,
  ];
  for (const value of candidates) {
    const amount = Number(value);
    if (Number.isFinite(amount) && amount > 0) return amount;
  }
  return 0;
}

async function readOrder(base: string, orderId: string) {
  const response = await fetch(`${base}/api/orders/${encodeURIComponent(orderId)}`, {
    method: "GET",
    headers: signedHeaders(),
    cache: "no-store",
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`No se pudo leer la orden ${response.status}: ${truncate(body, 250)}`);
  }
  const json = await response.json().catch(() => null);
  const order = json && typeof json === "object" ? json.data ?? json : null;
  if (!order || typeof order !== "object") throw new Error("La orden no existe o es invalida");
  return order;
}

async function postJson(url: string, body: unknown, headers: Record<string, string>) {
  const rawBody = JSON.stringify(body);
  const response = await fetch(url, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: rawBody,
    cache: "no-store",
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`${url} ${response.status}: ${truncate(text, 350)}`);
  }
  return response;
}

export async function processNavePayment(
  input: ProcessNavePaymentInput,
): Promise<{ orderId: string; status: string; paymentStatus: string }> {
  const externalPaymentId = String(input.externalPaymentId || "").trim();
  const paymentId = String(input.paymentId || "").trim();
  if (!externalPaymentId || !paymentId) {
    throw new Error("external_payment_id y payment_id son requeridos");
  }

  const directSession = await getProviderPaymentSession({
    orderId: externalPaymentId,
  }).catch(() => null);
  const session =
    directSession?.externalPaymentId === externalPaymentId
      ? directSession
      : await getProviderPaymentSession({ externalPaymentId }).catch(() => null);
  const orderId = String(session?.orderId || externalPaymentId).trim();
  if (!orderId) throw new Error("No se pudo asociar el pago Nave con una orden");
  if (session?.externalPaymentId && session.externalPaymentId !== externalPaymentId) {
    throw new Error("El external_payment_id no coincide con la sesion guardada");
  }

  const externalApiBase = resolveExternalApiBase();
  if (!externalApiBase) throw new Error("API externa de ordenes no configurada");
  const order = await readOrder(externalApiBase, orderId);
  const orderProvider = String(order?.paymentProvider || order?.paymentMethod || "")
    .trim()
    .toLowerCase();
  if (orderProvider && !orderProvider.includes("nave")) {
    throw new Error("La orden asociada no corresponde al medio de pago Nave");
  }

  const payment = await fetchNavePayment(paymentId, input.paymentCheckUrl || undefined);
  if (!payment || typeof payment !== "object") {
    throw new Error("Nave no devolvio un pago valido");
  }
  const returnedPaymentId = String(payment?.id || payment?.payment_id || "").trim();
  if (returnedPaymentId && returnedPaymentId !== paymentId) {
    throw new Error("El payment_id consultado no coincide con el devuelto por Nave");
  }

  const returnedExternalPaymentId = String(payment?.external_payment_id || "").trim();
  if (returnedExternalPaymentId && returnedExternalPaymentId !== externalPaymentId) {
    throw new Error("Nave devolvio un external_payment_id distinto al de la orden");
  }

  const expectedPosId = String(process.env.NAVE_GALICIA_POS_ID || "").trim();
  const returnedPosId = String(getByPath(payment, "seller.pos_id") || "").trim();
  if (expectedPosId && returnedPosId && expectedPosId !== returnedPosId) {
    throw new Error("El pago fue procesado en un punto de venta Nave distinto");
  }

  const expectedAmount =
    session?.amount !== null && session?.amount !== undefined
      ? Number(session.amount)
      : readOrderTotal(order);
  const expectedCurrency = String(
    session?.currency || process.env.NAVE_GALICIA_CURRENCY || "ARS",
  )
    .trim()
    .toUpperCase();
  const actualAmount = readNavePaymentAmount(payment);
  if (expectedAmount === null || !Number.isFinite(expectedAmount)) {
    throw new Error("No se pudo determinar el importe esperado de la orden");
  }
  if (
    !actualAmount ||
    Math.abs(actualAmount.amount - expectedAmount) >= 0.01 ||
    actualAmount.currency !== expectedCurrency
  ) {
    throw new Error(
      `El importe o la moneda del pago Nave no coincide con la orden (${actualAmount?.amount ?? "sin importe"} ${actualAmount?.currency ?? ""})`,
    );
  }

  const statusName = String(getByPath(payment, "status.name") || "").trim();
  if (!statusName) throw new Error("Nave no devolvio status.name para el pago");
  const mappedStatus = mapNavePaymentStatus(statusName);
  if (
    session?.paymentStatus === "paid" &&
    ["pending", "failed", "cancelled"].includes(mappedStatus)
  ) {
    // A late notification for an older attempt must not downgrade an order
    // already confirmed as paid. Refunds/reversals still pass through below.
    return { orderId, status: "paid", paymentStatus: "approved" };
  }
  const paymentStatusForOrder =
    mappedStatus === "paid"
      ? "approved"
      : mappedStatus === "failed" || mappedStatus === "cancelled"
        ? "rejected"
        : mappedStatus;
  const orderStatus =
    mappedStatus === "paid"
      ? "success"
      : mappedStatus === "failed" || mappedStatus === "cancelled"
        ? "failed"
        : mappedStatus;
  const paymentRequestId = session?.paymentRequestId || null;
  const reasonCode = String(getByPath(payment, "status.reason_code") || "").trim() || null;
  const reasonName = String(getByPath(payment, "status.reason_name") || "").trim() || null;
  const safeSnapshot = safePaymentSnapshot(payment);
  const providerDetails = {
    paymentProvider: "nave_galicia",
    paymentStatus: mappedStatus,
    navePaymentId: paymentId,
    navePaymentRequestId: paymentRequestId,
    externalPaymentId,
    naveStatusName: statusName,
    naveReasonCode: reasonCode,
    naveReasonName: reasonName,
    navePaymentCheckUrl: input.paymentCheckUrl || null,
    naveNotificationSource: input.source,
    naveWebhookRaw: sanitizeForStorage(input.webhookData),
    naveRawResponse: sanitizeForStorage(safeSnapshot),
  };

  await upsertProviderPaymentSession({
    orderId,
    externalPaymentId,
    paymentProvider: "nave_galicia",
    paymentStatus: mappedStatus,
    paymentRequestId,
    paymentId,
    amount: expectedAmount,
    currency: expectedCurrency,
    paymentCheckUrl: input.paymentCheckUrl || null,
    statusName,
    reasonCode,
    reasonName,
    rawPaymentResponse: safeSnapshot,
  });

  const payload = {
    provider: "nave_galicia",
    paymentId,
    paymentRequestId,
    externalPaymentId,
    paymentStatus: paymentStatusForOrder,
    status: orderStatus,
    providerDetails,
  };
  await postJson(
    `${externalApiBase}/api/orders/${encodeURIComponent(orderId)}/nave-payment-webhook`,
    payload,
    signedHeaders(JSON.stringify(payload)),
  );

  if (mappedStatus === "paid") {
    const serviceToken =
      process.env.EXTERNAL_API_SERVICE_TOKEN ||
      process.env.EXTERNAL_API_SERVICE_BEARER ||
      "";
    const userEmail = String(
      order?.customerInfo?.email || order?.customerInfo?.correo || "",
    );
    const ventaPayload = {
      externalReference: orderId,
      orderData: order,
      userEmail,
      paymentMethod: "nave_galicia",
      paidAmount: actualAmount.amount,
      shippingCost: getShippingCost(order),
      forceEmail: false,
      providerDetails,
    };
    await postJson(
      `${input.internalApiBase.replace(/\/+$/, "")}/api/save-venta`,
      ventaPayload,
      serviceToken ? { Authorization: `Bearer ${serviceToken}` } : {},
    );
  }

  return { orderId, status: mappedStatus, paymentStatus: paymentStatusForOrder };
}

export async function getLatestNavePaymentForOrder(orderId: string) {
  const session = await getProviderPaymentSession({ orderId });
  if (!session?.paymentRequestId) return { session, paymentId: null as string | null };

  const { paymentRequestUrlTemplate } = getNaveUrls();
  const token = await getNaveGaliciaAccessToken();
  const url = paymentRequestUrlTemplate.replace(
    "{{paymentRequestId}}",
    encodeURIComponent(session.paymentRequestId as string),
  );
  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`GET payment_request ${response.status}: ${truncate(body, 250)}`);
  }
  const paymentRequest = await response.json().catch(() => null);
  const payments = Array.isArray(paymentRequest?.payment_attempts?.payments)
    ? paymentRequest.payment_attempts.payments
    : [];
  const paymentId = String(
    paymentRequest?.payment_id || payments[payments.length - 1]?.payment_id || "",
  ).trim();
  return { session, paymentId: paymentId || null };
}

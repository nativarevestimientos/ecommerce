import { NextResponse } from "next/server";
import crypto from "crypto";
import {
  getNaveGaliciaAccessToken,
  getNaveUrls,
  resolveBaseUrlFromRequest,
  sanitizeForStorage,
  truncate,
} from "@/lib/naveGalicia";
import {
  getProviderPaymentSession,
  upsertProviderPaymentSession,
} from "@/lib/providerPaymentSessions";

type CheckoutItem = {
  title: string;
  description?: string;
  unit_price: number;
  quantity: number;
};

type CreateCheckoutBody = {
  items?: CheckoutItem[];
  orderId: string;
  payer?: { email?: string; name?: string; userId?: string };
};

type NormalizedNaveProduct = {
  name: string;
  description: string;
  quantity: number;
  unit_price_value: number;
};

async function fetchCreateCheckoutOnce(input: {
  url: string;
  headers: Record<string, string>;
  payload: unknown;
  request: Request;
  traceId: string;
  orderId: string;
}) {
  const startedAt = Date.now();
  const response = await fetch(input.url, {
    method: "POST",
    headers: input.headers,
    body: JSON.stringify(input.payload),
    cache: "no-store",
  });
  const text = await response.text().catch(() => "");
  await reportDebugEvent(
    input.request,
    response.ok ? "B" : "E",
    "src/app/api/nave-galicia/create-checkout/route.ts:create-intent",
    "Respuesta de creacion de intencion Nave",
    {
      orderId: input.orderId,
      statusCode: response.status,
      durationMs: Date.now() - startedAt,
      responseBody: sanitizeForStorage(text),
    },
    input.traceId,
  );
  return { response, text, attempt: 1 };
}

function toMoney(value: unknown): number | null {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number * 100) / 100 : null;
}

function getOrderShipping(order: any): number {
  const candidates = [
    order?.pricing?.shipping,
    order?.deliveryInfo?.shippingPrice,
    order?.shippingPrice,
    order?.shippingCost,
  ];
  for (const candidate of candidates) {
    const parsed = toMoney(candidate);
    if (parsed !== null && parsed > 0) return parsed;
  }
  return 0;
}

function getAuthoritativeCheckout(order: any): {
  amount: number;
  products: NormalizedNaveProduct[];
} {
  const orderItems = Array.isArray(order?.items) ? order.items : [];
  if (!orderItems.length) throw new Error("La orden guardada no tiene productos");

  const products: NormalizedNaveProduct[] = orderItems.map((item: any) => {
    const quantity = Number(item?.quantity ?? item?.cantidad ?? 0);
    const lineTotal = toMoney(item?.totalPrice);
    const storedUnitPrice = toMoney(
      item?.price ?? item?.unit_price?.value ?? item?.unit_price ?? item?.precioUnitario,
    );
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error("La orden contiene una cantidad de producto invalida");
    }

    const unitPrice =
      lineTotal !== null && lineTotal >= 0
        ? Math.floor((lineTotal / quantity + 0.0000001) * 100) / 100
        : storedUnitPrice;
    if (unitPrice === null || unitPrice < 0) {
      throw new Error("La orden contiene un precio de producto invalido");
    }

    const name = String(item?.name || item?.nombreProducto || item?.title || "Producto").trim();
    return {
      name,
      description: String(item?.description || name).trim(),
      quantity,
      unit_price_value: unitPrice,
    };
  });

  const productsTotal = toMoney(
    products.reduce((sum: number, item: any) => sum + item.unit_price_value * item.quantity, 0),
  );
  const savedTotal = toMoney(order?.pricing?.total);
  const itemTotal = toMoney(order?.total);
  const shipping = getOrderShipping(order);
  const amount =
    savedTotal !== null && savedTotal > 0
      ? savedTotal
      : itemTotal !== null && itemTotal > 0
        ? Math.round((itemTotal + shipping) * 100) / 100
        : null;

  if (amount === null || amount <= 0 || productsTotal === null) {
    throw new Error("No se pudo resolver el total de la orden guardada");
  }

  const otherCharges = Math.round((amount - productsTotal) * 100) / 100;
  if (otherCharges < 0) {
    throw new Error("Los productos de la orden no coinciden con el total guardado");
  }
  if (otherCharges > 0) {
    products.push({
      name: "Envío y cargos",
      description: "Envío y cargos de la orden",
      quantity: 1,
      unit_price_value: otherCharges,
    });
  }

  return { amount, products };
}

function toNaveExternalPaymentId(orderId: string): string {
  if (orderId.length <= 36) return orderId;
  return `nave-${crypto.createHash("sha256").update(orderId).digest("hex").slice(0, 31)}`;
}

async function reportDebugEvent(
  request: Request,
  hypothesisId: string,
  location: string,
  msg: string,
  data: Record<string, unknown>,
  traceId: string,
) {
  try {
    const baseUrl = resolveBaseUrlFromRequest(request);
    await fetch(`${baseUrl}/api/debug-log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "nave-502-error",
        runId: "pre-fix",
        hypothesisId,
        location,
        msg,
        data,
        traceId,
        ts: Date.now(),
      }),
      cache: "no-store",
    });
  } catch {}
}

async function persistPendingOrderMetadata(
  request: Request,
  orderId: string,
  checkoutResponse: {
    id: string;
    external_payment_id: string;
    checkout_url: string;
    qr_data?: string | null;
  },
  traceId: string,
) {
  const baseUrl = resolveBaseUrlFromRequest(request);
  const authHeader =
    request.headers.get("authorization") ||
    request.headers.get("Authorization") ||
    "";
  const requestHeaders = {
    "Content-Type": "application/json",
    ...(authHeader ? { Authorization: authHeader } : {}),
  };
  const metadataPayload = {
    paymentProvider: "nave_galicia",
    paymentStatus: "pending",
    status: "pending_payment",
    navePaymentRequestId: checkoutResponse.id,
    externalPaymentId: checkoutResponse.external_payment_id,
    providerDetails: {
      paymentProvider: "nave_galicia",
      paymentStatus: "pending",
      navePaymentRequestId: checkoutResponse.id,
      paymentRequestId: checkoutResponse.id,
      naveCheckoutUrl: checkoutResponse.checkout_url,
      naveQrData: checkoutResponse.qr_data || null,
      externalPaymentId: checkoutResponse.external_payment_id,
      naveRawResponse: sanitizeForStorage(checkoutResponse),
    },
  };
  const currentOrderResponse = await fetch(
    `${baseUrl}/api/orders/${encodeURIComponent(orderId)}`,
    {
      method: "GET",
      headers: requestHeaders,
      cache: "no-store",
    },
  );

  if (!currentOrderResponse.ok) {
    const text = await currentOrderResponse.text().catch(() => "");
    throw new Error(`No se pudo leer la orden antes de persistir metadata de Nave: ${truncate(text, 250)}`);
  }

  const currentOrderJson = await currentOrderResponse.json().catch(() => null);
  const currentOrder =
    currentOrderJson && typeof currentOrderJson === "object"
      ? currentOrderJson.data ?? currentOrderJson
      : null;

  if (!currentOrder || typeof currentOrder !== "object") {
    throw new Error("La orden actual no tiene un formato valido para persistir metadata de Nave");
  }

  const mergedProviderDetails =
    currentOrder.providerDetails && typeof currentOrder.providerDetails === "object"
      ? {
          ...currentOrder.providerDetails,
          ...metadataPayload.providerDetails,
        }
      : metadataPayload.providerDetails;

  const upsertPayload = {
    ...currentOrder,
    orderId,
    userId:
      String(currentOrder.userId || "").trim() ||
      String(currentOrder.customerInfo?.email || "").trim(),
    paymentMethod: currentOrder.paymentMethod || "nave_galicia",
    paymentProvider: "nave_galicia",
    paymentStatus: "pending",
    status: "pending_payment",
    navePaymentRequestId: checkoutResponse.id,
    externalPaymentId: checkoutResponse.external_payment_id,
    providerDetails: mergedProviderDetails,
  };

  await reportDebugEvent(
    request,
    "B",
    "src/app/api/nave-galicia/create-checkout/route.ts:persist-order-metadata",
    "[DEBUG] Persistiendo metadata inicial de Nave por upsert de orden",
    {
      orderId,
      paymentRequestId: checkoutResponse.id,
      externalPaymentId: checkoutResponse.external_payment_id,
      hasExistingProviderDetails: Boolean(currentOrder.providerDetails),
      upsertPayload: sanitizeForStorage({
        orderId: upsertPayload.orderId,
        userId: upsertPayload.userId,
        status: upsertPayload.status,
        paymentProvider: upsertPayload.paymentProvider,
        paymentStatus: upsertPayload.paymentStatus,
        externalPaymentId: upsertPayload.externalPaymentId,
        providerDetails: upsertPayload.providerDetails,
      }),
    },
    traceId,
  );

  const response = await fetch(
    `${baseUrl}/api/create-order`,
    {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify(upsertPayload),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`No se pudo persistir metadata de Nave: ${truncate(text, 250)}`);
  }

  const responseJson = await response.json().catch(() => null);
  await reportDebugEvent(
    request,
    "B",
    "src/app/api/nave-galicia/create-checkout/route.ts:persist-order-metadata-result",
    "[DEBUG] Metadata inicial de Nave persistida por upsert",
    {
      orderId,
      paymentRequestId: checkoutResponse.id,
      externalPaymentId: checkoutResponse.external_payment_id,
      response: sanitizeForStorage(responseJson),
    },
    traceId,
  );
}

export async function POST(request: Request) {
  try {
    const integrationMode = String(process.env.NAVE_GALICIA_INTEGRATION_MODE || "disabled").trim().toLowerCase();
    if (integrationMode === "disabled") {
      return NextResponse.json({ error: "Nave Galicia deshabilitado (NAVE_GALICIA_INTEGRATION_MODE=disabled)" }, { status: 503 });
    }

    const body = (await request.json()) as CreateCheckoutBody;
    const orderId = String(body?.orderId || "").trim();
    if (!orderId) {
      return NextResponse.json({ error: "ID de pedido no proporcionado" }, { status: 400 });
    }

    const baseUrl = resolveBaseUrlFromRequest(request);
    const traceId = `nave-checkout-${Date.now()}-${orderId.slice(0, 12)}`;

    if (integrationMode === "mock") {
      if (process.env.NODE_ENV !== "development") {
        return NextResponse.json({ error: "Modo mock solo permitido en development" }, { status: 403 });
      }
      const checkoutUrl = `${baseUrl}/checkout/nave-galicia/return?orderId=${encodeURIComponent(orderId)}&provider=nave_galicia&mock=1`;
      console.info("[nave_galicia:create-checkout] mock", { traceId, orderId });
      return NextResponse.json({ id: `mock-${orderId}`, checkout_url: checkoutUrl });
    }

    const posId = String(process.env.NAVE_GALICIA_POS_ID || "").trim();
    if (!posId) {
      return NextResponse.json(
        { error: "NAVE_GALICIA_POS_ID no esta configurado" },
        { status: 500 },
      );
    }

    const authHeader =
      request.headers.get("authorization") ||
      request.headers.get("Authorization") ||
      "";
    const savedOrderResponse = await fetch(
      `${baseUrl}/api/orders/${encodeURIComponent(orderId)}`,
      {
        method: "GET",
        headers: authHeader ? { Authorization: authHeader } : {},
        cache: "no-store",
      },
    );
    if (!savedOrderResponse.ok) {
      const responseText = await savedOrderResponse.text().catch(() => "");
      throw new Error(
        `No se pudo leer la orden guardada (${savedOrderResponse.status}): ${truncate(responseText, 200)}`,
      );
    }
    const savedOrderJson = await savedOrderResponse.json().catch(() => null);
    const savedOrder =
      savedOrderJson && typeof savedOrderJson === "object"
        ? savedOrderJson.data ?? savedOrderJson
        : null;
    if (!savedOrder || typeof savedOrder !== "object") {
      throw new Error("La API no devolvio una orden valida");
    }
    const savedPaymentMethod = String(
      savedOrder.paymentProvider || savedOrder.paymentMethod || "",
    ).trim().toLowerCase();
    if (
      savedPaymentMethod &&
      !savedPaymentMethod.includes("nave") &&
      savedPaymentMethod !== "nave_galicia"
    ) {
      return NextResponse.json(
        { error: "La orden no fue creada para pagar con Nave Galicia" },
        { status: 409 },
      );
    }

    const { amount, products: normalizedProducts } = getAuthoritativeCheckout(savedOrder);
    const currency = (process.env.NAVE_GALICIA_CURRENCY || "ARS").trim() || "ARS";
    const { createCheckoutUrl } = getNaveUrls();
    const callbackUrl = `${baseUrl}/checkout/nave-galicia/return?orderId=${encodeURIComponent(orderId)}`;
    const payerEmail = String(
      savedOrder.customerInfo?.email || body?.payer?.email || "",
    ).trim();
    const payerName = String(
      savedOrder.customerInfo?.nombre || body?.payer?.name || "",
    ).trim();
    const externalPaymentId = toNaveExternalPaymentId(orderId);
    const previousSession = await getProviderPaymentSession({ orderId }).catch(() => null);
    const previousSessionAge = previousSession?.createdAt
      ? Date.now() - new Date(previousSession.createdAt).getTime()
      : Number.POSITIVE_INFINITY;
    if (
      previousSession?.paymentStatus === "pending" &&
      previousSession.checkoutUrl &&
      previousSession.externalPaymentId &&
      previousSessionAge >= 0 &&
      previousSessionAge < 7 * 24 * 60 * 60 * 1000 &&
      (previousSession.amount === null ||
        previousSession.amount === undefined ||
        Math.abs(previousSession.amount - amount) < 0.01) &&
      (!previousSession.currency || previousSession.currency === currency)
    ) {
      return NextResponse.json({
        id: previousSession.paymentRequestId,
        external_payment_id: previousSession.externalPaymentId,
        checkout_url: previousSession.checkoutUrl,
        qr_data: previousSession.qrData,
      });
    }

    const payload = {
      external_payment_id: externalPaymentId,
      seller: {
        pos_id: posId,
      },
      transactions: [
        {
          amount: {
            currency,
            value: amount.toFixed(2),
          },
          products: normalizedProducts.map((item) => ({
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unit_price: {
              currency,
              value: Number(item.unit_price_value || 0).toFixed(2),
            },
          })),
        },
      ],
      ...(payerEmail || payerName
        ? {
            buyer: {
              name: payerName,
              user_email: payerEmail,
              user_id: String(savedOrder.userId || body?.payer?.userId || orderId).trim(),
            },
          }
        : {}),
      additional_info: {
        callback_url: callbackUrl,
      },
      duration_time: 604800,
    };

    const token = await getNaveGaliciaAccessToken();
    // #region debug-point A:oauth-token
    await reportDebugEvent(
      request,
      "A",
      "src/app/api/nave-galicia/create-checkout/route.ts:getNaveGaliciaAccessToken",
      "[DEBUG] Nave OAuth token obtenido",
      {
        orderId,
        hasToken: Boolean(token),
      },
      traceId,
    );
    // #endregion
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    console.info("[nave_galicia:create-checkout] request", {
      traceId,
      orderId,
      hasPayerEmail: Boolean(payerEmail),
      items: normalizedProducts.length,
      amount,
      currency,
      createCheckoutUrl,
    });
    // #region debug-point B:create-intent-request
    await reportDebugEvent(
      request,
      "B",
      "src/app/api/nave-galicia/create-checkout/route.ts:payload",
      "[DEBUG] Nave create-checkout payload listo",
      {
        orderId,
        createCheckoutUrl,
        payload: sanitizeForStorage(payload),
        requestHeaders: sanitizeForStorage({
          "Content-Type": headers["Content-Type"],
          Authorization: "Bearer [redacted]",
        }),
        amount: amount.toFixed(2),
        productCount: normalizedProducts.length,
        products: normalizedProducts.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unit_price: item.unit_price_value.toFixed(2),
        })),
      },
      traceId,
    );
    // #endregion

    const { response: res, text: responseText, attempt } = await fetchCreateCheckoutOnce({
      url: createCheckoutUrl,
      headers,
      payload,
      request,
      traceId,
      orderId,
    });

    if (!res.ok) {
      // #region debug-point E:create-intent-error
      await reportDebugEvent(
        request,
        "E",
        "src/app/api/nave-galicia/create-checkout/route.ts:error-response",
        "[DEBUG] Nave create-checkout devolvio error",
        {
          orderId,
          statusCode: res.status,
          attempt,
          responseHeaders: sanitizeForStorage(Object.fromEntries(res.headers.entries())),
          responseBody: sanitizeForStorage(responseText),
          payload: sanitizeForStorage(payload),
        },
        traceId,
      );
      // #endregion
      console.error("[nave_galicia:create-checkout] response not ok", {
        traceId,
        status: res.status,
        body: responseText.slice(0, 400),
      });
      return NextResponse.json(
        { error: `Nave Galicia create-checkout ${res.status}: ${responseText.slice(0, 200)}` },
        { status: 500 },
      );
    }

    const text = responseText;
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }

    const paymentRequestId = String(json?.id || "").trim();
    const createdExternalPaymentId = String(json?.external_payment_id || "").trim();
    const checkoutUrl = String(json?.checkout_url || "").trim();
    const qrData = String(json?.qr_data || "").trim() || null;
    // #region debug-point B:create-intent-response
    await reportDebugEvent(
      request,
      "B",
      "src/app/api/nave-galicia/create-checkout/route.ts:response",
      "[DEBUG] Nave create-checkout respondio",
      {
        orderId,
        paymentRequestId,
        externalPaymentId: createdExternalPaymentId,
        checkoutUrl,
        hasQrData: Boolean(qrData),
        statusCode: res.status,
        attempt,
        responseHeaders: sanitizeForStorage(Object.fromEntries(res.headers.entries())),
        responseBody: sanitizeForStorage(json),
      },
      traceId,
    );
    // #endregion

    if (
      !paymentRequestId ||
      !createdExternalPaymentId ||
      createdExternalPaymentId !== externalPaymentId ||
      !checkoutUrl
    ) {
      return NextResponse.json(
        {
          error:
            "Respuesta de Nave Galicia incompleta o el external_payment_id no coincide",
        },
        { status: 500 },
      );
    }

    try {
      const paymentSession = await upsertProviderPaymentSession({
        orderId,
        externalPaymentId: createdExternalPaymentId,
        paymentProvider: "nave_galicia",
        paymentStatus: "pending",
        paymentRequestId,
        amount,
        currency,
        checkoutUrl,
        qrData: qrData,
        createResponse: json,
      });
      await reportDebugEvent(
        request,
        "B",
        "src/app/api/nave-galicia/create-checkout/route.ts:provider-payment-session",
        "[DEBUG] Sesion server-side de Nave persistida al crear la intencion",
        {
          orderId,
          paymentRequestId,
          externalPaymentId: createdExternalPaymentId,
          paymentStatus: paymentSession.paymentStatus,
          updatedAt: paymentSession.updatedAt,
        },
        traceId,
      );
    } catch (sessionError) {
      await reportDebugEvent(
        request,
        "E",
        "src/app/api/nave-galicia/create-checkout/route.ts:provider-payment-session-error",
        "[DEBUG] Fallo la persistencia server-side de la sesion de Nave",
        {
          orderId,
          paymentRequestId,
          externalPaymentId: createdExternalPaymentId,
          error: sessionError instanceof Error ? sessionError.message : String(sessionError),
        },
        traceId,
      );
      throw sessionError;
    }

    try {
      await persistPendingOrderMetadata(request, orderId, {
        id: paymentRequestId,
        external_payment_id: createdExternalPaymentId,
        checkout_url: checkoutUrl,
        qr_data: qrData,
      }, traceId);
    } catch (persistError) {
      console.error("[nave_galicia:create-checkout] no se pudo persistir metadata", {
        traceId,
        orderId,
        error: persistError instanceof Error ? persistError.message : persistError,
      });
    }

    return NextResponse.json({
      id: paymentRequestId,
      external_payment_id: createdExternalPaymentId,
      checkout_url: checkoutUrl,
      qr_data: qrData,
    });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Error iniciando checkout de Nave Galicia: ${message}` },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import crypto from "crypto";

function normalizeExternalBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, "");
  return trimmed.replace(/\/api$/, "");
}

function buildSecurityHeaders(payload: any) {
  const apiKey = process.env.EXTERNAL_API_API_KEY || "";
  const sharedSecret = process.env.EXTERNAL_API_SHARED_SECRET || "";
  const timestamp = Date.now().toString();
  const bodyString = typeof payload === "string" ? payload : JSON.stringify(payload);
  const signature = sharedSecret
    ? crypto.createHmac("sha256", sharedSecret).update(`${timestamp}:${bodyString}`).digest("hex")
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
    const orderData = await request.json();
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization') || '';
    const serviceToken = process.env.EXTERNAL_API_SERVICE_TOKEN || process.env.EXTERNAL_API_SERVICE_BEARER || '';
    
    console.log('📦 Datos de orden recibidos:', JSON.stringify(orderData, null, 2));
    
    // Validar datos requeridos
    if (!orderData.orderId || !orderData.items || !orderData.total) {
      console.error('❌ Datos de orden incompletos:', {
        orderId: !!orderData.orderId,
        items: !!orderData.items,
        total: !!orderData.total
      });
      return NextResponse.json(
        { error: "Datos de orden incompletos" },
        { status: 400 }
      );
    }

    console.log('🔄 Enviando orden a API externa...');
    
    // Preparar datos en el formato que espera tu API externa
    const userId = orderData.userId || orderData.customerInfo?.email || "";
    if (!userId) {
      return NextResponse.json(
        { error: "Email del usuario requerido" },
        { status: 400 }
      );
    }

    const simplifiedOrderData = {
      orderId: orderData.orderId, // REQUERIDO por tu API externa
      userId,
      paymentMethod: orderData?.paymentMethod ?? null,
      paymentProvider: orderData?.paymentProvider ?? null,
      paymentStatus: orderData?.paymentStatus ?? null,
      externalPaymentId: orderData?.externalPaymentId ?? null,
      providerDetails: orderData?.providerDetails ?? null,
      customerInfo: orderData.customerInfo,
      deliveryInfo: orderData.deliveryInfo,
      shippingPrice:
        orderData?.deliveryInfo?.shippingPrice ??
        orderData?.shippingPrice ??
        null,
      shippingTierKm:
        orderData?.deliveryInfo?.shippingTierKm ??
        orderData?.shippingTierKm ??
        null,
      items: orderData.items,
      total: orderData.total,
      pricing: orderData?.pricing ?? null,
      pendingReason:
        orderData?.pendingReason ??
        orderData?.deliveryInfo?.cotizacionReason ??
        null,
      status: orderData.status,
      createdAt: orderData.createdAt
    };

    console.log('📤 Enviando datos simplificados:', JSON.stringify(simplifiedOrderData, null, 2));

    // Enviar a la API externa usando fetch directo
    const externalApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE || "";
    if (!externalApiUrl) {
      return NextResponse.json(
        { error: "API externa no configurada (NEXT_PUBLIC_API_BASE_URL / NEXT_PUBLIC_API_BASE)" },
        { status: 500 }
      );
    }

    const base = normalizeExternalBaseUrl(externalApiUrl);
    const apiBase = `${base}/api`;

    const securityAuthHeadersBase = (payload: any, method: "GET" | "POST" | "PUT" = "POST") => {
      const securityHeaders = buildSecurityHeaders(method === "GET" ? "" : payload);
      const baseAuth =
        authHeader
          ? { Authorization: authHeader }
          : (serviceToken ? { Authorization: `Bearer ${serviceToken}` } : {});
      return {
        "Content-Type": "application/json",
        ...baseAuth,
        ...securityHeaders,
      } as Record<string, string>;
    };

    let externalClientId: string | null = null;

    try {
      const email =
        simplifiedOrderData.customerInfo?.email ||
        simplifiedOrderData.userId ||
        "";

      if (email) {
        const clientPayloadBase = {
          email,
          nombre:
            simplifiedOrderData.customerInfo?.nombre ||
            simplifiedOrderData.customerInfo?.fullName ||
            "",
          telefono: simplifiedOrderData.customerInfo?.telefono || "",
          dni: simplifiedOrderData.customerInfo?.dni || "",
          origen: "ecommerce",
        };

        const headersGet = securityAuthHeadersBase(email);
        const resGet = await fetch(
          `${apiBase}/v1/clientes/by-email?email=${encodeURIComponent(email)}`,
          {
            method: "GET",
            headers: securityAuthHeadersBase(email, "GET"),
          }
        );

        if (resGet.ok) {
          const existing = await resGet.json().catch(() => null);
          if (existing && (existing.id || existing._id)) {
            externalClientId = existing.id || existing._id;
            const headersPut = securityAuthHeadersBase(clientPayloadBase, "PUT");
            try {
              await fetch(
                `${apiBase}/v1/clientes/by-email/${encodeURIComponent(email)}`,
                {
                  method: "PUT",
                  headers: headersPut,
                  body: JSON.stringify(clientPayloadBase),
                }
              );
            } catch (e) {
              console.error(
                "Error actualizando cliente por email en API externa (se continúa de todos modos):",
                e
              );
            }
          }
        } else if (resGet.status === 404) {
          const headersPost = securityAuthHeadersBase(clientPayloadBase, "POST");
          const resPost = await fetch(`${apiBase}/v1/clientes`, {
            method: "POST",
            headers: headersPost,
            body: JSON.stringify(clientPayloadBase),
          });
          if (resPost.ok) {
            const created = await resPost.json().catch(() => null);
            if (created && (created.id || created._id)) {
              externalClientId = created.id || created._id;
            }
          }
        }

        if (!externalClientId) {
          const fallback = await resGet
            .json()
            .catch(() => null)
            .then((data) => data)
            .catch(() => null);
          if (fallback && (fallback.id || fallback._id)) {
            externalClientId = fallback.id || fallback._id;
          }
        }

        if (externalClientId && simplifiedOrderData.deliveryInfo) {
          const delivery = simplifiedOrderData.deliveryInfo as any;
          const direccionPayload = {
            direccion:
              delivery.direccion ||
              delivery.address ||
              delivery.calle ||
              "",
            ciudad: delivery.ciudad || delivery.city || "",
            codigoPostal:
              delivery.codigoPostal || delivery.postalCode || "",
            metodoEntrega:
              delivery.metodoEntrega ||
              delivery.deliveryMethod ||
              "envio",
            lat: delivery.lat ?? null,
            lng: delivery.lng ?? null,
            esFavorita: false,
            origen: "ecommerce",
          };

          const headersDireccion = securityAuthHeadersBase(direccionPayload, "POST");
          try {
            await fetch(
              `${apiBase}/v1/clientes/${encodeURIComponent(
                externalClientId
              )}/direcciones`,
              {
                method: "POST",
                headers: headersDireccion,
                body: JSON.stringify(direccionPayload),
              }
            );
          } catch (e) {
            console.error(
              "Error al guardar dirección de cliente en API externa (se continúa de todos modos):",
              e
            );
          }
        }
      }
    } catch (e) {
      console.error(
        "Error en sincronización de cliente/dirección con API externa (se continúa de todos modos):",
        e
      );
    }

    const fullUrl = `${apiBase}/orders`;
    
    console.log('🌐 Enviando a API externa:', fullUrl);
    
    const rawBody = JSON.stringify(simplifiedOrderData);
    const securityHeadersOrder = buildSecurityHeaders(rawBody);

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader
          ? { Authorization: authHeader }
          : (serviceToken ? { Authorization: `Bearer ${serviceToken}` } : {})
        ),
        ...securityHeadersOrder,
      },
      body: rawBody,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API externa respondió con ${response.status}: ${errorText}`);
    }

    const responseData = await response.json();
    
    console.log('✅ Respuesta de API externa:', responseData);

    return NextResponse.json({
      success: true,
      message: "Orden creada correctamente",
      orderId: orderData.orderId,
      data: responseData
    });

  } catch (error) {
    console.error('❌ Error al crear la orden:', error);
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { 
        error: "Error al crear la orden",
        details: error instanceof Error ? error.message : "Error desconocido",
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

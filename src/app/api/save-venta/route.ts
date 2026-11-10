import { NextResponse } from "next/server";
import { sendOrderConfirmationEmail, sendPendingPaymentEmail } from "@/services/emailService";
import crypto from "crypto";
import { parseDiscountPct } from "@/lib/utils";

function normalizeExternalBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, "");
  return trimmed.replace(/\/api$/, "");
}

interface VentaData {
  success: boolean;
  data: Array<{
    numeroPedido: string;
    estado: string;
    total: number;
    fecha: string;
    fechaEntrega?: string;
    medioPago: string;
    id?: string;
    subtotal?: number;
    descuentos?: number;
    descuentoEfectivo?: number;
    totalSinEfectivo?: number;
    totalConEfectivo?: number | null;
    motivoPendiente?: string | null;
    productos: Array<{
      id: string;
      nombre: string;
      cantidad: number;
      precio: number;
      unidad: string;
      categoria: string;
      imagen: string;
      alto?: number;
      ancho?: number;
      largo?: number;
      cepilladoAplicado?: boolean;
    }>;
    envio: {
      estado: string;
      direccion: string;
      transportista: string;
      fechaEntrega: string;
    };
    cliente: {
      nombre: string;
      telefono: string;
    };
  }>;
  usuario: {
    email: string;
  };
}

function resolveShippingCost(order: any, fallback: number) {
  const candidates = [
    order?.deliveryInfo?.shippingPrice,
    order?.deliveryInfo?.shippingCost,
    order?.deliveryInfo?.costo,
    order?.shippingPrice,
    order?.shippingCost,
    order?.shipping,
    order?.envio?.costo,
    fallback,
  ];
  for (const value of candidates) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return 0;
}

function buildSecurityHeaders(payload: any, method: "GET" | "POST" | "PUT" = "POST") {
  const apiKey = process.env.EXTERNAL_API_API_KEY || "";
  const sharedSecret = process.env.EXTERNAL_API_SHARED_SECRET || "";
  const timestamp = Date.now().toString();
  const bodyString = method === "GET" ? "" : (typeof payload === "string" ? payload : JSON.stringify(payload));
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

async function reportDebugEvent(
  request: Request,
  hypothesisId: string,
  location: string,
  msg: string,
  data: Record<string, unknown>,
  traceId: string,
) {
  try {
    const baseUrl = new URL(request.url).origin;
    await fetch(`${baseUrl}/api/debug-log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "nave-server-traceability",
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization') || '';
    const internalApiBase = new URL(request.url).origin;
    const traceId = `save-venta-${Date.now()}-${String(body?.externalReference || "no-ref")}`;
    
    const { externalReference, orderData, userEmail, paymentMethod, paidAmount, shippingCost, forceEmail, providerDetails } = body;

    const normalizedOrder = (orderData && typeof orderData === "object")
      ? (orderData.data ?? orderData)
      : {};

    console.log('📥 Datos recibidos en save-venta:', {
      externalReference,
      userEmail,
      hasProviderDetails: Boolean(providerDetails),
      orderData: {
        customerInfo: normalizedOrder.customerInfo,
        deliveryInfo: normalizedOrder.deliveryInfo,
        items: normalizedOrder.items,
        total: normalizedOrder.total,
        id: normalizedOrder.id
      }
    });

    // Validar datos requeridos mínimos
    if (!externalReference) {
      return NextResponse.json(
        { error: "externalReference faltante" },
        { status: 400 }
      );
    }

    // Evitar duplicados: si ya existe una venta para esta referencia, retornar éxito y no reenviar email
    let ventaExists = false;
    try {
      const existingRes = await fetch(`${internalApiBase}/api/ventas/buscar/${encodeURIComponent(externalReference)}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (existingRes.ok) {
        const existingData = await existingRes.json().catch(() => null);
        const numeroExistente =
          existingData?.numeroPedido ||
          existingData?.data?.numeroPedido ||
          existingData?.data?.[0]?.numeroPedido ||
          null;
        const idExistente =
          existingData?.id ||
          existingData?.data?.id ||
          existingData?.data?.[0]?.id ||
          null;
        if (numeroExistente || idExistente) {
          ventaExists = true;
          // #region debug-point C:save-venta-duplicate-detected
          await reportDebugEvent(
            request,
            "C",
            "src/app/api/save-venta/route.ts:existing-venta",
            "[DEBUG] save-venta detecto venta previa para la referencia",
            {
              externalReference,
              numeroExistente,
              idExistente,
              forceEmail: Boolean(forceEmail),
            },
            traceId,
          );
          // #endregion
          if (!forceEmail) {
            console.log("ℹ️ save-venta: venta existente detectada, se omite email porque forceEmail=false", {
              externalReference,
              numeroExistente,
            });
            return NextResponse.json({
              success: true,
              message: "Venta ya existente, no se duplica",
              numeroPedido: String(numeroExistente || externalReference),
              data: existingData,
            });
          }
        }
      }
    } catch {}

    // Obtener items de la orden
    let itemsArray = normalizedOrder.items || [];
    
    if (!Array.isArray(itemsArray) || itemsArray.length === 0) {
      return NextResponse.json(
        { error: "Items de la orden no válidos" },
        { status: 400 }
      );
    }
    
    const TRANSFERENCIA_DESCUENTO_PCT = parseDiscountPct(process.env.TRANSFERENCIA_DESCUENTO_PCT ?? process.env.NEXT_PUBLIC_TRANSFERENCIA_DESCUENTO_PCT, 0.10);
    const medioPagoFinal = String(paymentMethod || "mercadopago").toLowerCase();
    const isTransferencia = medioPagoFinal === "transferencia";
    const paymentMethodLabel =
      medioPagoFinal === "mercadopago"
        ? "MercadoPago"
        : medioPagoFinal === "transferencia"
          ? "Transferencia"
          : medioPagoFinal === "nave_galicia"
            ? "Nave Galicia"
            : medioPagoFinal;
    let originalSubtotal = 0;
    let netSubtotal = 0;
    for (const item of itemsArray) {
      const qty = Number(item.quantity ?? item.cantidad ?? 1);
      const unit = Number(item.price ?? item.precioUnitario ?? 0);
      const promo = item.activePromo;
      const hasTotalPrice = Number.isFinite(Number(item.totalPrice)) && qty > 0;
      let effectiveTotal = unit * qty;
      if (hasTotalPrice) {
        effectiveTotal = Number(item.totalPrice);
      } else if (promo && promo.cantidad > 0) {
        const promoQty = Math.min(qty, Number(promo.cantidad));
        const extraQty = Math.max(0, qty - promoQty);
        const promoTotal = Number(promo.precioFinal) || 0;
        effectiveTotal = (promoQty > 0 ? promoTotal : 0) + extraQty * unit;
      } else if (item.discount) {
        const percentage = Number(item.discount?.percentage ?? 0);
        const amount = Number(item.discount?.amount ?? 0);
        const discountedUnit =
          percentage > 0 ? unit * (1 - percentage / 100) : (amount > 0 ? unit - amount : unit);
        effectiveTotal = (Math.round(discountedUnit * 100) / 100) * qty;
      }

      let originalUnit = unit;
      if (hasTotalPrice && item.discount) {
        const percentage = Number(item.discount?.percentage ?? 0);
        const amount = Number(item.discount?.amount ?? 0);
        const effectiveUnit = qty > 0 ? Number(effectiveTotal) / qty : unit;
        const unitLooksDiscounted =
          Number.isFinite(effectiveUnit) && Number.isFinite(unit) && Math.abs(effectiveUnit - unit) < 0.01;
        if (unitLooksDiscounted && percentage > 0 && percentage < 100) {
          originalUnit = unit / (1 - percentage / 100);
        } else if (unitLooksDiscounted && amount > 0) {
          originalUnit = unit + amount;
        }
      }

      originalSubtotal += originalUnit * qty;
      netSubtotal += effectiveTotal;
    }
    originalSubtotal = Math.round(originalSubtotal * 100) / 100;
    netSubtotal = Math.round(netSubtotal * 100) / 100;
    const productDiscountAmount =
      Math.max(0, Math.round((originalSubtotal - netSubtotal) * 100) / 100);
    const transferDiscountAmount =
      isTransferencia && TRANSFERENCIA_DESCUENTO_PCT > 0
        ? Math.round(netSubtotal * TRANSFERENCIA_DESCUENTO_PCT * 100) / 100
        : 0;
    const productos = itemsArray.map((item: any) => {
      const qty = Number(item.quantity ?? item.cantidad ?? 1);
      const unit = Number(item.price ?? item.precioUnitario ?? 0);
      const promo = item.activePromo;
      const hasTotalPrice = Number.isFinite(Number(item.totalPrice));
      let effectiveTotal: number;
      if (hasTotalPrice && qty > 0) {
        effectiveTotal = Number(item.totalPrice);
      } else {
        effectiveTotal = unit * qty;
        if (promo && promo.cantidad > 0) {
          const promoQty = Math.min(qty, Number(promo.cantidad));
          const extraQty = Math.max(0, qty - promoQty);
          const promoTotal = Number(promo.precioFinal) || 0;
          effectiveTotal = (promoQty > 0 ? promoTotal : 0) + extraQty * unit;
        } else if (item.discount) {
          const percentage = Number(item.discount?.percentage ?? 0);
          const amount = Number(item.discount?.amount ?? 0);
          const discountedUnit =
            percentage > 0 ? unit * (1 - percentage / 100) : (amount > 0 ? unit - amount : unit);
          effectiveTotal = (Math.round(discountedUnit * 100) / 100) * qty;
        }
      }
      const effectiveUnit = qty > 0 ? Math.round((effectiveTotal / qty) * 100) / 100 : unit;
      return {
        id: item.id || item.productId || "",
        nombre: item.name || item.nombreProducto || "",
        cantidad: qty,
        precio: effectiveUnit,
        unidad: item.subcategory || item.unidad || "Unidad",
        categoria: item.category || item.categoria || "General",
        imagen: item.image || item.srcUrl || item.imagenUrl || "",
        alto: item.alto || 0,
        ancho: item.ancho || 0,
        largo: item.largo || 0,
        cepilladoAplicado: item.cepilladoAplicado || false
      };
    });

    // Calcular fecha de entrega (1 día después)
    const fechaEntrega = new Date();
    fechaEntrega.setDate(fechaEntrega.getDate() + 1);

    const direccion = String(normalizedOrder.deliveryInfo?.direccion || normalizedOrder.deliveryInfo?.address || "");
    const ciudad = String(normalizedOrder.deliveryInfo?.ciudad || normalizedOrder.deliveryInfo?.city || "");
    const codigoPostal = String(normalizedOrder.deliveryInfo?.codigoPostal || normalizedOrder.deliveryInfo?.postalCode || "");
    const direccionCompleta = [direccion, ciudad, codigoPostal ? `(${codigoPostal})` : ""].filter(Boolean).join(" ").trim();

    const numeroPedido = String(normalizedOrder.orderId || normalizedOrder.id || externalReference);
    const telefono = String(normalizedOrder.customerInfo?.telefono || normalizedOrder.customerInfo?.phone || "");
    const finalUserEmail = String(
      userEmail ||
      normalizedOrder.customerInfo?.email ||
      normalizedOrder.customerInfo?.correo ||
      ""
    );

    const montoAbonadoFinal =
      Number(
        paidAmount ??
          ((medioPagoFinal === "mercadopago" || medioPagoFinal === "nave_galicia")
            ? (normalizedOrder.total || 0)
            : 0)
      ) || 0;
    const metodoEntregaFinal = String(
      normalizedOrder.deliveryInfo?.metodoEntrega ||
      normalizedOrder.deliveryInfo?.deliveryMethod ||
      normalizedOrder.envio?.tipo ||
      ""
    ).toLowerCase();
    const itemsNetTotal = Number(normalizedOrder.total ?? 0) > 0
      ? Number(normalizedOrder.total)
      : itemsArray.reduce((sum: number, item: any) => {
          const qty = Number(item.quantity ?? item.cantidad ?? 1);
          const totalPrice = Number(item.totalPrice);
          if (Number.isFinite(totalPrice) && totalPrice >= 0) {
            return sum + totalPrice;
          }
          const unit = Number(item.price ?? item.precioUnitario ?? 0);
          return sum + (qty > 0 && Number.isFinite(unit) ? unit * qty : 0);
        }, 0);
    const inferredShippingFromPayment =
      (medioPagoFinal === "mercadopago" || medioPagoFinal === "nave_galicia") &&
      montoAbonadoFinal > 0 &&
      itemsNetTotal > 0 &&
      montoAbonadoFinal > itemsNetTotal
        ? Math.round((montoAbonadoFinal - itemsNetTotal) * 100) / 100
        : 0;
    const rawShippingCost = resolveShippingCost(
      normalizedOrder,
      Number(shippingCost ?? 0) || inferredShippingFromPayment
    );
    const shippingPriceEmail = metodoEntregaFinal === "envio" ? rawShippingCost : 0;
    const pendingReason =
      String(
        normalizedOrder?.pendingReason ??
        normalizedOrder?.deliveryInfo?.cotizacionReason ??
        normalizedOrder?.deliveryInfo?.pendingReason ??
        ""
      ).trim() || null;
    const estadoFinal = montoAbonadoFinal > 0 ? "pagado" : "pendiente";
    // #region debug-point C:save-venta-state-resolution
    await reportDebugEvent(
      request,
      "C",
      "src/app/api/save-venta/route.ts:estado-final",
      "[DEBUG] save-venta resolvio estado final de la venta",
      {
        externalReference,
        paymentMethod: medioPagoFinal,
        montoAbonadoFinal,
        estadoFinal,
        ventaExists,
        forceEmail: Boolean(forceEmail),
      },
      traceId,
    );
    // #endregion
    const totalCalculado = Math.round((netSubtotal - transferDiscountAmount + shippingPriceEmail) * 100) / 100;
    const totalSinEfectivo = Math.round((netSubtotal + shippingPriceEmail) * 100) / 100;

    const ventaData: VentaData = {
      success: true,
      data: [
        {
          numeroPedido,
          estado: estadoFinal,
          total: isTransferencia
            ? totalCalculado
            : Number(normalizedOrder?.pricing?.total ?? normalizedOrder.total ?? totalSinEfectivo),
          fecha: new Date().toISOString(),
          fechaEntrega: fechaEntrega.toISOString(),
          medioPago: medioPagoFinal,
          id: externalReference,
          subtotal: originalSubtotal,
          descuentos: productDiscountAmount,
          descuentoEfectivo: transferDiscountAmount,
          totalSinEfectivo,
          totalConEfectivo:
            isTransferencia
              ? Math.round((netSubtotal - transferDiscountAmount + shippingPriceEmail) * 100) / 100
              : null,
          motivoPendiente: pendingReason,
          productos,
          envio: {
            estado: metodoEntregaFinal === "cotizar" ? "a_cotizar" : "pendiente",
            direccion: direccionCompleta,
            transportista: normalizedOrder.deliveryInfo?.metodoEntrega || normalizedOrder.deliveryInfo?.deliveryMethod || "camion",
            fechaEntrega: fechaEntrega.toISOString()
          },
          cliente: {
            nombre: normalizedOrder.customerInfo?.nombre || normalizedOrder.customerInfo?.fullName || finalUserEmail || "Cliente",
            telefono
          }
        }
      ],
      usuario: {
        email: finalUserEmail
      }
    };
    // Adjuntar campos extendidos utilizados por el sistema externo (si los acepta)
    (ventaData as any).data[0].montoAbonado = montoAbonadoFinal;
    (ventaData as any).data[0].envio = {
      ...ventaData.data[0].envio,
      costo: shippingPriceEmail
    };
    if (providerDetails) {
      (ventaData as any).data[0].providerDetails = providerDetails;
    }

        // Enviar a la API externa
        const externalApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE || "";
        if (!externalApiUrl) {
          return NextResponse.json(
            { error: "API externa no configurada (NEXT_PUBLIC_API_BASE_URL / NEXT_PUBLIC_API_BASE)" },
            { status: 500 }
          );
        }

        const base = normalizeExternalBaseUrl(externalApiUrl);
        const fullUrl = `${base}/api/ventas`;
        
        console.log('📤 Enviando a API externa:', {
          url: fullUrl,
          ventaData: {
            cliente: ventaData.data[0].cliente,
            envio: ventaData.data[0].envio,
            productos: ventaData.data[0].productos,
            total: ventaData.data[0].total
          }
        });
        
        const serviceToken =
          process.env.EXTERNAL_API_SERVICE_TOKEN ||
          process.env.EXTERNAL_API_SERVICE_BEARER ||
          "";

        let responseData: any = null;
        if (!ventaExists) {
          // #region debug-point C:save-venta-create-attempt
          await reportDebugEvent(
            request,
            "C",
            "src/app/api/save-venta/route.ts:create-venta",
            "[DEBUG] save-venta intentara crear venta externa",
            {
              externalReference,
              estadoFinal,
              paymentMethod: medioPagoFinal,
              total: ventaData.data[0].total,
            },
            traceId,
          );
          // #endregion
          const securityHeaders: Record<string, string> = buildSecurityHeaders(ventaData, "POST");
          const baseAuth: Record<string, string> =
            serviceToken
              ? { Authorization: `Bearer ${serviceToken}` }
              : (authHeader ? { Authorization: authHeader } : {});
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
            ...baseAuth,
            ...securityHeaders,
            "Idempotency-Key": String(externalReference),
          };

          const response = await fetch(fullUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(ventaData),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API externa respondió con ${response.status}: ${errorText}`);
          }

          responseData = await response.json();
        }

    // Email según estado de pago
    if (estadoFinal === "pagado") {
      try {
        // #region debug-point D:save-venta-paid-email
        await reportDebugEvent(
          request,
          "D",
          "src/app/api/save-venta/route.ts:send-order-confirmation-email",
          "[DEBUG] save-venta enviara email de pago acreditado",
          {
            externalReference,
            numeroPedido,
            ventaExists,
            customerEmail: finalUserEmail,
          },
          traceId,
        );
        // #endregion
        // Totales del email replicando lógica de Step 3
        let originalSubtotal = 0;
        let netSubtotal = 0;
        const productosEmail = itemsArray.map((item: any) => {
          const qty = Number(item.quantity ?? item.cantidad ?? 1);
          const unit = Number(item.price ?? item.precioUnitario ?? 0);
          const promo = item.activePromo;
          const hasTotalPrice = Number.isFinite(Number(item.totalPrice)) && qty > 0;
          let effectiveTotal = unit * qty;
          if (hasTotalPrice) {
            effectiveTotal = Number(item.totalPrice);
          } else if (promo && promo.cantidad > 0) {
            const promoQty = Math.min(qty, Number(promo.cantidad));
            const extraQty = Math.max(0, qty - promoQty);
            const promoTotal = Number(promo.precioFinal) || 0;
            effectiveTotal = (promoQty > 0 ? promoTotal : 0) + extraQty * unit;
          } else if (item.discount) {
            const percentage = Number(item.discount?.percentage ?? 0);
            const amount = Number(item.discount?.amount ?? 0);
            const discountedUnit =
              percentage > 0 ? unit * (1 - percentage / 100) : (amount > 0 ? unit - amount : unit);
            effectiveTotal = (Math.round(discountedUnit * 100) / 100) * qty;
          }

          let originalUnit = unit;
          if (hasTotalPrice && item.discount) {
            const percentage = Number(item.discount?.percentage ?? 0);
            const amount = Number(item.discount?.amount ?? 0);
            const effectiveUnit = qty > 0 ? Number(effectiveTotal) / qty : unit;
            const unitLooksDiscounted =
              Number.isFinite(effectiveUnit) && Number.isFinite(unit) && Math.abs(effectiveUnit - unit) < 0.01;
            if (unitLooksDiscounted && percentage > 0 && percentage < 100) {
              originalUnit = unit / (1 - percentage / 100);
            } else if (unitLooksDiscounted && amount > 0) {
              originalUnit = unit + amount;
            }
          }

          originalSubtotal += originalUnit * qty;
          netSubtotal += effectiveTotal;
          const effectiveUnit = qty > 0 ? Math.round((effectiveTotal / qty) * 100) / 100 : unit;
          return {
            name: item.name || item.nombreProducto || "",
            quantity: qty,
            price: effectiveUnit,
            originalUnitPrice: Math.round(originalUnit * 100) / 100,
          };
        });
        const subtotal = Math.round(originalSubtotal * 100) / 100;
        const discount = Math.max(0, Math.round((originalSubtotal - netSubtotal) * 100) / 100);
        const shippingPrice = shippingPriceEmail;
        const transferenciaDiscountEmail =
          isTransferencia && TRANSFERENCIA_DESCUENTO_PCT > 0
            ? Math.round(netSubtotal * TRANSFERENCIA_DESCUENTO_PCT * 100) / 100
            : 0;
        const totalEmail = Math.round((netSubtotal - transferenciaDiscountEmail + shippingPrice) * 100) / 100;

        const emailResult = await sendOrderConfirmationEmail({
          orderId: numeroPedido,
          customerName:
            ventaData.data[0].cliente.nombre ||
            normalizedOrder.customerInfo?.nombre ||
            normalizedOrder.customerInfo?.fullName ||
            "",
          customerEmail: finalUserEmail,
          products: productosEmail,
          subtotal,
          discount,
          transferDiscount: transferenciaDiscountEmail,
          tax: 0,
          shipping: shippingPrice,
          total: totalEmail || ventaData.data[0].total,
          shippingAddress: {
            street: direccion,
            city: ciudad,
            state: "",
            zipCode: codigoPostal,
            country: "AR",
          },
          deliveryMethod: String(normalizedOrder.deliveryInfo?.metodoEntrega || normalizedOrder.deliveryInfo?.deliveryMethod || ""),
          paymentMethod: paymentMethodLabel,
          orderDate: new Date(),
        });
        console.log("✅ Email de confirmación enviado", {
          externalReference,
          numeroPedido,
          customerEmail: finalUserEmail,
          messageId: (emailResult as any)?.messageId || null,
        });
      } catch (e) {
        console.error("Error enviando email de confirmación desde save-venta:", e);
      }
    } else if (estadoFinal === "pendiente") {
      try {
        // #region debug-point C:save-venta-pending-email
        await reportDebugEvent(
          request,
          "C",
          "src/app/api/save-venta/route.ts:send-pending-payment-email",
          "[DEBUG] save-venta enviara email de pago pendiente",
          {
            externalReference,
            numeroPedido,
            ventaExists,
            customerEmail: finalUserEmail,
          },
          traceId,
        );
        // #endregion
        let originalSubtotal = 0;
        let netSubtotal = 0;
        const productosEmail = itemsArray.map((item: any) => {
          const qty = Number(item.quantity ?? item.cantidad ?? 1);
          const unit = Number(item.price ?? item.precioUnitario ?? 0);
          const promo = item.activePromo;
          const hasTotalPrice = Number.isFinite(Number(item.totalPrice)) && qty > 0;
          let effectiveTotal = unit * qty;
          if (hasTotalPrice) {
            effectiveTotal = Number(item.totalPrice);
          } else if (promo && promo.cantidad > 0) {
            const promoQty = Math.min(qty, Number(promo.cantidad));
            const extraQty = Math.max(0, qty - promoQty);
            const promoTotal = Number(promo.precioFinal) || 0;
            effectiveTotal = (promoQty > 0 ? promoTotal : 0) + extraQty * unit;
          } else if (item.discount) {
            const percentage = Number(item.discount?.percentage ?? 0);
            const amount = Number(item.discount?.amount ?? 0);
            const discountedUnit =
              percentage > 0 ? unit * (1 - percentage / 100) : (amount > 0 ? unit - amount : unit);
            effectiveTotal = (Math.round(discountedUnit * 100) / 100) * qty;
          }

          let originalUnit = unit;
          if (hasTotalPrice && item.discount) {
            const percentage = Number(item.discount?.percentage ?? 0);
            const amount = Number(item.discount?.amount ?? 0);
            const effectiveUnit = qty > 0 ? Number(effectiveTotal) / qty : unit;
            const unitLooksDiscounted =
              Number.isFinite(effectiveUnit) && Number.isFinite(unit) && Math.abs(effectiveUnit - unit) < 0.01;
            if (unitLooksDiscounted && percentage > 0 && percentage < 100) {
              originalUnit = unit / (1 - percentage / 100);
            } else if (unitLooksDiscounted && amount > 0) {
              originalUnit = unit + amount;
            }
          }

          originalSubtotal += originalUnit * qty;
          netSubtotal += effectiveTotal;
          const effectiveUnit = qty > 0 ? Math.round((effectiveTotal / qty) * 100) / 100 : unit;
          return {
            name: item.name || item.nombreProducto || "",
            quantity: qty,
            price: effectiveUnit,
            originalUnitPrice: Math.round(originalUnit * 100) / 100,
          };
        });
        const subtotal = Math.round(originalSubtotal * 100) / 100;
        const discount = Math.max(0, Math.round((originalSubtotal - netSubtotal) * 100) / 100);
        const shippingPrice = shippingPriceEmail;
        const transferenciaDiscountEmail =
          isTransferencia && TRANSFERENCIA_DESCUENTO_PCT > 0
            ? Math.round(netSubtotal * TRANSFERENCIA_DESCUENTO_PCT * 100) / 100
            : 0;
        const totalEmail = Math.round((netSubtotal - transferenciaDiscountEmail + shippingPrice) * 100) / 100;

        const emailResult = await sendPendingPaymentEmail({
          orderId: numeroPedido,
          customerName:
            ventaData.data[0].cliente.nombre ||
            normalizedOrder.customerInfo?.nombre ||
            normalizedOrder.customerInfo?.fullName ||
            "",
          customerEmail: finalUserEmail,
          products: productosEmail,
          subtotal,
          discount,
          transferDiscount: transferenciaDiscountEmail,
          tax: 0,
          shipping: shippingPrice,
          total: totalEmail || ventaData.data[0].total,
          shippingAddress: {
            street: direccion,
            city: ciudad,
            state: "",
            zipCode: codigoPostal,
            country: "AR",
          },
          deliveryMethod: String(normalizedOrder.deliveryInfo?.metodoEntrega || normalizedOrder.deliveryInfo?.deliveryMethod || ""),
          paymentMethod: paymentMethodLabel,
          orderDate: new Date(),
        });
        console.log("✅ Email de pedido pendiente enviado", {
          externalReference,
          numeroPedido,
          customerEmail: finalUserEmail,
          messageId: (emailResult as any)?.messageId || null,
        });
      } catch (e) {
        console.error("Error enviando email de pago pendiente desde save-venta:", e);
      }
    }

    return NextResponse.json({
      success: true,
      message: forceEmail ? "Email reenviado" : "Venta guardada correctamente",
      numeroPedido,
      data: responseData
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: "Error al guardar la venta",
        details: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 500 }
    );
  }
}

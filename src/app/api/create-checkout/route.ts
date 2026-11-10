import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
if (!accessToken) {
  console.error("MERCADOPAGO_ACCESS_TOKEN no está configurado");
}
const mp = new MercadoPagoConfig({
  accessToken: accessToken || "",
});

const resolveBaseUrl = (request: Request) => {
  const rawEnv = (process.env.NEXT_PUBLIC_BASE_URL || "").trim();
  if (rawEnv) return rawEnv.replace(/\/+$/, "");

  const url = new URL(request.url);
  const forwardedHost =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    url.host;
  const forwardedProto =
    request.headers.get("x-forwarded-proto") ||
    url.protocol.replace(":", "");

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`.replace(/\/+$/, "");
  }

  return url.origin.replace(/\/+$/, "");
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, orderId, payer, shipping } = body;

    // Validar datos requeridos
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "No hay productos en el carrito" },
        { status: 400 }
      );
    }

    if (!orderId) {
      return NextResponse.json(
        { error: "ID de pedido no proporcionado" },
        { status: 400 }
      );
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: "Token de acceso de Mercado Pago no configurado" },
        { status: 500 }
      );
    }

    const baseUrl = resolveBaseUrl(request);

    const shippingCost = Number(shipping) > 0 ? Number(shipping) : 0;

    // Crear los items para Mercado Pago
    const preferenceItems = items.map((item: any) => ({
      title: item.title,
      unit_price: Number(item.unit_price),
      quantity: Number(item.quantity),
      currency_id: process.env.MERCADOPAGO_CURRENCY || "ARS",
    }));

    // Crear la preferencia de pago
    const preference = await new Preference(mp).create({
      body: {
        items: preferenceItems,
        payer: {
          email: payer.email,
          name: payer.name,
        },
        ...(shippingCost > 0
          ? {
              shipments: {
                cost: shippingCost,
              },
            }
          : {}),
        back_urls: {
          success: `${baseUrl}/checkout/success`,
          failure: `${baseUrl}/checkout/failure`,
          pending: `${baseUrl}/checkout/pending`,
        },
        notification_url: `${baseUrl}/api/mercadopago/webhook`,
        metadata: {
          orderId: orderId,
          customerEmail: payer.email,
          shippingCost,
        },
        statement_descriptor: process.env.MERCADOPAGO_STATEMENT_DESCRIPTOR || "TU TIENDA",
        external_reference: orderId,
      },
    });

    // Verificar que la respuesta contenga un ID y init_point
    if (!preference || !preference.id || !preference.init_point) {
      console.error("Error: Respuesta de Mercado Pago incompleta", preference);
      return NextResponse.json(
        { error: "Error al crear la preferencia de pago" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      id: preference.id,
      init_point: preference.init_point 
    });
  } catch (error) {
    console.error("Error creando preferencia de pago:", error);
    
    // Devolver un mensaje de error más detallado en desarrollo
    const errorMessage = process.env.NODE_ENV === "development" 
      ? `Error al crear la preferencia de pago: ${error instanceof Error ? error.message : String(error)}`
      : "Error al crear la preferencia de pago";
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

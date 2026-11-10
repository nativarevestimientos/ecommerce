import { NextResponse } from "next/server";
import { getProviderPaymentSession } from "@/lib/providerPaymentSessions";

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const orderId = String(params?.id || "").trim();
    const externalPaymentId = String(
      new URL(request.url).searchParams.get("externalPaymentId") || "",
    ).trim();

    if (!orderId && !externalPaymentId) {
      return NextResponse.json(
        { error: "orderId o externalPaymentId requerido" },
        { status: 400 },
      );
    }

    const session = await getProviderPaymentSession({
      orderId: orderId || null,
      externalPaymentId: externalPaymentId || null,
    });

    if (!session) {
      return NextResponse.json(
        { error: "Sesion de pago no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: session });
  } catch (error) {
    return NextResponse.json(
      {
        error: "No se pudo obtener la sesion de pago",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import {
  getLatestNavePaymentForOrder,
  processNavePayment,
} from "@/lib/navePaymentProcessing";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const orderId = String(body?.orderId || "").trim();
    if (!orderId) {
      return NextResponse.json({ error: "orderId requerido" }, { status: 400 });
    }

    const { session, paymentId } = await getLatestNavePaymentForOrder(orderId);
    if (!session) {
      return NextResponse.json({ error: "Sesion Nave no encontrada" }, { status: 404 });
    }
    if (!paymentId) {
      return NextResponse.json({
        success: true,
        orderId,
        status: session.paymentStatus || "pending",
      });
    }

    const result = await processNavePayment({
      internalApiBase: new URL(request.url).origin,
      externalPaymentId: session.externalPaymentId,
      paymentId,
      webhookData: { source: "return_page_reconciliation", orderId },
      source: "return",
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[nave_galicia:reconcile] Error reconciliando pago", error);
    return NextResponse.json(
      {
        error: "No se pudo reconciliar el pago de Nave",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    );
  }
}

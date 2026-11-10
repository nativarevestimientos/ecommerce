import { NextResponse } from "next/server";
import {
  fetchNavePayment,
  fetchNavePaymentRequest,
  getByPath,
  mapNavePaymentStatus,
  sanitizeForStorage,
} from "@/lib/naveGalicia";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const paymentRequestId = String(params?.id || "").trim();
    if (!paymentRequestId) {
      return NextResponse.json(
        { error: "paymentRequestId requerido" },
        { status: 400 },
      );
    }

    const paymentRequest = await fetchNavePaymentRequest(paymentRequestId);
    const paymentAttempts = Array.isArray(paymentRequest?.payment_attempts?.payments)
      ? paymentRequest.payment_attempts.payments
      : [];
    const linkedPaymentId =
      String(
        paymentRequest?.payment_id ||
          paymentAttempts[paymentAttempts.length - 1]?.payment_id ||
          "",
      ).trim() || null;

    let paymentStatusName: string | null = null;
    let paymentStatusMapped: string | null = null;
    let paymentRaw: string | null = null;

    if (linkedPaymentId) {
      const payment = await fetchNavePayment(linkedPaymentId);
      paymentStatusName = String(getByPath(payment, "status.name") || "").trim() || null;
      paymentStatusMapped = paymentStatusName
        ? mapNavePaymentStatus(paymentStatusName)
        : null;
      paymentRaw = sanitizeForStorage(payment);
    }

    return NextResponse.json({
      success: true,
      paymentRequestId,
      externalPaymentId:
        String(paymentRequest?.external_payment_id || "").trim() || null,
      paymentRequestRaw: sanitizeForStorage(paymentRequest),
      linkedPaymentId,
      paymentStatusName,
      paymentStatusMapped,
      paymentRaw,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "No se pudo consultar la intencion de Nave Galicia",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    );
  }
}

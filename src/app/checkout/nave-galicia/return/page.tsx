"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

type DisplayState =
  | "paid"
  | "pending"
  | "failed"
  | "cancelled"
  | "refunded"
  | "reversed"
  | "chargeback_review"
  | "charged_back";

function normalizeStatus(value: unknown): DisplayState {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "paid" || raw === "success" || raw === "pagado" || raw === "approved") return "paid";
  if (raw === "failed" || raw === "rejected") return "failed";
  if (raw === "cancelled" || raw === "canceled") return "cancelled";
  if (raw === "refunded") return "refunded";
  if (raw === "reversed") return "reversed";
  if (raw === "chargeback_review") return "chargeback_review";
  if (raw === "charged_back") return "charged_back";
  return "pending";
}

function extractPaymentRequestId(order: any): string | null {
  const candidates = [
    order?.navePaymentRequestId,
    order?.paymentRequestId,
    order?.providerDetails?.navePaymentRequestId,
    order?.providerDetails?.paymentRequestId,
    order?.providerDetails?.payment_request_id,
  ];

  for (const candidate of candidates) {
    const value = String(candidate || "").trim();
    if (value) return value;
  }

  return null;
}

function readStoredCheckoutState(orderId: string): {
  paymentRequestId?: string | null;
  externalPaymentId?: string | null;
  checkoutUrl?: string | null;
  qrData?: string | null;
} | null {
  if (typeof window === "undefined" || !orderId) return null;

  try {
    const raw = localStorage.getItem(`nave_checkout_state:${orderId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

const copyForStatus: Record<
  DisplayState,
  {
    title: string;
    description: string;
    icon: typeof ClockIcon;
    accent: string;
    panel: string;
  }
> = {
  paid: {
    title: "Pago acreditado",
    description: "Tu pago fue confirmado. Estamos preparando tu pedido.",
    icon: CheckCircleIcon,
    accent: "text-green-600",
    panel: "bg-green-50 border-green-200",
  },
  pending: {
    title: "Pago en verificacion",
    description:
      "Recibimos tu regreso desde Nave. La confirmacion real se valida por webhook o consulta server-side.",
    icon: ClockIcon,
    accent: "text-[rgb(var(--brand-600))]",
    panel: "bg-[rgb(var(--brand-50))] border-[rgb(var(--brand-200))]",
  },
  failed: {
    title: "Pago no aprobado",
    description: "Nave informo que el pago no fue aprobado.",
    icon: XCircleIcon,
    accent: "text-red-600",
    panel: "bg-red-50 border-red-200",
  },
  cancelled: {
    title: "Pago cancelado",
    description: "La operacion fue cancelada.",
    icon: XCircleIcon,
    accent: "text-red-600",
    panel: "bg-red-50 border-red-200",
  },
  refunded: {
    title: "Pago reintegrado",
    description: "La operacion figura como reintegrada.",
    icon: ExclamationTriangleIcon,
    accent: "text-amber-600",
    panel: "bg-amber-50 border-amber-200",
  },
  reversed: {
    title: "Pago revertido",
    description: "La operacion figura como revertida.",
    icon: ExclamationTriangleIcon,
    accent: "text-amber-600",
    panel: "bg-amber-50 border-amber-200",
  },
  chargeback_review: {
    title: "Pago en revision",
    description: "La operacion esta en revision por contracargo.",
    icon: ExclamationTriangleIcon,
    accent: "text-amber-600",
    panel: "bg-amber-50 border-amber-200",
  },
  charged_back: {
    title: "Pago con contracargo",
    description: "La operacion figura con contracargo.",
    icon: ExclamationTriangleIcon,
    accent: "text-amber-600",
    panel: "bg-amber-50 border-amber-200",
  },
};

export default function NaveGaliciaReturnPage() {
  const searchParams = useSearchParams();
  const orderId = useMemo(
    () => String(searchParams?.get("orderId") || "").trim(),
    [searchParams],
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<DisplayState>("pending");
  const [providerStatus, setProviderStatus] = useState<DisplayState | null>(null);
  const [paymentRequestId, setPaymentRequestId] = useState<string | null>(null);

  const reportDebugEvent = useCallback(
    async (hypothesisId: string, location: string, msg: string, data: Record<string, unknown>) => {
      try {
        await fetch("/api/debug-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: "nave-sandbox-validation",
            runId: "pre-fix",
            hypothesisId,
            location,
            msg,
            data,
            ts: Date.now(),
          }),
        });
      } catch {}
    },
    [],
  );

  const refreshState = useCallback(async () => {
    if (!orderId) {
      setError("No se encontro el identificador de la orden.");
      setLoading(false);
      return;
    }

    setRefreshing(true);
    setError(null);

    try {
      // The return URL is only a prompt to reconcile. The server queries Nave
      // and applies the same verification path as the webhook before confirming.
      await fetch("/api/nave-galicia/reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
        cache: "no-store",
      }).catch(() => null);

      const orderResponse = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
        cache: "no-store",
      });
      if (!orderResponse.ok) {
        throw new Error(`No se pudo obtener la orden ${orderId}`);
      }

      const orderJson = await orderResponse.json().catch(() => null);
      const orderData =
        orderJson && typeof orderJson === "object" ? orderJson.data ?? orderJson : {};
      let paymentSessionData: any = null;
      try {
        const paymentSessionResponse = await fetch(
          `/api/provider-payment-sessions/${encodeURIComponent(orderId)}`,
          { cache: "no-store" },
        );
        if (paymentSessionResponse.ok) {
          const paymentSessionJson = await paymentSessionResponse.json().catch(() => null);
          paymentSessionData =
            paymentSessionJson && typeof paymentSessionJson === "object"
              ? paymentSessionJson.data ?? paymentSessionJson
              : null;
        }
      } catch {}
      const storedCheckoutState = readStoredCheckoutState(orderId);

      const normalizedOrderStatus = normalizeStatus(
        orderData?.paymentStatus ||
          orderData?.providerDetails?.paymentStatus ||
          paymentSessionData?.paymentStatus ||
          paymentSessionData?.statusName ||
          orderData?.status,
      );
      setOrderStatus(normalizedOrderStatus);
      // #region debug-point C:callback-order-status
      await reportDebugEvent(
        "C",
        "src/app/checkout/nave-galicia/return/page.tsx:order-status",
        "[DEBUG] Callback consulto orden sin acreditarla",
        {
          orderId,
          orderStatusRaw:
            orderData?.paymentStatus ||
            orderData?.providerDetails?.paymentStatus ||
            orderData?.status ||
            null,
          normalizedOrderStatus,
        },
      );
      // #endregion

      const requestId =
        extractPaymentRequestId(orderData) ||
        String(paymentSessionData?.paymentRequestId || "").trim() ||
        String(storedCheckoutState?.paymentRequestId || "").trim() ||
        null;
      setPaymentRequestId(requestId);
      await reportDebugEvent(
        "C",
        "src/app/checkout/nave-galicia/return/page.tsx:payment-request-id",
        "[DEBUG] Callback resolvio paymentRequestId para fallback",
        {
          orderId,
          paymentRequestId: requestId,
          source: extractPaymentRequestId(orderData)
            ? "order"
            : paymentSessionData?.paymentRequestId
              ? "payment_session"
            : storedCheckoutState?.paymentRequestId
              ? "local_storage"
              : "missing",
        },
      );

      if (requestId) {
        const fallbackResponse = await fetch(
          `/api/nave-galicia/payment-request/${encodeURIComponent(requestId)}`,
          { cache: "no-store" },
        );
        if (fallbackResponse.ok) {
          const fallbackJson = await fallbackResponse.json().catch(() => null);
          const fallbackStatus = fallbackJson?.paymentStatusMapped
            ? normalizeStatus(fallbackJson.paymentStatusMapped)
            : null;
          setProviderStatus(fallbackStatus);
          // #region debug-point C:callback-fallback
          await reportDebugEvent(
            "C",
            "src/app/checkout/nave-galicia/return/page.tsx:fallback",
            "[DEBUG] Callback ejecuto fallback de payment_request",
            {
              orderId,
              paymentRequestId: requestId,
              paymentStatusMapped: fallbackJson?.paymentStatusMapped || null,
              paymentStatusName: fallbackJson?.paymentStatusName || null,
            },
          );
          // #endregion
        } else {
          setProviderStatus(null);
        }
      } else {
        setProviderStatus(null);
      }
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "No se pudo verificar el estado del pago.",
      );
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [orderId, reportDebugEvent]);

  useEffect(() => {
    void refreshState();
  }, [refreshState]);

  const effectiveStatus = orderStatus;
  const view = copyForStatus[effectiveStatus];
  const Icon = view.icon;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[rgb(var(--brand-300))]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--page-bg))] py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto space-y-6"
      >
        <div className={`rounded-2xl border p-8 text-center shadow-sm ${view.panel}`}>
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white/80">
            <Icon className={`h-12 w-12 ${view.accent}`} />
          </div>
          <h1 className="text-3xl font-bold text-[rgb(var(--brand-900))]">{view.title}</h1>
          <p className="mt-3 text-[rgb(var(--brand-700))]">{view.description}</p>
          {orderId && (
            <p className="mt-4 text-sm text-[rgb(var(--brand-600))]">Orden: {orderId}</p>
          )}
          {paymentRequestId && (
            <p className="mt-1 text-sm text-[rgb(var(--brand-600))]">
              Intencion Nave: {paymentRequestId}
            </p>
          )}
          {providerStatus && orderStatus === "pending" && providerStatus !== "pending" && (
            <p className="mt-4 text-sm text-[rgb(var(--brand-700))]">
              La consulta manual a Nave devolvio estado `{providerStatus}`. La orden se confirma
              definitivamente por webhook o validacion server-side.
            </p>
          )}
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        </div>

        <div className="rounded-2xl border border-[rgb(var(--brand-200))] bg-[rgb(var(--surface))] p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[rgb(var(--brand-900))]">
            Que sigue ahora
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-[rgb(var(--brand-700))]">
            <li>La vuelta desde Nave nunca marca el pedido como pagado por si sola.</li>
            <li>La confirmacion real se procesa por webhook o por consulta server-side.</li>
            <li>Si el pago queda aprobado, el pedido se acredita y se dispara la postventa.</li>
            <li>Si hay una contingencia de envio, el equipo contacta al cliente por WhatsApp.</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => void refreshState()}
            disabled={refreshing}
            className="inline-flex items-center justify-center rounded-xl bg-[rgb(var(--brand-700))] px-5 py-3 text-sm font-medium text-white transition hover:bg-[rgb(var(--brand-800))] disabled:opacity-60"
          >
            {refreshing ? "Actualizando..." : "Actualizar estado"}
          </button>
          <Link
            href="/orders"
            className="inline-flex items-center justify-center rounded-xl border border-[rgb(var(--brand-200))] bg-[rgb(var(--surface))] px-5 py-3 text-sm font-medium text-[rgb(var(--brand-900))]"
          >
            Ver mis pedidos
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-[rgb(var(--brand-200))] bg-[rgb(var(--surface))] px-5 py-3 text-sm font-medium text-[rgb(var(--brand-900))]"
          >
            Volver a la tienda
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import Link from "next/link";
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { ProductImage } from "@/components/ui/ProductImage";

// Define a type for the product based on the external API structure
interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  cantidad: number;
  precio: number;
  precioOriginal?: number;
  subtotal?: number;
  subtotalOriginal?: number;
  descuentoMonto?: number;
  descuentoPorcentaje?: number;
  unidad: string;
  alto: number;
  ancho: number;
  largo: number;
  cepilladoAplicado: boolean;
  imagen?: string; // Campo opcional para la imagen del producto
}

// Define a type for the shipping information
interface Envio {
  estado: string;
  direccion: string;
  transportista: string;
  fechaEntrega: string;
  tipo?: string;
  costo?: number;
  storeId?: string | null;
  sucursal?: any;
}

// Define a type for the client
interface Cliente {
  nombre: string;
  telefono: string;
}

// Define a type for the order based on the external API structure
interface Order {
  id: string;
  numeroPedido: string;
  estado: string;
  total: number;
  fecha: string;
  fechaEntrega: string;
  medioPago: string;
  productos: Producto[];
  envio: Envio;
  cliente: Cliente;
  resumen: {
    subtotalOriginal: number;
    subtotalNeto: number;
    descuentoProductos: number;
    descuentoTransferencia: number;
    costoEnvio: number;
  };
}

const toNumber = (value: any): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const compact = value.trim().replace(/\s/g, "");
    if (!compact) return null;
    const lastComma = compact.lastIndexOf(",");
    const lastDot = compact.lastIndexOf(".");
    const lastSepIndex = Math.max(lastComma, lastDot);
    const hasSep = lastSepIndex !== -1;
    let normalized = compact;

    if (hasSep) {
      const decimalDigits = compact.length - lastSepIndex - 1;
      const decimalSep = compact[lastSepIndex];
      const treatAsDecimal = decimalDigits === 1 || decimalDigits === 2;

      if (treatAsDecimal) {
        normalized = compact
          .replace(/[.,]/g, (m, offset) => (offset === lastSepIndex ? "." : ""))
          .replace(/(?!^-)[^\d.]/g, "");
      } else {
        normalized = compact.replace(/[.,]/g, "").replace(/(?!^-)\D/g, "");
      }
    } else {
      normalized = compact.replace(/(?!^-)\D/g, "");
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const formatDateEs = (value: string | undefined) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("es-ES");
};

type PaymentKind = "transferencia" | "efectivo" | "mercadopago" | "nave_galicia" | "card" | "unknown";

const normalizePaymentMethod = (
  raw: string | undefined
): { label: string; kind: PaymentKind } => {
  const compact = String(raw || "").trim();
  const value = compact.toLowerCase();
  if (!value) return { label: "No informado", kind: "unknown" };
  if (value.includes("transferencia")) return { label: "Transferencia", kind: "transferencia" };
  if (value.includes("nave") && value.includes("galicia")) return { label: "Nave Galicia", kind: "nave_galicia" };
  if (value.includes("galicia") && (value.includes("checkout") || value.includes("nave"))) {
    return { label: "Nave Galicia", kind: "nave_galicia" };
  }
  if (value.includes("mercadopago") || value.includes("mercado pago") || value === "mp" || value.includes("mp ")) {
    return { label: "Mercado Pago", kind: "mercadopago" };
  }
  if (
    value.includes("tarjeta") ||
    value.includes("card") ||
    value.includes("credito") ||
    value.includes("débito") ||
    value.includes("debito")
  ) {
    return { label: "Tarjeta", kind: "card" };
  }
  if (value.includes("efectivo") || value.includes("cash")) return { label: "Efectivo", kind: "efectivo" };
  return { label: compact, kind: "unknown" };
};

const getEntregaLabel = (estadoEnvio: string | undefined, fechaEntrega: string | undefined) => {
  const estado = String(estadoEnvio || "").toLowerCase().trim();
  const fecha = fechaEntrega ? new Date(fechaEntrega) : null;
  const fechaValida = !!fecha && !Number.isNaN(fecha.getTime());

  if (!fechaValida) {
    if (estado === "entregado") return "Entregado (sin fecha registrada)";
    if (estado === "en camino") return "En coordinación";
    return "A definir";
  }

  if (estado === "entregado") return formatDateEs(fechaEntrega);
  if (estado === "en camino") return formatDateEs(fechaEntrega);
  return "A definir";
};

const pickFirstNumber = (...values: any[]): number => {
  for (const value of values) {
    const parsed = toNumber(value);
    if (parsed !== null) return parsed;
  }
  return 0;
};

const normalizeUnitTag = (value: any) =>
  String(value ?? "")
    .trim()
    .toUpperCase()
    .replace("²", "2");

const isM2Unit = (value: any) => normalizeUnitTag(value) === "M2";

const detectDeliveryKind = (input: any): "pickup" | "shipping" | "unknown" => {
  const values = [
    input?.deliveryInfo?.metodoEntrega,
    input?.deliveryInfo?.deliveryType,
    input?.deliveryInfo?.type,
    input?.deliveryInfo?.method,
    input?.deliveryInfo?.deliveryMethod,
    input?.deliveryInfo?.transportista,
    input?.envio?.metodoEntrega,
    input?.envio?.tipoEntrega,
    input?.envio?.deliveryType,
    input?.envio?.tipo,
    input?.envio?.transportista,
  ]
    .map((v) => String(v || "").trim().toLowerCase())
    .filter(Boolean);

  const hasPickupKeyword = values.some(
    (v) =>
      v.includes("retiro") ||
      v.includes("pickup") ||
      v.includes("pick up") ||
      v.includes("sucursal"),
  );
  const hasShippingKeyword = values.some(
    (v) =>
      v.includes("envio") ||
      v.includes("entrega") ||
      v.includes("delivery") ||
      v.includes("domicilio"),
  );
  const hasStoreSignals = Boolean(
    input?.envio?.storeId ||
      input?.envio?.storeID ||
      input?.deliveryInfo?.storeId ||
      input?.deliveryInfo?.storeID ||
      input?.deliveryInfo?.store?.id ||
      input?.envio?.sucursal ||
      input?.deliveryInfo?.sucursal ||
      input?.deliveryInfo?.store ||
      input?.deliveryInfo?.storeName,
  );

  if (hasPickupKeyword || hasStoreSignals) return "pickup";
  if (hasShippingKeyword) return "shipping";
  return "unknown";
};

const detectDeliveryKindFromNormalized = (envio: Envio | undefined) => {
  const tipo = String(envio?.tipo || "").toLowerCase();
  const carrier = String(envio?.transportista || "").toLowerCase();
  const sucursal = (envio as any)?.sucursal;
  const hasSucursal =
    (typeof sucursal === "string" && Boolean(sucursal.trim())) ||
    (sucursal && typeof sucursal === "object" && Object.keys(sucursal).length > 0);
  const hasStoreId = Boolean(String((envio as any)?.storeId || "").trim());

  if (tipo.includes("retiro") || carrier.includes("retiro")) return "pickup";
  if (tipo.includes("envio") || carrier.includes("envio")) return "shipping";
  if (hasStoreId || hasSucursal) return "pickup";
  return "unknown";
};

type NormalizedLineTotals = {
  qty: number;
  netUnit: number;
  originalUnit: number;
  netLine: number;
  originalLine: number;
  discountAmount: number;
  discountPercent: number;
};

const normalizeLineTotals = (producto: Producto): NormalizedLineTotals => {
  const qty = Math.max(1, Number(producto.cantidad) || 1);
  const netUnit = Number(producto.precio) || 0;
  const discountPercentHint = Number(producto.descuentoPorcentaje) || 0;
  const discountAmountHint = Number(producto.descuentoMonto) || 0;
  const originalUnitFromPct =
    discountPercentHint > 0 && netUnit > 0
      ? Math.round((netUnit / (1 - discountPercentHint / 100)) * 100) / 100
      : 0;
  const originalUnit = pickFirstNumber(
    producto.precioOriginal,
    originalUnitFromPct,
    producto.precio,
  );
  const netLineCandidate = toNumber(producto.subtotal);
  const originalLineCandidate = toNumber(producto.subtotalOriginal);

  const fallbackNetLine =
    producto.categoria === "Maderas" && isM2Unit(producto.unidad)
      ? netUnit
      : netUnit * qty;
  const netLine =
    netLineCandidate !== null && netLineCandidate > 0
      ? netLineCandidate
      : fallbackNetLine;

  const fallbackOriginalLine =
    producto.categoria === "Maderas" && isM2Unit(producto.unidad)
      ? originalUnit
      : originalUnit * qty;
  const originalLineFromMonto =
    discountAmountHint > 0 ? netLine + discountAmountHint : 0;
  const originalLine =
    originalLineCandidate !== null && originalLineCandidate > 0
      ? originalLineCandidate
      : originalLineFromMonto > 0
        ? originalLineFromMonto
        : fallbackOriginalLine;
  const discountAmount = Math.max(0, originalLine - netLine);
  const discountPercent =
    originalLine > 0 ? Math.round((discountAmount / originalLine) * 100) : 0;

  return {
    qty,
    netUnit,
    originalUnit,
    netLine: Math.round(netLine * 100) / 100,
    originalLine: Math.round(originalLine * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    discountPercent,
  };
};

function normalizeOrder(input: any): Order {
  const items = Array.isArray(input?.items)
    ? input.items.map((it: any) => ({
        id: it.id || it.productId || "",
        nombre: it.name || it.nombre || "",
        categoria: it.category || it.categoria || it.subcategory || "",
        cantidad: it.quantity || it.cantidad || 1,
        precio: pickFirstNumber(it.price, it.precio),
        precioOriginal: pickFirstNumber(
          it.originalUnitPrice,
          it.precioOriginal,
          it.listPrice,
          it.price,
          it.precio,
        ),
        subtotal: pickFirstNumber(it.totalPrice, it.subtotal, it.lineTotal),
        subtotalOriginal: pickFirstNumber(
          it.originalTotalPrice,
          it.subtotalOriginal,
        ),
        descuentoMonto: pickFirstNumber(
          it.discountAmount,
          it.descuentoMonto,
          it.discount?.amount,
        ),
        descuentoPorcentaje: pickFirstNumber(
          it.discountPercent,
          it.descuentoPorcentaje,
          it.discount?.percentage,
        ),
        unidad: it.unidad || it.unidadMedida || it.unit || "",
        alto: it.alto || 0,
        ancho: it.ancho || 0,
        largo: it.largo || 0,
        cepilladoAplicado: Boolean(it.cepilladoAplicado || it.cepillado),
        imagen:
          it.image ||
          it.imageUrl ||
          it.srcUrl ||
          it.imagen ||
          it.imagenUrl ||
          it?.atributos?.imagenUrl ||
          it?.atributos?.imagen ||
          it?.attributes?.imageUrl ||
          it?.attributes?.image ||
          it.thumbnailUrl ||
          it.thumbnail ||
          undefined,
      }))
    : Array.isArray(input?.productos)
      ? input.productos.map((it: any) => ({
          ...it,
          precio: pickFirstNumber(it.precio, it.price),
          precioOriginal: pickFirstNumber(
            it.precioOriginal,
            it.originalUnitPrice,
            it.listPrice,
            it.precio,
            it.price,
          ),
          subtotal: pickFirstNumber(it.subtotal, it.totalPrice, it.lineTotal),
          subtotalOriginal: pickFirstNumber(
            it.subtotalOriginal,
            it.originalTotalPrice,
          ),
          descuentoMonto: pickFirstNumber(
            it.descuentoMonto,
            it.discountAmount,
            it.discount?.amount,
          ),
          descuentoPorcentaje: pickFirstNumber(
            it.descuentoPorcentaje,
            it.discountPercent,
            it.discount?.percentage,
          ),
          categoria: it.categoria || it.category || it.subcategory || "",
          unidad: it.unidad || it.unidadMedida || it.unit || "",
          imagen:
            it.imagen ||
            it.image ||
            it.imageUrl ||
            it.srcUrl ||
            it.imagenUrl ||
            it?.atributos?.imagenUrl ||
            it?.atributos?.imagen ||
            it?.attributes?.imageUrl ||
            it?.attributes?.image ||
            it.thumbnailUrl ||
            it.thumbnail ||
            undefined,
        }))
      : [];

  const normalizedItems: NormalizedLineTotals[] = items.map((item: Producto) =>
    normalizeLineTotals(item),
  );
  const subtotalOriginal =
    Math.round(
      normalizedItems.reduce(
        (acc: number, item) =>
          acc + (Number.isFinite(item.originalLine) ? item.originalLine : 0),
        0,
      ) * 100,
    ) / 100;
  const subtotalNeto =
    Math.round(
      normalizedItems.reduce(
        (acc: number, item) =>
          acc + (Number.isFinite(item.netLine) ? item.netLine : 0),
        0,
      ) * 100,
    ) / 100;
  const descuentoProductos = Math.max(
    0,
    Math.round((subtotalOriginal - subtotalNeto) * 100) / 100,
  );
  const descuentoTransferencia = Math.max(
    0,
    pickFirstNumber(
      input?.transferenciaDiscount,
      input?.descuentoTransferencia,
      input?.discountTransferencia,
      input?.totales?.descuentoTransferencia,
      input?.totals?.transferDiscount,
    ),
  );
  const deliveryKind = detectDeliveryKind(input);
  const isRetiro = deliveryKind === "pickup";
  const shippingCandidate = Math.max(
    0,
    pickFirstNumber(
      input?.shippingPrice,
      input?.deliveryInfo?.shippingPrice,
      input?.deliveryInfo?.shippingEstimatedPrice,
      input?.deliveryInfo?.shippingCost,
      input?.deliveryInfo?.costoEnvio,
      input?.envio?.costo,
      input?.shippingCost,
      input?.costoEnvio,
      input?.totales?.costoEnvio,
      input?.totals?.shipping,
    ),
  );
  const totalOrder = Math.max(
    0,
    pickFirstNumber(input?.total, input?.totals?.total, input?.totales?.total),
  );
  const shippingFromTotals = Math.max(
    0,
    Math.round((totalOrder - (subtotalNeto - descuentoTransferencia)) * 100) /
      100,
  );
  const costoEnvio = isRetiro
    ? 0
    : shippingCandidate > 0
      ? shippingCandidate
      : shippingFromTotals;
  const apiTotal = Math.max(
    0,
    pickFirstNumber(input?.total, input?.totals?.total, input?.totales?.total),
  );
  const computedTotal =
    Math.round(
      Math.max(0, subtotalNeto - descuentoTransferencia + costoEnvio) * 100,
    ) / 100;
  const totalLooksLikeProductsOnly =
    apiTotal > 0 &&
    Math.abs(
      apiTotal -
        Math.round(Math.max(0, subtotalNeto - descuentoTransferencia) * 100) /
          100,
    ) < 0.01 &&
    costoEnvio > 0;
  const totalFinal =
    apiTotal > 0
      ? totalLooksLikeProductsOnly
        ? computedTotal
        : apiTotal
      : computedTotal;
  const delivery = {
    estado:
      input?.envio?.estado ||
      input?.deliveryInfo?.status ||
      input?.deliveryInfo?.deliveryStatus ||
      "pendiente",
    direccion:
      input?.envio?.direccion ||
      input?.deliveryInfo?.address ||
      input?.deliveryInfo?.direccion ||
      "",
    transportista:
      input?.envio?.transportista ||
      input?.deliveryInfo?.deliveryMethod ||
      input?.deliveryInfo?.transportista ||
      "",
    fechaEntrega:
      input?.envio?.fechaEntrega ||
      input?.deliveryInfo?.deliveryDate ||
      input?.deliveryInfo?.fechaEntrega ||
      input?.fechaEntrega ||
      input?.createdAt ||
      new Date().toISOString(),
    tipo:
      (() => {
        const metodoEntrega = String(
          input?.deliveryInfo?.metodoEntrega ||
            input?.envio?.metodoEntrega ||
            input?.deliveryInfo?.deliveryType ||
            "",
        ).trim();
        const envioTipo = String(input?.envio?.tipo || "").trim();
        const base = metodoEntrega || envioTipo;
        if (deliveryKind === "pickup") return base || "retiro";
        if (deliveryKind === "shipping") return base || "envío";
        return base;
      })(),
    costo: costoEnvio,
    storeId:
      input?.envio?.storeId ||
      input?.envio?.storeID ||
      input?.deliveryInfo?.storeId ||
      input?.deliveryInfo?.storeID ||
      input?.deliveryInfo?.store?.id ||
      null,
    sucursal:
      input?.envio?.sucursal ||
      input?.deliveryInfo?.sucursal ||
      input?.deliveryInfo?.store ||
      input?.deliveryInfo?.storeName ||
      "",
  } as Envio;

  const cliente =
    input?.cliente ||
    ({
      nombre:
        input?.customerInfo?.fullName || input?.customerInfo?.nombre || "",
      telefono:
        input?.customerInfo?.phone || input?.customerInfo?.telefono || "",
    } as Cliente);

  return {
    id: input?.id || input?.orderId || "",
    numeroPedido: input?.numeroPedido || input?.orderId || "",
    estado: input?.estado || input?.status || "pendiente",
    total: totalFinal,
    fecha: input?.fecha || input?.createdAt || new Date().toISOString(),
    fechaEntrega:
      input?.fechaEntrega || delivery?.fechaEntrega || new Date().toISOString(),
    medioPago:
      input?.medioPago ||
      input?.paymentMethod ||
      input?.metodoPago ||
      input?.payment_method ||
      input?.pago?.metodo ||
      "",
    productos: items,
    envio: {
      estado: delivery?.estado || "pendiente",
      direccion: delivery?.direccion || "",
      transportista: delivery?.transportista || "",
      fechaEntrega: delivery?.fechaEntrega || new Date().toISOString(),
      tipo: delivery?.tipo || "",
      costo: typeof delivery?.costo === "number" ? delivery.costo : 0,
      storeId: delivery?.storeId ?? null,
      sucursal: delivery?.sucursal || "",
    },
    cliente: {
      nombre: cliente?.nombre || "",
      telefono: cliente?.telefono || "",
    },
    resumen: {
      subtotalOriginal,
      subtotalNeto,
      descuentoProductos,
      descuentoTransferencia,
      costoEnvio: costoEnvio,
    },
  };
}

export default function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { user: session, isLoading: loadingState } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productImagesById, setProductImagesById] = useState<
    Record<string, string>
  >({});
  const [pickupStore, setPickupStore] = useState<any | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!session?.email) {
        setLoading(false);
        return;
      }
      try {
        const response = await api.get<any>(
          `/orders/${encodeURIComponent(params.id)}`,
        );
        const payload =
          response && typeof response === "object" && "data" in response
            ? response.data
            : response;
        const maybeOrder = Array.isArray(payload) ? payload[0] : payload;
        if (maybeOrder && typeof maybeOrder === "object") {
          const normalized = normalizeOrder(maybeOrder);
          const rawKind = detectDeliveryKind(maybeOrder);
          const normalizedKind = detectDeliveryKindFromNormalized(normalized.envio);
          const needsListFallback =
            !String(normalized.medioPago || "").trim() ||
            (!String(normalized.envio?.transportista || "").trim() &&
              !String(normalized.envio?.tipo || "").trim()) ||
            (!String(normalized.envio?.direccion || "").trim() &&
              !!String(
                normalized.envio?.tipo || normalized.envio?.transportista || "",
              ).trim()) ||
            rawKind === "unknown" ||
            normalizedKind === "unknown";

          if (needsListFallback) {
            try {
              const listResponse = await api.get<any>(
                `/orders?userId=${encodeURIComponent(session.email)}`,
              );
              const listPayload =
                listResponse && typeof listResponse === "object" && "data" in listResponse
                  ? (listResponse as any).data
                  : listResponse;
              const list = Array.isArray(listPayload)
                ? listPayload
                : (listPayload && typeof listPayload === "object" && Array.isArray((listPayload as any).data))
                  ? (listPayload as any).data
                  : [];

              const rawMatch = list.find((o: any) => {
                const oid = String(o?.id || o?.orderId || "").trim();
                const opn = String(o?.numeroPedido || o?.orderNumber || "").trim();
                return oid === String(normalized.id || "").trim() || opn === String(normalized.numeroPedido || "").trim();
              });

              if (rawMatch) {
                const medio =
                  rawMatch?.medioPago ||
                  rawMatch?.paymentMethod ||
                  rawMatch?.metodoPago ||
                  rawMatch?.payment_method ||
                  rawMatch?.pago?.metodo ||
                  "";
                if (!String(normalized.medioPago || "").trim()) {
                  normalized.medioPago = String(medio || "");
                }

                const rawEnvio =
                  rawMatch?.envio || rawMatch?.deliveryInfo || rawMatch?.shipping || {};
                if (!String(normalized.envio?.estado || "").trim()) {
                  normalized.envio.estado = String(rawEnvio?.estado || "");
                }
                if (!String(normalized.envio?.direccion || "").trim()) {
                  normalized.envio.direccion = String(
                    rawEnvio?.direccion || rawEnvio?.address || "",
                  );
                }
                if (!String(normalized.envio?.transportista || "").trim()) {
                  normalized.envio.transportista = String(
                    rawEnvio?.transportista ||
                      rawEnvio?.deliveryMethod ||
                      rawEnvio?.metodoEntrega ||
                      "",
                  );
                }
                if (!String(normalized.envio?.tipo || "").trim()) {
                  normalized.envio.tipo = String(
                    rawEnvio?.tipo ||
                      rawEnvio?.metodoEntrega ||
                      rawEnvio?.deliveryMethod ||
                      "",
                  );
                }
                if (!String(normalized.envio?.fechaEntrega || "").trim()) {
                  normalized.envio.fechaEntrega = String(
                    rawEnvio?.fechaEntrega || rawEnvio?.deliveryDate || "",
                  );
                }
                if (!(normalized.envio as any)?.storeId) {
                  (normalized.envio as any).storeId =
                    rawEnvio?.storeId ||
                    rawEnvio?.storeID ||
                    rawEnvio?.store?.id ||
                    null;
                }
                if (!(normalized.envio as any)?.sucursal) {
                  (normalized.envio as any).sucursal =
                    rawEnvio?.sucursal || rawEnvio?.store || rawEnvio?.storeName || "";
                }
              }
            } catch {}
          }
          setOrder(normalized);
        } else {
          setError("Pedido no encontrado");
        }
      } catch (error) {
        console.error("Error al obtener el pedido:", error);
        setError("Ocurrió un error al cargar el pedido");
      } finally {
        setLoading(false);
      }
    };
    if (session) {
      fetchOrder();
    } else if (!loadingState) {
      setLoading(false);
    }
  }, [session, loadingState, params.id]);

  useEffect(() => {
    const loadMissingImages = async () => {
      if (!order?.productos?.length) return;
      const missing = order.productos
        .filter((p) => !p.imagen && String(p.id || "").trim().length > 0)
        .map((p) => String(p.id).trim());
      const uniqueIds = Array.from(new Set(missing));
      if (uniqueIds.length === 0) return;

      try {
        const sanitizeImageUrl = (rawUrl: any): string => {
          const value = String(rawUrl || "").trim();
          if (!value) return "";
          const cleaned = value
            .replace(/`/g, "")
            .replace(/^"+|"+$/g, "")
            .replace(/^'+|'+$/g, "")
            .replace(/%7C/gi, "|")
            .replace(/\s+\|\s+/g, "|")
            .trim();

          const hasManyUrls = (cleaned.match(/https?:\/\//g) || []).length > 1;
          if (hasManyUrls) {
            const matches = cleaned.match(/https?:\/\/[^\s"|,]+/g) || [];
            return String(matches[0] || "").trim();
          }

          if (cleaned.includes("|") || cleaned.includes(",")) {
            const first =
              cleaned
                .split(/[|,]/g)
                .map((s) => s.trim())
                .filter(Boolean)[0] || "";
            return String(first).trim();
          }

          return cleaned;
        };

        const results = await Promise.all(
          uniqueIds.map(async (oneId) => {
            try {
              return await api.get<any>(
                `/products/${encodeURIComponent(oneId)}`,
              );
            } catch {
              return null;
            }
          }),
        );
        const items = results.filter(Boolean);

        const next: Record<string, string> = {};
        for (const it of items) {
          const id = String(it?.id || "").trim();
          const url = sanitizeImageUrl(it?.srcUrl || it?.images?.[0]);
          if (!id || !url) continue;
          if (url === "/placeholder.png") continue;
          next[id] = url;
        }
        if (Object.keys(next).length > 0) {
          setProductImagesById((prev) => ({ ...prev, ...next }));
        }
      } catch {
        // no-op
      }
    };

    loadMissingImages();
  }, [order?.id, order?.productos]);

  const envio = order?.envio;
  const pickupStoreId = String((envio as any)?.storeId || "").trim();
  const pickupType = String(envio?.tipo || "");
  const pickupCarrier = String(envio?.transportista || "");
  const pickupSucursalRaw = (envio as any)?.sucursal;
  const pickupSucursalName =
    typeof pickupSucursalRaw === "string"
      ? pickupSucursalRaw
      : pickupSucursalRaw && typeof pickupSucursalRaw === "object"
        ? String(
            pickupSucursalRaw?.nombre ||
              pickupSucursalRaw?.name ||
              pickupSucursalRaw?.title ||
              "",
          ).trim()
        : "";

  useEffect(() => {
    const isPickup = detectDeliveryKindFromNormalized(envio) === "pickup";
    if (!isPickup) {
      setPickupStore(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const settings = await api.get<any>(`/settings/general`);
        const locations = Array.isArray((settings as any)?.locations)
          ? (settings as any).locations
          : [];
        const match = locations.find((loc: any) => {
          const id = String(loc?.id || loc?.storeId || loc?.storeID || "").trim();
          const name = String(loc?.nombre || loc?.name || "").trim();
          if (pickupStoreId && id) return id === pickupStoreId;
          if (pickupSucursalName && name)
            return name.toLowerCase() === pickupSucursalName.toLowerCase();
          return false;
        });
        const fallback =
          match ||
          locations.find(
            (loc: any) =>
              Boolean(
                loc?.principal ||
                  loc?.isDefault ||
                  loc?.default ||
                  loc?.esPrincipal ||
                  loc?.defaultStore,
              ) ||
              String(loc?.nombre || loc?.name || loc?.title || "")
                .toLowerCase()
                .includes("principal"),
          ) ||
          (locations.length === 1 ? locations[0] : null);
        if (!cancelled) setPickupStore(fallback || null);
      } catch {
        if (!cancelled) setPickupStore(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [envio, pickupType, pickupCarrier, pickupStoreId, pickupSucursalName]);

  if (loadingState || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[rgb(var(--brand-600))]"></div>
      </div>
    );
  }

  if (!session && !loadingState) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Primero inicia sesión</h1>
        <button
          onClick={() => {
            const redirect = window.location.pathname + window.location.search;
            window.dispatchEvent(new CustomEvent("open-login", { detail: { redirect } }));
            const url = new URL(window.location.href);
            url.searchParams.set("login", "open");
            url.searchParams.set("redirect", redirect);
            window.history.replaceState({}, "", url.toString());
          }}
          className="btn-brand px-6 py-3 rounded-full transition"
        >
          Iniciar Sesión
        </button>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="mb-6">
          {error || "No pudimos encontrar el pedido solicitado."}
        </p>
        <Link
          href="/orders"
          className="btn-brand px-6 py-3 rounded-full transition"
        >
          Volver a mis pedidos
        </Link>
      </div>
    );
  }

  const isPickup = detectDeliveryKindFromNormalized(order?.envio) === "pickup";
  const rawSucursal = (order.envio as any)?.sucursal;
  const sucursalDireccion =
    rawSucursal && typeof rawSucursal === "object"
      ? String(rawSucursal?.direccion || rawSucursal?.address || rawSucursal?.location?.address || "").trim()
      : "";
  const pickupAddressFromOrder = String(order.envio.direccion || "").trim();
  const resolvedPickupAddress = String(
    sucursalDireccion ||
      pickupStore?.direccion ||
      pickupStore?.address ||
      ((pickupStoreId || pickupSucursalName) ? pickupAddressFromOrder : "") ||
      "",
  ).trim();
  const resolvedPickupSucursal = String(
    pickupSucursalName ||
      pickupStore?.nombre ||
      pickupStore?.name ||
      pickupStore?.title ||
      "",
  ).trim();

  return (
    <div className="min-h-screen p-4 bg-[rgb(var(--page-bg))]">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Link
            href="/orders"
            className="inline-flex items-center text-[rgb(var(--brand-700))] hover:text-[rgb(var(--brand-900))] transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Volver a mis pedidos
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="surface-card p-6 rounded-xl overflow-hidden"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">
                Pedido #{order.numeroPedido}
              </h1>
              <p className="text-sm text-[rgb(var(--brand-700)/0.75)]">
                {new Date(order.fecha).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            <div className="mt-2 md:mt-0 flex items-center gap-2">
              {order.estado === "pagado" ? (
                <div className="flex items-center text-green-600 bg-green-50 px-4 py-2 rounded-full">
                  <CheckCircleIcon className="h-5 w-5 mr-1" />
                  <span>Pagado</span>
                </div>
              ) : order.estado === "pendiente" ? (
                <div className="flex items-center text-yellow-600 bg-yellow-50 px-4 py-2 rounded-full">
                  <ClockIcon className="h-5 w-5 mr-1" />
                  <span>Pendiente</span>
                </div>
              ) : (
                <div className="flex items-center text-red-600 bg-red-50 px-4 py-2 rounded-full">
                  <XCircleIcon className="h-5 w-5 mr-1" />
                  <span>{order.estado}</span>
                </div>
              )}
              {String(order.medioPago || "")
                .toLowerCase()
                .includes("transfer") && (
                <span className="inline-flex items-center rounded-full bg-[rgb(var(--brand-700))] text-white px-3 py-1 text-xs font-semibold">
                  Transferencia aplicada
                </span>
              )}
            </div>
          </div>

          {/* Productos del pedido */}
          <div className="mb-8">
            <h2 className="font-medium text-xl mb-4">Productos del pedido</h2>
            <div className="space-y-4">
              {order.productos && order.productos.length > 0 ? (
                order.productos.map((producto, idx) => {
                  const pricing = normalizeLineTotals(producto);
                  const hasItemDiscount = pricing.discountAmount > 0;
                  const dims = [
                    producto.ancho,
                    producto.largo,
                    producto.alto,
                  ].map((n) => Number(n) || 0);
                  const hasDims = dims.some((n) => n > 0);
                  const imageSrc =
                    producto.imagen ||
                    productImagesById[String(producto.id || "").trim()] ||
                    "";
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      className="flex items-start p-6 bg-[rgb(var(--brand-50))] rounded-lg hover:bg-[rgb(var(--brand-100))] transition-colors duration-200 border border-[rgb(var(--brand-600)/0.10)]"
                    >
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden mr-6 flex-shrink-0">
                        {imageSrc ? (
                          <ProductImage
                            src={imageSrc}
                            alt={producto.nombre}
                            width={96}
                            height={96}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-[rgb(var(--brand-100))] rounded-lg flex items-center justify-center border border-[rgb(var(--brand-600)/0.12)]">
                            <span className="text-[rgb(var(--brand-800))] text-xs text-center">
                              Sin imagen
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg text-[rgb(var(--foreground-rgb))] mb-1">
                              {producto.nombre}
                            </h3>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {producto.categoria && (
                                <span className="text-sm bg-[rgb(var(--brand-100))] text-[rgb(var(--brand-800))] border border-[rgb(var(--brand-600)/0.14)] px-3 py-1 rounded-full">
                                  {producto.categoria}
                                </span>
                              )}
                              {producto.cepilladoAplicado && (
                                <span className="text-sm bg-[rgb(var(--brand-50))] text-[rgb(var(--brand-800))] border border-[rgb(var(--brand-600)/0.14)] px-3 py-1 rounded-full">
                                  Cepillado aplicado
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            {/* <p className="text-sm text-[rgb(var(--brand-700)/0.75)]">
                            {producto.unidad === "M2" && producto.categoria === "Maderas" 
                              ? "Precio total" 
                              : "Precio unitario"
                            }
                          </p>
                          <p className="font-bold text-lg text-[rgb(var(--foreground-rgb))]">
                            ${Number(pricing.netUnit).toLocaleString()}
                          </p>
                          {hasItemDiscount && (
                            <p className="text-xs text-[rgb(var(--brand-700)/0.45)] line-through">
                              ${Number(pricing.originalUnit).toLocaleString()}
                            </p>
                          )} */}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 align-center">
                          <div>
                            <p className="text-sm text-[rgb(var(--brand-700)/0.75)]">
                              {isM2Unit(producto.unidad) &&
                              producto.categoria === "Maderas"
                                ? "Precio total"
                                : "Precio unitario"}
                            </p>
                            <p className="text-lg text-[rgb(var(--foreground-rgb))]">
                              ${Number(pricing.netUnit).toLocaleString()}
                            </p>
                            {hasItemDiscount && (
                              <p className="text-xs text-[rgb(var(--brand-700)/0.45)] line-through">
                                ${Number(pricing.originalUnit).toLocaleString()}
                              </p>
                            )}
                          </div>

                          <div>
                            <p className="text-xs text-[rgb(var(--brand-700)/0.75)] uppercase tracking-wide">
                              Cantidad
                            </p>
                            <p className="font-medium">
                              {producto.cantidad} {producto.unidad}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-[rgb(var(--brand-700)/0.75)] uppercase tracking-wide">
                              Subtotal
                            </p>
                            <p className="font-bold">
                              ${Number(pricing.netLine).toLocaleString()}
                            </p>
                            {hasItemDiscount && (
                              <p className="font-bold text-xs text-[rgb(var(--brand-700)/0.45)] line-through">
                                ${Number(pricing.originalLine).toLocaleString()}
                              </p>
                            )}
                          </div>
                          {/* <div>
                          <p className="text-xs text-[rgb(var(--brand-700)/0.75)] uppercase tracking-wide">Unidad</p>
                          <p className="font-medium">{producto.unidad}</p>
                        </div> */}
                        </div>
                        {hasItemDiscount && (
                          <p className="text-xs text-green-700 font-medium">
                            Descuento aplicado: -$
                            {Number(pricing.discountAmount).toLocaleString()}
                            {pricing.discountPercent > 0
                              ? ` (${pricing.discountPercent}%)`
                              : ""}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <p className="text-[rgb(var(--brand-700)/0.75)] italic text-center py-8">
                  No hay productos en este pedido
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h2 className="font-medium text-xl mb-3">
                Información del cliente
              </h2>
              <div className="bg-[rgb(var(--brand-50))] p-4 rounded-lg border border-[rgb(var(--brand-600)/0.10)]">
                <p className="text-sm mb-2">
                  <span className="font-medium">Nombre:</span>{" "}
                  {order.cliente.nombre}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Teléfono:</span>{" "}
                  {order.cliente.telefono}
                </p>
              </div>
            </div>
            <div>
              <h2 className="font-medium text-xl mb-3">
                {isPickup ? "Información de retiro" : "Información de envío"}
              </h2>
              <div className="bg-[rgb(var(--brand-50))] p-4 rounded-lg border border-[rgb(var(--brand-600)/0.10)]">
                <p className="text-sm mb-2">
                  <span className="font-medium">Estado:</span>
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      order.envio.estado === "entregado"
                        ? "bg-green-100 text-green-800"
                        : order.envio.estado === "en camino"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {order.envio.estado}
                  </span>
                </p>
                {isPickup ? (
                  <>
                    <p className="text-sm mb-2">
                      <span className="font-medium">Sucursal:</span>{" "}
                      {resolvedPickupSucursal || "A confirmar"}
                    </p>
                    <p className="text-sm mb-2">
                      <span className="font-medium">Dirección de retiro:</span>{" "}
                      {resolvedPickupAddress || "A confirmar"}
                    </p>
                    <p className="text-sm mb-2">
                      <span className="font-medium">Costo:</span> $0
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Disponibilidad:</span>{" "}
                      {getEntregaLabel(
                        order.envio.estado,
                        order.envio.fechaEntrega,
                      )}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm mb-2">
                      <span className="font-medium">Dirección de envío:</span>{" "}
                      {String(order.envio.direccion || "").trim() || "A confirmar"}
                    </p>
                    <p className="text-sm mb-2">
                      <span className="font-medium">Transportista:</span>{" "}
                      {String(order.envio.transportista || "").trim() || "A confirmar"}
                    </p>
                    <p className="text-sm mb-2">
                      <span className="font-medium">Costo de envío:</span> $
                      {Number(order.resumen.costoEnvio || 0).toLocaleString()}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Fecha de entrega:</span>{" "}
                      {getEntregaLabel(
                        order.envio.estado,
                        order.envio.fechaEntrega,
                      )}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h2 className="font-medium text-xl mb-3">Detalles del pago</h2>
              <div className="bg-[rgb(var(--brand-50))] p-4 rounded-lg border border-[rgb(var(--brand-600)/0.10)]">
                <p className="text-sm mb-2">
                  <span className="font-medium">Estado:</span>
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      order.estado === "pagado"
                        ? "bg-green-100 text-green-800"
                        : order.estado === "pendiente"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {order.estado}
                  </span>
                </p>
                {(() => {
                  const payment = normalizePaymentMethod(order.medioPago);
                  const pill =
                    payment.kind === "efectivo"
                      ? "bg-[rgb(var(--brand-700))] text-white"
                      : payment.kind === "mercadopago"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-700";
                  return (
                    <p className="text-sm">
                      <span className="font-medium">Medio de pago:</span>{" "}
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${pill}`}
                      >
                        {payment.label}
                      </span>
                    </p>
                  );
                })()}
              </div>
            </div>
            <div>
              <h2 className="font-medium text-xl mb-3">Fechas importantes</h2>
              <div className="bg-[rgb(var(--brand-50))] p-4 rounded-lg border border-[rgb(var(--brand-600)/0.10)]">
                <p className="text-sm mb-2">
                  <span className="font-medium">Fecha del pedido:</span>{" "}
                  {formatDateEs(order.fecha)}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Fecha de entrega:</span>{" "}
                  {getEntregaLabel(
                    order.envio.estado,
                    order.envio.fechaEntrega || order.fechaEntrega,
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h2 className="font-medium text-xl mb-3">Resumen de costos</h2>
              <div className="bg-[rgb(var(--brand-50))] p-4 rounded-lg space-y-2 border border-[rgb(var(--brand-600)/0.10)]">
                <div className="flex justify-between text-sm">
                  <span className="text-[rgb(var(--brand-700))]">Subtotal</span>
                  <span className="text-[rgb(var(--foreground-rgb))]">
                    {order.resumen.descuentoProductos > 0 ? (
                      <>
                        <span className="text-[rgb(var(--brand-700)/0.45)] line-through mr-2">
                          ${order.resumen.subtotalOriginal.toLocaleString()}
                        </span>
                        <span>
                          ${order.resumen.subtotalNeto.toLocaleString()}
                        </span>
                      </>
                    ) : (
                      <>${order.resumen.subtotalNeto.toLocaleString()}</>
                    )}
                  </span>
                </div>
                {order.resumen.descuentoProductos > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[rgb(var(--brand-700))]">
                      Descuento en productos
                    </span>
                    <span className="text-green-700">
                      -${order.resumen.descuentoProductos.toLocaleString()}
                    </span>
                  </div>
                )}
                {order.resumen.descuentoTransferencia > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[rgb(var(--brand-700))]">
                      Descuento por efectivo
                    </span>
                    <span className="text-green-700">
                      -${order.resumen.descuentoTransferencia.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-[rgb(var(--brand-700))]">Envío</span>
                  <span className="text-[rgb(var(--foreground-rgb))]">
                    {isPickup
                      ? "Sin costo"
                      : `$${Number(order.resumen.costoEnvio || 0).toLocaleString()}`}
                  </span>
                </div>
                <div className="flex justify-between text-base font-semibold border-t border-[rgb(var(--brand-600)/0.12)] pt-3">
                  <span className="text-[rgb(var(--foreground-rgb))]">
                    Total
                  </span>
                  <span className="text-[rgb(var(--foreground-rgb))]">
                    ${order.total.toLocaleString()}
                  </span>
                </div>
                {String(order.medioPago || "")
                  .toLowerCase()
                  .includes("transfer") && (
                  <p className="text-[12px] text-[rgb(var(--brand-700))] mt-2">
                    Se aplicó un descuento por efectivo sobre el total de
                    productos.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-[rgb(var(--brand-600)/0.12)] pt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <p className="text-sm text-[rgb(var(--brand-700)/0.75)]">
                  Total del pedido
                </p>
                <p className="text-3xl font-bold text-[rgb(var(--foreground-rgb))]">
                  ${order.total.toLocaleString()}
                </p>
              </div>
              <div className="flex flex-col items-start md:items-end">
                <p className="text-sm text-[rgb(var(--brand-700)/0.75)]">
                  {isPickup ? "Estado del retiro" : "Estado del envío"}
                </p>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    order.envio.estado === "entregado"
                      ? "bg-green-100 text-green-800"
                      : order.envio.estado === "en camino"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {order.envio.estado}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

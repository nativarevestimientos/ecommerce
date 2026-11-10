"use client";

import { useEffect, useState } from "react";
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api'
import Link from "next/link";
import { CheckCircleIcon, ClockIcon, XCircleIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { motion } from "framer-motion";
import { ProductImage } from '@/components/ui/ProductImage'
import { Skeleton } from "@/components/ui/skeleton";

// Define a type for the product based on the external API structure
interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  cantidad: number;
  precio: number;
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
}

// Define the API response structure
interface OrdersApiResponse {
  success: boolean;
  data: Order[];
}

const toNumber = (value: any): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(/\./g, "").replace(",", ".").trim();
    const n = Number(normalized);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

const pickFirstNumber = (...values: any[]): number => {
  for (const v of values) {
    const n = toNumber(v);
    if (n !== null) return n;
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

const normalizeProducto = (raw: any): Producto => {
  const cantidad = pickFirstNumber(raw?.cantidad, raw?.quantity, 1) || 1;
  const precio = pickFirstNumber(raw?.precio, raw?.price, 0);
  return {
    id: raw?.id || raw?.productId || "",
    nombre: raw?.nombre || raw?.name || "",
    categoria: raw?.categoria || raw?.category || raw?.subcategory || "",
    cantidad: typeof cantidad === "number" ? cantidad : 1,
    precio,
    unidad: raw?.unidad || raw?.unidadMedida || raw?.unit || "",
    alto: pickFirstNumber(raw?.alto, 0),
    ancho: pickFirstNumber(raw?.ancho, 0),
    largo: pickFirstNumber(raw?.largo, 0),
    cepilladoAplicado: Boolean(raw?.cepilladoAplicado || raw?.cepillado),
    imagen:
      raw?.imagen ||
      raw?.image ||
      raw?.imageUrl ||
      raw?.srcUrl ||
      raw?.imagenUrl ||
      raw?.atributos?.imagenUrl ||
      raw?.atributos?.imagen ||
      raw?.attributes?.imageUrl ||
      raw?.attributes?.image ||
      raw?.thumbnailUrl ||
      raw?.thumbnail ||
      undefined,
  };
};

const computeOrderTotal = (rawOrder: any, productos: Producto[]): number => {
  const subtotalNeto = Math.round(
    productos.reduce((acc, p) => {
      const qty = Math.max(1, Number(p.cantidad) || 1);
      const unit = Number(p.precio) || 0;
      const line = p.categoria === "Maderas" && isM2Unit(p.unidad) ? unit : unit * qty;
      return acc + (Number.isFinite(line) ? line : 0);
    }, 0) * 100
  ) / 100;

  const descuentoTransferencia = Math.max(
    0,
    pickFirstNumber(
      rawOrder?.transferenciaDiscount,
      rawOrder?.descuentoTransferencia,
      rawOrder?.discountTransferencia,
      rawOrder?.totales?.descuentoTransferencia,
      rawOrder?.totals?.transferDiscount
    )
  );

  const isRetiro = detectDeliveryKind(rawOrder) === "pickup";

  const shippingCandidate = Math.max(
    0,
    pickFirstNumber(
      rawOrder?.shippingPrice,
      rawOrder?.deliveryInfo?.shippingPrice,
      rawOrder?.deliveryInfo?.shippingEstimatedPrice,
      rawOrder?.deliveryInfo?.shippingCost,
      rawOrder?.deliveryInfo?.costoEnvio,
      rawOrder?.envio?.costo,
      rawOrder?.shippingCost,
      rawOrder?.costoEnvio,
      rawOrder?.totales?.costoEnvio,
      rawOrder?.totals?.shipping
    )
  );

  const apiTotal = Math.max(0, pickFirstNumber(rawOrder?.total, rawOrder?.totals?.total, rawOrder?.totales?.total));
  const computedTotal = Math.round(Math.max(0, subtotalNeto - descuentoTransferencia + (isRetiro ? 0 : shippingCandidate)) * 100) / 100;

  const productsOnlyTotal = Math.round(Math.max(0, subtotalNeto - descuentoTransferencia) * 100) / 100;
  const totalLooksLikeProductsOnly =
    apiTotal > 0 &&
    Math.abs(apiTotal - productsOnlyTotal) < 0.01 &&
    !isRetiro &&
    shippingCandidate > 0;

  return apiTotal > 0 ? (totalLooksLikeProductsOnly ? computedTotal : apiTotal) : computedTotal;
};

const normalizeOrder = (raw: any): Order => {
  const productos = Array.isArray(raw?.productos)
    ? raw.productos.map(normalizeProducto)
    : Array.isArray(raw?.items)
    ? raw.items.map(normalizeProducto)
    : [];

  const total = computeOrderTotal(raw, productos);

  return {
    id: raw?.id || raw?.orderId || "",
    numeroPedido: raw?.numeroPedido || raw?.orderId || "",
    estado: raw?.estado || raw?.status || "pendiente",
    total,
    fecha: raw?.fecha || raw?.createdAt || new Date().toISOString(),
    fechaEntrega: raw?.fechaEntrega || raw?.deliveryInfo?.deliveryDate || new Date().toISOString(),
    medioPago: raw?.medioPago || raw?.paymentMethod || raw?.metodoPago || raw?.payment_method || raw?.pago?.metodo || "",
    productos,
    envio: {
      estado: raw?.envio?.estado || raw?.deliveryInfo?.status || raw?.deliveryInfo?.deliveryStatus || "pendiente",
      direccion: raw?.envio?.direccion || raw?.deliveryInfo?.address || raw?.deliveryInfo?.direccion || "",
      transportista: raw?.envio?.transportista || raw?.deliveryInfo?.deliveryMethod || raw?.deliveryInfo?.transportista || "",
      fechaEntrega:
        raw?.envio?.fechaEntrega ||
        raw?.deliveryInfo?.deliveryDate ||
        raw?.deliveryInfo?.fechaEntrega ||
        raw?.fechaEntrega ||
        raw?.createdAt ||
        new Date().toISOString(),
      tipo: raw?.envio?.tipo || raw?.deliveryInfo?.metodoEntrega || raw?.deliveryInfo?.deliveryMethod || "",
      storeId: raw?.envio?.storeId || raw?.envio?.storeID || raw?.deliveryInfo?.storeId || raw?.deliveryInfo?.storeID || raw?.deliveryInfo?.store?.id || null,
      sucursal: raw?.envio?.sucursal || raw?.deliveryInfo?.sucursal || raw?.deliveryInfo?.store || raw?.deliveryInfo?.storeName || "",
    },
    cliente: {
      nombre: raw?.cliente?.nombre || raw?.customerInfo?.fullName || raw?.customerInfo?.nombre || "",
      telefono: raw?.cliente?.telefono || raw?.customerInfo?.phone || raw?.customerInfo?.telefono || "",
    },
  };
};

// Función para calcular el precio correcto según la unidad del producto
const calcularPrecioProducto = (producto: Producto): number => {
  // Para productos de madera con unidad M2, el precio ya incluye la cantidad
  if (producto.categoria === "Maderas" && producto.unidad === "M2") {
    return producto.precio;
  }
  // Para todos los demás productos, multiplicar precio por cantidad
  return producto.precio * producto.cantidad;
};

export default function OrdersPage() {
  const { user: session, isLoading: loadingState } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productImagesById, setProductImagesById] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchOrders = async () => {
      if (!session?.email) {
        setLoading(false);
        return;
      }
      try {
        const response = await api.get<any>(`/orders?userId=${encodeURIComponent(session.email)}`);
        const payload =
          response && typeof response === "object" && "data" in response ? (response as any).data : response;
        const rawOrders: any[] = Array.isArray(payload)
          ? payload
          : (payload && typeof payload === "object" && Array.isArray((payload as any).data))
          ? (payload as any).data
          : [];
        const normalized = rawOrders.map(normalizeOrder);

        const sortedOrders = normalized.sort((a, b) => {
          const dateA = new Date(a.fecha || 0);
          const dateB = new Date(b.fecha || 0);
          return dateB.getTime() - dateA.getTime();
        });
        
        setOrders(sortedOrders);
      } catch (error) {
        console.error("Error al obtener los pedidos:", error);
        setError("Ocurrió un error al cargar tus pedidos");
      } finally {
        setLoading(false);
      }
    };
    if (session) {
      fetchOrders();
    } else if (!loadingState) {
      setLoading(false);
    }
  }, [session, loadingState]);

  useEffect(() => {
    const loadMissingImages = async () => {
      if (!orders.length) return;

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
          const first = cleaned.split(/[|,]/g).map((s) => s.trim()).filter(Boolean)[0] || "";
          return String(first).trim();
        }

        return cleaned;
      };

      const missingIds: string[] = [];
      for (const order of orders) {
        for (const p of order.productos || []) {
          const id = String(p?.id || "").trim();
          if (!id) continue;
          if (p?.imagen) continue;
          if (productImagesById[id]) continue;
          missingIds.push(id);
        }
      }

      const uniqueIds = Array.from(new Set(missingIds));
      if (uniqueIds.length === 0) return;

      try {
        const results = await Promise.all(
          uniqueIds.map(async (oneId) => {
            try {
              return await api.get<any>(`/products/${encodeURIComponent(oneId)}`);
            } catch {
              return null;
            }
          })
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
      } catch {}
    };

    loadMissingImages();
  }, [orders, productImagesById]);

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

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="mb-6">{error}</p>
        <Link
          href="/"
          className="btn-brand px-6 py-3 rounded-full transition"
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-[rgb(var(--page-bg))]">
      <div className="max-w-5xl mx-auto">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-bold mb-8 text-center"
        >
          Mis Pedidos
        </motion.h1>
        
        {orders.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="surface-card p-10 rounded-xl text-center"
          >
            <div className="mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <p className="text-gray-600 mb-6 text-lg">No tienes pedidos aún.</p>
            <Link
              href="/shop"
              className="btn-brand px-8 py-3 rounded-full transition inline-block transform hover:scale-105 duration-300"
            >
              Ir a la tienda
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {orders.map((order: Order, index: number) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="surface-card p-6 rounded-xl overflow-hidden"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold">Pedido #{order.numeroPedido}</h2>
                    <p className="text-sm text-gray-500">
                      {new Date(order.fecha).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
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
                    {(() => {
                      const deliveryKind = detectDeliveryKindFromNormalized(order.envio);
                      const label =
                        deliveryKind === "pickup"
                          ? "Retiro en sucursal"
                          : deliveryKind === "shipping"
                          ? "Envío a domicilio"
                          : "";
                      const pill =
                        deliveryKind === "pickup"
                          ? "bg-[rgb(var(--brand-700))] text-white"
                          : deliveryKind === "shipping"
                          ? "bg-[rgb(var(--brand-50))] text-[rgb(var(--brand-800))] border border-[rgb(var(--brand-600)/0.18)]"
                          : "";
                      if (!label) return null;
                      return (
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${pill}`}>
                          {label}
                        </span>
                      );
                    })()}
                    {String(order.medioPago || "").toLowerCase().includes("transfer") && (
                      <span className="inline-flex items-center rounded-full bg-[rgb(var(--brand-700))] text-white px-3 py-1 text-xs font-semibold">
                        Transferencia aplicada
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="font-medium mb-2">Productos</h3>
                  <div className="space-y-3">
                    {order.productos && order.productos.length > 0 ? (
                      order.productos.slice(0, 2).map((producto, idx) => {
                        const imageSrc = producto.imagen || productImagesById[String(producto.id || "").trim()] || "";
                        return (
                        <div key={idx} className="flex items-center p-3 bg-[rgb(var(--brand-50))] rounded-lg border border-[rgb(var(--brand-600)/0.12)]">
                          <div className="w-20 h-20 rounded-md overflow-hidden mr-4 flex-shrink-0">
                            {imageSrc ? (
                              <ProductImage
                                src={imageSrc}
                                alt={producto.nombre}
                                width={80}
                                height={80}
                                variant="list"
                                className="w-full h-full"
                              />
                            ) : (
                              <Skeleton className="w-full h-full rounded-md" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{producto.nombre}</h4>
                            <p className="text-sm text-gray-600">
                              {producto.unidad === "M2" && producto.categoria === "Maderas" 
                                ? `${producto.cantidad} ${producto.unidad} - $${producto.precio.toLocaleString()}`
                                : `${producto.cantidad} x $${producto.precio.toLocaleString()} (${producto.unidad})`
                              }
                            </p>
                           
                          </div>
                          <div className="text-right ml-4">
                            <p className="font-semibold text-lg text-gray-900">
                              ${calcularPrecioProducto(producto).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        );
                      })
                    ) : (
                      <p className="text-gray-500 italic">No hay productos en este pedido</p>
                    )}
                    {order.productos && order.productos.length > 2 && (
                      <div className="text-center pt-2">
                        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                          +{order.productos.length - 2} productos más
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-[rgb(var(--brand-600)/0.12)]">
                  <div>
                    <p className="text-sm text-gray-500">Total del pedido</p>
                    <p className="text-2xl font-bold text-gray-900">${order.total.toLocaleString()}</p>
                    <p className="text-xs text-gray-600 mt-1">Medio de pago: {order.medioPago}</p>
                  </div>
                  <Link
                    href={`/orders/${order.id}`}
                    className="btn-brand px-6 py-3 rounded-full transition-colors transform hover:scale-105 duration-200"
                  >
                    Ver detalles completos
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 

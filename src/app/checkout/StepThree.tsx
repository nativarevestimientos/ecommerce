import { Step1Data, Step2Data, Step3Data } from "./schema";
import { useState, useEffect, useRef } from "react";
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
// Firestore removido
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { RadioGroup } from "@headlessui/react";
import { useFormContext } from "react-hook-form";
import {
  UserIcon,
  TruckIcon,
  ShoppingBagIcon,
  CreditCardIcon,
  BuildingLibraryIcon,
  ArrowLeftIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { satoshi } from "@/styles/fonts";
import { cn } from "@/lib/utils";
import { PLACEHOLDER_IMAGE } from '@/lib/constants'
import { auth } from '@/lib/firebase'
import { formatPrice, parseDiscountPct } from '@/lib/utils'
import { isNaveGaliciaEnabled } from "@/lib/paymentConfig";

const SkeletonBlock = ({ className }: { className: string }) => {
  return (
    <div
      className={cn([
        "relative overflow-hidden rounded-xl bg-[rgb(var(--brand-100))] border border-[rgb(var(--brand-200))]",
        className,
      ])}
    >
      <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-[rgb(var(--surface))]/70 to-transparent" />
    </div>
  );
};

type Product = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  totalPrice: number;
  image?: string;
  srcUrl?: string;
  discount?: {
    percentage: number;
    amount: number;
  };
  activePromo?: {
    cantidad: number;
    descuento: number;
    precioFinal: number;
  };
};

type StepThreeProps = {
  step1Data: Step1Data;
  step2Data: Step2Data;
  onPay: () => void;
  cart: Product[];
  setStep: (step: number) => void;
  initialOrderId?: string | null;
};

type Section = {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  content?: Array<{ label: string; value: string }>;
  isOrder?: boolean;
  isPayment?: boolean;
};

const LOGISTICS_WARNING_MESSAGE =
  "Advertencia: se lo contactará por WhatsApp para poder coordinar el envío";

const StepThree = ({
  step1Data,
  step2Data,
  onPay,
  cart,
  setStep,
  initialOrderId,
}: StepThreeProps) => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(initialOrderId || null);
  const paymentMethod = (step1Data as any)?.paymentMethod || "mercadopago";
  const router = useRouter();

  // Calcular subtotal y descuentos
  const getItemTotals = (item: Product) => {
    const qty = Number(item.quantity) || 0;
    const unit = Number(item.price) || 0;
    const originalTotal = unit * qty;
    const promo = item.activePromo;
    let effectiveTotal = originalTotal;
    if (promo && promo.cantidad > 0) {
      const promoQty = Math.min(qty, Number(promo.cantidad));
      const extraQty = Math.max(0, qty - promoQty);
      const promoTotal = Number(promo.precioFinal) || 0;
      effectiveTotal = (promoQty > 0 ? promoTotal : 0) + extraQty * unit;
    } else if (item.discount) {
      const { percentage = 0, amount = 0 } = item.discount;
      const discountedUnit =
        percentage > 0 ? unit * (1 - percentage / 100) : amount > 0 ? unit - amount : unit;
      effectiveTotal = (Math.round(discountedUnit * 100) / 100) * qty;
    }
    effectiveTotal = Math.round(effectiveTotal * 100) / 100;
    const effectiveUnit = qty > 0 ? Math.round((effectiveTotal / qty) * 100) / 100 : unit;
    const discountPercent =
      originalTotal > 0 && effectiveTotal < originalTotal
        ? Math.round(((originalTotal - effectiveTotal) / originalTotal) * 100)
        : 0;
    return { qty, unit, originalTotal, effectiveTotal, effectiveUnit, discountPercent };
  };
  const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
  const productDiscounts = cart.reduce((sum, item) => {
    const { originalTotal, effectiveTotal } = getItemTotals(item);
    return sum + Math.max(0, originalTotal - effectiveTotal);
  }, 0);
  const transferenciaPct = parseDiscountPct(process.env.NEXT_PUBLIC_TRANSFERENCIA_DESCUENTO_PCT, 0.10);
  const netAfterProductDiscounts = Math.round((subtotal - productDiscounts) * 100) / 100;
  const transferenciaDiscount = paymentMethod === "transferencia" && transferenciaPct > 0
    ? Math.round(netAfterProductDiscounts * transferenciaPct * 100) / 100
    : 0;
  const total = Math.round((netAfterProductDiscounts - transferenciaDiscount) * 100) / 100;
  const shippingFromStepTwo = (() => {
    const values = [
      (step2Data as any)?.shippingPrice,
      (step2Data as any)?.shippingEstimatedPrice,
      (step2Data as any)?.shippingCost,
      (step2Data as any)?.costoEnvio,
    ];
    for (const raw of values) {
      const parsed = Number(raw);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    return 0;
  })();
  const shippingCost = (step2Data as any)?.metodoEntrega === "envio" ? shippingFromStepTwo : 0;
  const shippingCostForCheckout = (step2Data as any)?.metodoEntrega === "envio" ? shippingCost : 0;
  const normalizedCart = cart.map((item) => {
    const { effectiveTotal } = getItemTotals(item);
    return {
      ...item,
      totalPrice: effectiveTotal,
    };
  });
  const itemsNetTotal = normalizedCart.reduce(
    (sum, item) => sum + (Number(item.totalPrice) || 0),
    0
  );
  const totalWeightKg = cart.reduce((sum: number, item: any) => {
    const w = Number(item?.weightKg);
    if (Number.isFinite(w) && w > 0) return sum + w * (Number(item.quantity) || 0);
    return sum;
  }, 0);
  const maxWeightKg = 100;
  const isOverWeight = totalWeightKg > maxWeightKg;

  const {
    register,
    formState: { errors, isValid },
    watch,
    trigger,
  } = useFormContext<Step3Data>();

  // Validación en tiempo real
  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      if (name && type === "change") {
        trigger(name as keyof Step3Data);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, trigger]);

  const logisticsWarningReason: "peso" | "zona" | null =
    isOverWeight
      ? "peso"
      : ((step2Data as any)?.cotizacionReason ??
          ((step2Data as any)?.requiresQuote ? "zona" : null));
  const hasLogisticsWarning = Boolean(logisticsWarningReason);
  const handlePaymentRef = useRef<null | (() => Promise<void>)>(null);

  const handlePayment = async () => {
    if (paymentMethod === "nave_galicia" && !isNaveGaliciaEnabled) {
      setErrorMessage("Nave Galicia no está disponible. Seleccioná otro medio de pago.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      if (!cart.length) {
        setErrorMessage("Tu carrito está vacío.");
        setIsProcessing(false);
        return;
      }

      const uniqueIds = Array.from(
        new Set(
          cart
            .map((it: any) => String(it?.productId || it?.id || ""))
            .filter(Boolean)
        )
      );
      if (uniqueIds.length) {
        const results = await Promise.all(
          uniqueIds.map(async (id) => {
            try {
              const res = await fetch(`/api/products/${encodeURIComponent(id)}`, {
                cache: "no-store",
              });
              return res.ok;
            } catch {
              return false;
            }
          })
        );
        const unavailable = uniqueIds.filter((_, idx) => !results[idx]);
        if (unavailable.length) {
          setErrorMessage("Algunos productos no se encuentran disponible para tu pedido.");
          setIsProcessing(false);
          return;
        }
      }

      const payerEmail = user?.email || (step1Data as any).email;
      if (!payerEmail) {
        setErrorMessage("Ingresá un correo electrónico para continuar.");
        setIsProcessing(false);
        return;
      }

      const metodoEntregaSeleccionado = String((step2Data as any)?.metodoEntrega || "").toLowerCase();
      const shippingCostForOrder = metodoEntregaSeleccionado === "envio" ? shippingCost : 0;

      let finalOrderId = orderId;
      if (!finalOrderId) {
        const newOrderId = uuidv4();

        const orderData = {
          orderId: newOrderId,
          userId: payerEmail,
          paymentMethod,
          customerInfo: {
            nombre: (step1Data as any).nombre,
            email: (step1Data as any).email,
            telefono: (step1Data as any).telefono,
            dni: (step1Data as any).dni,
          },
          deliveryInfo: {
            direccion: (step2Data as any).direccion,
            ciudad: (step2Data as any).ciudad,
            codigoPostal: (step2Data as any).codigoPostal,
            metodoEntrega: metodoEntregaSeleccionado,
            lat: (step2Data as any).lat,
            lng: (step2Data as any).lng,
            storeId: (step2Data as any).storeId,
            sucursal: (step2Data as any).sucursal,
            distanciaKm: (step2Data as any).distanciaKm,
            maxRadiusKm: (step2Data as any).maxRadiusKm,
            requiresQuote: hasLogisticsWarning,
            cotizacionReason: logisticsWarningReason,
            shippingPrice:
              metodoEntregaSeleccionado === "envio"
                ? (shippingCostForOrder > 0
                    ? shippingCostForOrder
                    : ((step2Data as any).shippingPrice ?? null))
                : 0,
            shippingTierKm: (step2Data as any).shippingTierKm ?? null,
          },
          items: normalizedCart,
          total: itemsNetTotal,
          pricing: {
            subtotal,
            productDiscounts,
            transferDiscount: paymentMethod === "transferencia" ? transferenciaDiscount : 0,
            shipping: shippingCostForOrder,
            total:
              (paymentMethod === "transferencia"
                ? total + shippingCostForOrder
                : itemsNetTotal + shippingCostForOrder),
          },
          status: paymentMethod === "nave_galicia" ? "pending_payment" : "pending",
          paymentProvider: paymentMethod === "nave_galicia" ? "nave_galicia" : paymentMethod,
          paymentStatus: "pending",
          externalPaymentId: newOrderId,
          createdAt: new Date().toISOString(),
        };

        const orderResponse = await fetch("/api/create-order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(auth?.currentUser ? { Authorization: `Bearer ${await auth.currentUser.getIdToken(true)}` } : {}),
          },
          body: JSON.stringify(orderData),
        });

        if (!orderResponse.ok) {
          throw new Error("No se pudo crear la orden");
        }

        const orderResult = await orderResponse.json();
        finalOrderId = orderResult.orderId || newOrderId;
        setOrderId(finalOrderId);
      }

      if (paymentMethod === "mercadopago") {
        // Create the payment preference in Mercado Pagooooooo
        const res = await fetch("/api/create-checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(auth?.currentUser ? { Authorization: `Bearer ${await auth.currentUser.getIdToken(true)}` } : {}),
          },
          body: JSON.stringify({
            items: cart.map((item) => {
              const { qty, effectiveUnit } = getItemTotals(item);
              return {
                title: item.name,
                unit_price: effectiveUnit,
                quantity: qty,
              };
            }),
            orderId: finalOrderId,
            shipping: shippingCostForOrder,
            payer: {
              email: payerEmail,
              name: (step1Data as any).nombre,
            },
          }),
        });
  
        const data = await res.json();
  
        if (!data.init_point) {
          throw new Error("No se recibió el punto de inicio del pago");
        }
  
        // Redirect to MercadoPago checkout
        window.location.href = data.init_point;
      } else if (paymentMethod === "nave_galicia") {
        const res = await fetch("/api/nave-galicia/create-checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(auth?.currentUser ? { Authorization: `Bearer ${await auth.currentUser.getIdToken(true)}` } : {}),
          },
          body: JSON.stringify({ orderId: finalOrderId }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || "No se pudo iniciar el checkout de Nave Galicia");
        }

        const checkoutUrl = data?.checkout_url || data?.checkoutUrl || data?.init_point;
        if (!checkoutUrl) {
          throw new Error("No se recibió la URL del checkout de Nave Galicia");
        }

        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(
              `nave_checkout_state:${finalOrderId}`,
              JSON.stringify({
                orderId: finalOrderId,
                paymentRequestId: data?.id || null,
                externalPaymentId: data?.external_payment_id || finalOrderId,
                checkoutUrl,
                qrData: data?.qr_data || null,
                savedAt: new Date().toISOString(),
              }),
            );
          } catch {}
        }

        window.location.href = checkoutUrl;
      } else if (paymentMethod === "transferencia") {
        // Transferencia: crear venta pendiente
        const resVenta = await fetch("/api/save-venta", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(auth?.currentUser ? { Authorization: `Bearer ${await auth.currentUser.getIdToken(true)}` } : {}),
          },
          body: JSON.stringify({
            externalReference: finalOrderId,
            orderData: {
              orderId: finalOrderId,
              customerInfo: step1Data,
              deliveryInfo: {
                ...(step2Data as any),
                requiresQuote: hasLogisticsWarning,
                cotizacionReason: logisticsWarningReason,
              },
              items: normalizedCart,
              total: total + shippingCostForOrder,
              status: "pending",
            },
            userEmail: payerEmail,
            paymentMethod: "transferencia",
            paidAmount: 0,
            forceEmail: true,
          }),
        });
        const ventaJson = await resVenta.json();
        if (!resVenta.ok) {
          throw new Error(ventaJson?.error || "No se pudo registrar la venta por transferencia");
        }
        router.push(`/checkout/pending?orderId=${encodeURIComponent(finalOrderId!)}`);
      } else {
        throw new Error("Método de pago inválido");
      }
    } catch (error) {
      console.error("Error al procesar el pago:", error);
      setErrorMessage(
        "Hubo un error al procesar el pago. Por favor, intenta nuevamente."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  handlePaymentRef.current = handlePayment;

  const sections = [
    {
      id: 1,
      title: "Información de contacto",
      icon: UserIcon,
      content: [
        { label: "Nombre", value: (step1Data as any).nombre },
        { label: "Email", value: (step1Data as any).email },
        { label: "Teléfono", value: (step1Data as any).telefono },
        { label: "DNI", value: (step1Data as any).dni },
      ],
    },
    {
      id: 2,
      title: (step2Data as any).metodoEntrega === "retiro" ? "Información de retiro" : "Dirección de entrega",
      icon: (step2Data as any).metodoEntrega === "retiro" ? ShoppingBagIcon : TruckIcon,
      content: (step2Data as any).metodoEntrega === "retiro" 
        ? [
            { label: "Tienda", value: (step2Data as any).direccion },
            { label: "Dirección", value: (step2Data as any).ciudad },
            { label: "Método de entrega", value: "Retiro en tienda" },
          ]
        : [
            { label: "Dirección", value: (step2Data as any).direccion || "" },
            { label: "Ciudad", value: (step2Data as any).ciudad || "" },
            { label: "Código Postal", value: (step2Data as any).codigoPostal || "" },
            { label: "Método de entrega", value: "Envío a domicilio" },
          ],
    },
    {
      id: 3,
      title: "Resumen del pedido",
      icon: ShoppingBagIcon,
      isOrder: true,
    },
    {
      id: 4,
      title: "Método de pago",
      icon: CreditCardIcon,
      isPayment: true,
    },
  ];

  if (cart.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <h2
          className={cn([
            satoshi.className,
            "text-3xl font-bold text-center mb-6 text-[rgb(var(--brand-900))]",
          ])}
        >
          Confirmá tu pedido
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-[rgb(var(--surface))] rounded-2xl p-6 shadow-sm border border-[rgb(var(--brand-200))]">
              <div className="flex items-center gap-2 mb-4">
                <SkeletonBlock className="h-5 w-5 rounded-md border-0 bg-[rgb(var(--brand-200))]" />
                <SkeletonBlock className="h-4 w-48 rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between gap-4">
                  <SkeletonBlock className="h-3 w-24 rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
                  <SkeletonBlock className="h-3 w-40 rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
                </div>
                <div className="flex justify-between gap-4">
                  <SkeletonBlock className="h-3 w-24 rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
                  <SkeletonBlock className="h-3 w-52 rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
                </div>
                <div className="flex justify-between gap-4">
                  <SkeletonBlock className="h-3 w-24 rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
                  <SkeletonBlock className="h-3 w-36 rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
                </div>
              </div>
            </div>

            <div className="bg-[rgb(var(--surface))] rounded-2xl p-6 shadow-sm border border-[rgb(var(--brand-200))]">
              <div className="flex items-center gap-2 mb-4">
                <SkeletonBlock className="h-5 w-5 rounded-md border-0 bg-[rgb(var(--brand-200))]" />
                <SkeletonBlock className="h-4 w-44 rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between gap-4">
                  <SkeletonBlock className="h-3 w-24 rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
                  <SkeletonBlock className="h-3 w-56 rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
                </div>
                <div className="flex justify-between gap-4">
                  <SkeletonBlock className="h-3 w-24 rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
                  <SkeletonBlock className="h-3 w-40 rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
                </div>
                <div className="flex justify-between gap-4">
                  <SkeletonBlock className="h-3 w-24 rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
                  <SkeletonBlock className="h-3 w-28 rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-[rgb(var(--surface))] rounded-2xl p-6 shadow-sm border border-[rgb(var(--brand-200))]">
              <div className="flex items-center gap-2 mb-4">
                <SkeletonBlock className="h-5 w-5 rounded-md border-0 bg-[rgb(var(--brand-200))]" />
                <SkeletonBlock className="h-4 w-40 rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
              </div>

              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-4">
                    <div className="flex items-center space-x-4">
                      <SkeletonBlock className="h-16 w-16 rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
                      <div className="space-y-2">
                        <SkeletonBlock className="h-3 w-48 rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
                        <SkeletonBlock className="h-3 w-28 rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <SkeletonBlock className="h-3 w-20 rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
                      <SkeletonBlock className="h-3 w-16 rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-[rgb(var(--brand-200))] pt-4 mt-4 space-y-3">
                <div className="flex justify-between">
                  <SkeletonBlock className="h-3 w-24 rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
                  <SkeletonBlock className="h-3 w-20 rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
                </div>
                <div className="flex justify-between">
                  <SkeletonBlock className="h-3 w-24 rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
                  <SkeletonBlock className="h-3 w-20 rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
                </div>
                <div className="flex justify-between">
                  <SkeletonBlock className="h-4 w-20 rounded-lg border-0 bg-[rgb(var(--brand-300))]" />
                  <SkeletonBlock className="h-4 w-24 rounded-lg border-0 bg-[rgb(var(--brand-300))]" />
                </div>
              </div>
            </div>

            <div className="surface-card rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <SkeletonBlock className="h-5 w-5 rounded-md border-0 bg-[rgb(var(--brand-200))]" />
                <SkeletonBlock className="h-4 w-36 rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SkeletonBlock className="h-16 w-full rounded-xl border-0 bg-[rgb(var(--brand-200))]" />
                <SkeletonBlock className="h-16 w-full rounded-xl border-0 bg-[rgb(var(--brand-200))]" />
              </div>
            </div>
          </div>
        </div>

        <div className="fixed z-10 bottom-0 left-0 right-0 bg-[rgb(var(--surface))] border-t border-[rgb(var(--brand-200))] p-4 shadow-lg">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <SkeletonBlock className="h-12 w-28 rounded-full border-0 bg-[rgb(var(--brand-200))]" />
            <SkeletonBlock className="h-12 w-56 rounded-full border-0 bg-[rgb(var(--brand-300))]" />
          </div>
        </div>
      </motion.div>
    );
  }

  const processingText = paymentMethod === "mercadopago"
      ? "Conectando con MercadoPago..."
      : paymentMethod === "nave_galicia"
        ? "Conectando con Nave Galicia..."
        : "Registrando pedido por transferencia...";

  return (
    <>
      {isProcessing && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[rgb(var(--surface))] border border-[rgb(var(--brand-200))] shadow-xl p-6">
            <div className="flex items-center gap-3">
              <svg
                className="animate-spin h-5 w-5 text-[rgb(var(--brand-700))]"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="text-sm font-medium text-[rgb(var(--brand-900))]">{processingText}</p>
            </div>
            <p className="mt-2 text-xs text-[rgb(var(--brand-600))]">
              No cierres esta pestaña.
            </p>
          </div>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
      <h2
        className={cn([
          satoshi.className,
          "text-3xl font-bold text-center mb-6 text-[rgb(var(--brand-900))]",
        ])}
      >
        Confirmá tu pedido
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Columna izquierda: Información personal y de entrega */}
        <div>
          {sections.slice(0, 2).map((section) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-[rgb(var(--surface))] rounded-2xl p-6 shadow-sm border border-[rgb(var(--brand-200))] mb-6"
              >
                <h3 className="text-lg font-medium text-[rgb(var(--brand-900))] flex items-center gap-2 mb-4">
                  <Icon className="w-5 h-5 text-[rgb(var(--brand-700))]" />
                  {section.title}
                </h3>
                <dl className="space-y-3">
                  {section.content?.map(({ label, value }) => (
                    <div key={label} className="flex justify-between">
                      <dt className="text-sm text-[rgb(var(--brand-600))]">{label}:</dt>
                      <dd className={clsx(
                        "text-sm font-medium text-[rgb(var(--brand-900))]",
                        label === "Horario" && "whitespace-pre-line"
                      )}>
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </motion.div>
            );
          })}
        </div>

        {/* Columna centro: Resumen del pedido */}
        <div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[rgb(var(--surface))] rounded-2xl p-6 mb-6 shadow-sm border border-[rgb(var(--brand-200))]"
          >
            <h3 className="text-lg font-medium text-[rgb(var(--brand-900))] flex items-center gap-2 mb-4">
              <ShoppingBagIcon className="w-5 h-5 text-[rgb(var(--brand-700))]" />
              Resumen del pedido
            </h3>
            <div className="space-y-4">
              {cart.map((item) => (
                (() => {
                  const { qty, unit, originalTotal, effectiveTotal, effectiveUnit, discountPercent } =
                    getItemTotals(item);
                  const hasDiscount = effectiveTotal < originalTotal;
                  return (
                    <div key={item.id} className="flex items-center justify-between py-4">
                      <div className="flex items-center space-x-4">
                        <div className="relative w-10 h-10">
                          <Image
                            src={item.image || item.srcUrl || PLACEHOLDER_IMAGE}
                            alt={item.name}
                            className="object-cover rounded-lg"
                            width={64}
                            height={64}
                          />
                        </div>
                        <div>
                          <h4 className="font-medium text-[rgb(var(--brand-900))]">{item.name}</h4>
                          <div className="mt-1 text-xs text-[rgb(var(--brand-600))]">
                            {qty} x{" "}
                            {hasDiscount && (
                              <span className="text-[rgb(var(--brand-400))] line-through mr-2">
                                {formatPrice(unit)}
                              </span>
                            )}
                            <span className="font-semibold text-[rgb(var(--brand-900))]">
                              {formatPrice(hasDiscount ? effectiveUnit : unit)}
                            </span>
                            {discountPercent > 0 && (
                              <span className="ml-2 inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 border border-red-200">
                                -{discountPercent}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-[rgb(var(--brand-900))]">{formatPrice(effectiveTotal)}</p>
                        {hasDiscount && (
                          <p className="text-sm text-[rgb(var(--brand-400))] line-through">
                            {formatPrice(originalTotal)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })()
              ))}
              <div className="border-t border-[rgb(var(--brand-200))] pt-4 mt-4 space-y-3">
                <div className="flex justify-between text-base">
                  <p className="text-[rgb(var(--brand-600))]">Subtotal</p>
                  <p className="font-medium text-[rgb(var(--brand-900))]">
                    {productDiscounts > 0 ? (
                      <>
                        <span className="text-[rgb(var(--brand-400))] line-through mr-2">
                          {formatPrice(subtotal)}
                        </span>
                        <span>{formatPrice(netAfterProductDiscounts)}</span>
                      </>
                    ) : (
                      <span>{formatPrice(subtotal)}</span>
                    )}
                  </p>
                </div>
                {paymentMethod === "transferencia" && transferenciaDiscount > 0 && (
                  <div className="flex justify-between text-base">
                    <p className="text-[rgb(var(--brand-600))]">Descuento por transferencia</p>
                    <p className="font-medium text-green-600">-{formatPrice(transferenciaDiscount)}</p>
                  </div>
                )}
                <div className="flex justify-between text-base">
                  <p className="text-[rgb(var(--brand-600))]">Envío</p>
                  <p className="font-medium">
                    {(step2Data as any)?.metodoEntrega === "envio"
                      ? (shippingCost > 0
                          ? formatPrice(shippingCost)
                          : hasLogisticsWarning
                            ? "A coordinar"
                            : "A definir")
                      : formatPrice(0)}
                  </p>
                </div>
                <div className="flex justify-between text-base font-medium text-[rgb(var(--brand-900))]">
                  <p>Total</p>
                  <p className="whitespace-nowrap">{formatPrice(total + shippingCostForCheckout)}</p>
                </div>
                {paymentMethod === "transferencia" && transferenciaDiscount > 0 && (
                  <p className="text-xs text-[rgb(var(--brand-600))] mt-2">
                    Se aplicó un descuento adicional por transferencia sobre el total de productos.
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="surface-card rounded-2xl p-6 mb-6"
          >
            <h3 className="text-lg font-medium text-[rgb(var(--brand-900))] flex items-center gap-2 mb-4">
              <CreditCardIcon className="w-5 h-5 text-[rgb(var(--brand-700))]" />
              Método de pago
            </h3>
            <div className="space-y-6">
              {hasLogisticsWarning && (
                <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                  <p className="text-sm text-yellow-900">
                    {LOGISTICS_WARNING_MESSAGE}
                  </p>
                </div>
              )}

              {paymentMethod === "mercadopago" && (
                <div className="flex items-center gap-2 text-sm text-[rgb(var(--brand-700))]">
                  <Image src="/mercadopago.svg" alt="Mercado Pago" width={32} height={32} className="w-8 h-8" />
                  <span>Compra protegida con Mercado Pago</span>
                </div>
              )}

              {paymentMethod === "nave_galicia" && (
                <div className="flex items-center gap-2 text-sm text-[rgb(var(--brand-700))]">
                  <BuildingLibraryIcon className="h-8 w-8 text-[rgb(var(--brand-700))]" />
                  <span>Serás redirigido a Nave Galicia para completar el pago</span>
                </div>
              )}

              {paymentMethod === "transferencia" && (
                <div className="space-y-4">
                  <div className="bg-[rgb(var(--brand-50))] p-4 rounded-xl border border-[rgb(var(--brand-200))]">
                    <p className="text-sm text-[rgb(var(--brand-700))]">
                      Al confirmar, tu pedido quedará en estado pendiente hasta que verifiquemos la transferencia.
                    </p>
                  </div>
                  <div className="rounded-xl border border-[rgb(var(--brand-200))] bg-[rgb(var(--surface))] p-4">
                    <div className="text-sm font-semibold text-[rgb(var(--brand-900))] mb-2">
                      Datos para transferencia
                    </div>
                    <div className="space-y-1 text-sm text-[rgb(var(--brand-700))]">
                      <div><span className="font-medium text-[rgb(var(--brand-900))]">Banco:</span> Banco Galicia</div>
                      <div><span className="font-medium text-[rgb(var(--brand-900))]">Número de cuenta:</span> 0008045-9 104-1</div>
                      <div><span className="font-medium text-[rgb(var(--brand-900))]">CUIT:</span> 30-71837348-0</div>
                      <div><span className="font-medium text-[rgb(var(--brand-900))]">Razón Social:</span> DECOETERNA SRL</div>
                      <div><span className="font-medium text-[rgb(var(--brand-900))]">CBU:</span> 0070104020000008045913</div>
                      <div><span className="font-medium text-[rgb(var(--brand-900))]">Alias:</span> DECO.ETERNA.SI</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="surface-card rounded-2xl p-6 mb-6"
          >
            <div className="space-y-6">
              {/* Comentarios */}
              <div className="space-y-2">
                <label
                  htmlFor="comment"
                  className="block text-sm font-medium text-[rgb(var(--brand-700))]"
                >
                  Comentarios adicionales (opcional)
                </label>
                <textarea
                  id="comment"
                  rows={3}
                  className="mt-1 block w-full rounded-xl border border-[rgb(var(--brand-200))] bg-[rgb(var(--surface))] shadow-sm sm:text-sm p-4 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-600))]/25 focus:border-[rgb(var(--brand-600))]"
                  placeholder="Instrucciones especiales para la entrega..."
                  {...register("comment")}
                />
                <div className="mt-3">
                  <label className="flex items-center gap-3">
                    <input
                      id="acceptTerms"
                      type="checkbox"
                      className="h-4 w-4 rounded border-[rgb(var(--brand-300))] text-[rgb(var(--brand-700))] focus:ring-[rgb(var(--brand-600))]/25"
                      {...register("acceptTerms")}
                    />
                    <span className="text-sm text-[rgb(var(--brand-700))]">
                      Acepto los términos y condiciones
                    </span>
                  </label>
                  {errors.acceptTerms && (
                    <p className="mt-2 text-sm text-red-600">{errors.acceptTerms.message as string}</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Columna derecha: Resumen del pedido y método de pago */}
         <div>
          {/* Botones de navegación */}
          <div className="fixed z-10 bottom-0 left-0 right-0 bg-[rgb(var(--surface))] border-t border-[rgb(var(--brand-200))] p-4 shadow-lg">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => setStep(1)}
                className="btn-surface inline-flex items-center px-6 py-3 shadow-sm text-xs font-medium rounded-full"
              >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Volver
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handlePayment}
                disabled={isProcessing}
                className={clsx(
                  "inline-flex items-center px-6 py-3 border border-transparent text-xs font-medium rounded-full shadow-sm text-white gap-2",
                  {
                    "btn-brand": !isProcessing,
                    "bg-[rgb(var(--brand-300))] cursor-not-allowed": isProcessing,
                  }
                )}
              >
                {isProcessing ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Procesando...
                  </>
                ) : (
                  <>
                    {paymentMethod === "mercadopago" ? (
                      <>
                        <Image src="/mercadopago.svg" alt="Mercado Pago" width={24} height={24} className="w-6 h-6" />
                        Confirmar y pagar
                      </>
                    ) : paymentMethod === "nave_galicia" ? (
                      <>
                        <BuildingLibraryIcon className="w-6 h-6 text-white" />
                        Confirmar y pagar
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 10h18M5 6h14a2 2 0 012 2v12H3V8a2 2 0 012-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Confirmar transferencia
                      </>
                    )}
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-md bg-red-50 p-4"
        >
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationCircleIcon
                className="h-5 w-5 text-red-400"
                aria-hidden="true"
              />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{errorMessage}</p>
            </div>
          </div>
        </motion.div>
      )}
      </motion.div>
    </>
  );
};

export default StepThree;

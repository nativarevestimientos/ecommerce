import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { TrashIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { satoshi } from "@/styles/fonts";
import { Separator } from "@/components/ui/separator";
import ProductPlaceholder from "./ProductPlaceholder";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { TbBasketExclamation } from "react-icons/tb";
import { PLACEHOLDER_IMAGE } from "@/lib/constants";
import InputGroup from "@/components/ui/input-group";
import { MdOutlineLocalOffer } from "react-icons/md";
import { BanknotesIcon } from "@heroicons/react/24/outline";
import { isNaveGaliciaEnabled } from "@/lib/paymentConfig";

export interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  srcUrl?: string;
  totalPrice: number;
  discount?: {
    percentage: number;
    amount: number;
  };
  activePromo?: {
    cantidad: number;
    descuento: number;
    precioFinal: number;
  };
}

interface OrderSummaryProps {
  products: Product[];
  subtotal: number;
  shipping: number;
  total: number;
  shippingLabel?: string;
  onRemoveItem?: (id: string) => void;
  isLoading?: boolean;
  showPaymentMethod?: boolean;
  paymentMethodLoading?: boolean;
  paymentMethodCompleted?: boolean;
  paymentMethod?: "mercadopago" | "transferencia" | "nave_galicia";
  onPaymentMethodChange?: (
    method: "mercadopago" | "transferencia" | "nave_galicia",
  ) => void;
}

const NAVE_LOGO_URL =
  "https://www.eventosagr.com.ar/networking/assets/img/nave.png";

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

const OrderSummary: React.FC<OrderSummaryProps> = ({
  products,
  subtotal,
  shipping,
  total,
  shippingLabel,
  onRemoveItem,
  isLoading = false,
  showPaymentMethod = true,
  paymentMethodLoading = false,
  paymentMethodCompleted = false,
  paymentMethod = "mercadopago",
  onPaymentMethodChange,
}) => {
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const displayedPaymentMethod =
    !isNaveGaliciaEnabled && paymentMethod === "nave_galicia"
      ? "mercadopago"
      : paymentMethod;
  // Detectar si es dispositivo móvil y establecer el límite inicial
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };

    // Ejecutar al montar
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Calcular el límite de productos a mostrar
  const displayLimit = isMobile ? 1 : 3;

  // Determinar qué productos mostrar
  const displayedProducts = showAllProducts
    ? products
    : products.slice(0, displayLimit);

  const hasMoreProducts = products.length > displayLimit;

  // Formatear números con separadores de miles y decimales
  const formatCurrency = (value: number) => {
    return value.toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };
  const getProductEffectiveTotal = (product: Product) => {
    const qty = Number(product.quantity) || 0;
    const unit = Number(product.price) || 0;
    const originalTotal = unit * qty;
    const promo = product.activePromo;
    let effectiveTotal = originalTotal;
    if (promo && promo.cantidad > 0) {
      const promoQty = Math.min(qty, Number(promo.cantidad));
      const extraQty = Math.max(0, qty - promoQty);
      const promoTotal = Number(promo.precioFinal) || 0;
      effectiveTotal = (promoQty > 0 ? promoTotal : 0) + extraQty * unit;
    } else if (product.discount) {
      const { percentage = 0, amount = 0 } = product.discount;
      const discountedUnit =
        percentage > 0
          ? unit * (1 - percentage / 100)
          : amount > 0
            ? unit - amount
            : unit;
      effectiveTotal = (Math.round(discountedUnit * 100) / 100) * qty;
    }
    effectiveTotal = Math.round(effectiveTotal * 100) / 100;
    const effectiveUnit =
      qty > 0 ? Math.round((effectiveTotal / qty) * 100) / 100 : unit;
    const discountPercent =
      originalTotal > 0 && effectiveTotal < originalTotal
        ? Math.round(((originalTotal - effectiveTotal) / originalTotal) * 100)
        : 0;
    return {
      qty,
      unit,
      originalTotal,
      effectiveTotal,
      effectiveUnit,
      discountPercent,
    };
  };

  // Renderizar skeleton loader
  if (isLoading) {
    return (
      <div className="bg-[rgb(var(--surface))] rounded-xl border border-[rgb(var(--brand-200))] p-6 h-fit">
        <h3
          className={cn([
            satoshi.className,
            "text-3xl font-bold text-center mb-6 text-[rgb(var(--brand-900))]",
          ])}
        >
          Resumen del Pedido
        </h3>

        <div className="space-y-3 mb-6">
          {Array.from({ length: isMobile ? 1 : 3 }).map((_, index) => (
            <div key={index} className="flex gap-3">
              <ProductPlaceholder size={isMobile ? "xs" : "sm"} />
              <div className="flex-1">
                <SkeletonBlock className="h-3 w-3/4 mb-2 rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
                <SkeletonBlock className="h-3 w-1/4 rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
              </div>
            </div>
          ))}
        </div>

        <Separator className="my-4 bg-[rgb(var(--brand-200))]" />

        <div className="space-y-2">
          <div className="flex justify-between">
            <SkeletonBlock className="h-3 w-1/3 rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
            <SkeletonBlock className="h-3 w-1/4 rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
          </div>
          <div className="flex justify-between">
            <SkeletonBlock className="h-3 w-1/3 rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
            <SkeletonBlock className="h-3 w-1/4 rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
          </div>
          <div className="flex justify-between font-bold mt-2">
            <SkeletonBlock className="h-4 w-1/3 rounded-lg border-0 bg-[rgb(var(--brand-300))]" />
            <SkeletonBlock className="h-4 w-1/4 rounded-lg border-0 bg-[rgb(var(--brand-300))]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="surface-card rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[rgb(var(--brand-900))]">
          Resumen del Pedido
        </h2>
      </div>

      {/* Lista de productos */}
      <div className="space-y-4 mb-6">
        {displayedProducts.map((product) =>
          (() => {
            const {
              qty,
              unit,
              originalTotal,
              effectiveTotal,
              effectiveUnit,
              discountPercent,
            } = getProductEffectiveTotal(product);
            const hasDiscount = effectiveTotal < originalTotal;
            return (
              <div
                key={product.id}
                className="flex items-center justify-between py-4"
              >
                <div className="flex items-center space-x-4">
                  <div className="relative w-10 h-10">
                    <Image
                      src={product.image || product.srcUrl || PLACEHOLDER_IMAGE}
                      alt={product.name}
                      className="object-cover rounded-lg"
                      width={64}
                      height={64}
                    />
                  </div>
                  <div>
                    <h4 className="font-medium text-[rgb(var(--brand-900))]">
                      {product.name}
                    </h4>
                    <div className="mt-1 text-xs text-[rgb(var(--brand-600))]">
                      {qty} x{" "}
                      {hasDiscount && (
                        <span className="text-[rgb(var(--brand-400))] line-through mr-2">
                          ${formatCurrency(unit)}
                        </span>
                      )}
                      <span className="font-semibold text-[rgb(var(--brand-900))]">
                        ${formatCurrency(hasDiscount ? effectiveUnit : unit)}
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
                  <p className="font-medium text-[rgb(var(--brand-900))]">
                    ${formatCurrency(effectiveTotal)}
                  </p>
                  {hasDiscount && (
                    <p className="text-sm text-[rgb(var(--brand-400))] line-through">
                      ${formatCurrency(originalTotal)}
                    </p>
                  )}
                </div>
              </div>
            );
          })(),
        )}

        {/* Botón Ver más/Ver menos */}
        {hasMoreProducts && (
          <div className="flex justify-center mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllProducts(!showAllProducts)}
              className="text-sm text-[rgb(var(--brand-700))] hover:text-[rgb(var(--brand-900))] hover:bg-[rgb(var(--brand-50))] flex items-center gap-1"
            >
              {showAllProducts ? (
                <>
                  Ver menos <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  Ver {products.length - displayLimit}{" "}
                  {products.length - displayLimit === 1
                    ? "producto más"
                    : "productos más"}{" "}
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Resumen de costos */}
      <div className="border-t border-[rgb(var(--brand-200))] pt-4 space-y-3">
        {(() => {
          const productDiscounts = products.reduce((acc, product) => {
            const { originalTotal, effectiveTotal } =
              getProductEffectiveTotal(product);
            return acc + Math.max(0, originalTotal - effectiveTotal);
          }, 0);
          const roundedDiscounts = Math.round(productDiscounts * 100) / 100;
          const netSubtotal =
            Math.round((subtotal - roundedDiscounts) * 100) / 100;
          return (
            <div className="flex justify-between text-sm">
              <span className="text-[rgb(var(--brand-600))]">Subtotal</span>
              <span className="text-[rgb(var(--brand-900))]">
                {roundedDiscounts > 0 ? (
                  <>
                    <span className="text-[rgb(var(--brand-400))] line-through mr-2">
                      ${formatCurrency(subtotal)}
                    </span>
                    <span>${formatCurrency(netSubtotal)}</span>
                  </>
                ) : (
                  <>${formatCurrency(subtotal)}</>
                )}
              </span>
            </div>
          );
        })()}
        <div className="flex justify-between text-sm">
          <span className="text-[rgb(var(--brand-600))]">Envío</span>
          <span className="text-[rgb(var(--brand-900))]">
            {shippingLabel ? (
              <>{shippingLabel}</>
            ) : (
              <>${formatCurrency(shipping)}</>
            )}
          </span>
        </div>
        <div className="flex justify-between text-base font-semibold border-t border-[rgb(var(--brand-200))] pt-3">
          <span className="text-[rgb(var(--brand-900))]">Total</span>
          <span className="text-[rgb(var(--brand-900))]">
            ${formatCurrency(total)}
          </span>
        </div>
      </div>

      <div className="mt-6 flex space-x-2">
        <InputGroup className="bg-[rgb(var(--brand-50))] border border-[rgb(var(--brand-200))]">
          <InputGroup.Text>
            <MdOutlineLocalOffer className="text-[rgb(var(--brand-500))] text-lg" />
          </InputGroup.Text>
          <InputGroup.Input
            type="text"
            name="code"
            placeholder="Agregar código promocional"
            className="bg-transparent placeholder:text-[rgb(var(--brand-500))] text-sm text-[rgb(var(--brand-900))]"
          />
        </InputGroup>
        <Button
          type="button"
          className="btn-brand rounded-full w-full max-w-[100px] h-10 text-sm transition-all"
        >
          Aplicar
        </Button>
      </div>

      {showPaymentMethod && (
        <div className="mt-6 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-[rgb(var(--brand-900))]">
              Elegí tu forma de pago
            </div>
          </div>
          {paymentMethodLoading ? (
            <div className="flex flex-col gap-3">
              <SkeletonBlock className="h-[72px] rounded-2xl border-0 bg-[rgb(var(--brand-200))]" />
              <SkeletonBlock className="h-[72px] rounded-2xl border-0 bg-[rgb(var(--brand-200))]" />
            </div>
          ) : paymentMethodCompleted ? (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-[rgb(var(--brand-200))] bg-[rgb(var(--brand-50))] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgb(var(--brand-200))] bg-white">
                  {displayedPaymentMethod === "mercadopago" ? (
                    <Image
                      src="/mercadopago.svg"
                      alt="Mercado Pago"
                      width={18}
                      height={18}
                      className="h-5 w-5"
                    />
                  ) : displayedPaymentMethod === "transferencia" ? (
                    <BanknotesIcon className="h-5 w-5 text-[rgb(var(--brand-700))]" />
                  ) : (
                    <Image
                      src={NAVE_LOGO_URL}
                      alt="Nave"
                      width={28}
                      height={28}
                      className="h-7 w-7 object-contain"
                    />
                  )}
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold text-[rgb(var(--brand-900))]">
                    {displayedPaymentMethod === "mercadopago"
                      ? "Mercado Pago"
                      : displayedPaymentMethod === "transferencia"
                        ? "Transferencia"
                        : "Nave Galicia"}
                  </div>
                  <div className="text-xs text-[rgb(var(--brand-600))]">
                    Seleccionado
                  </div>
                </div>
              </div>
              <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-[rgb(var(--brand-600))] text-white">
                <Check className="h-4 w-4" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {isNaveGaliciaEnabled && (
              <motion.button
                type="button"
                disabled={paymentMethodCompleted}
                onClick={() => {
                  if (paymentMethodCompleted) return;
                  onPaymentMethodChange?.("nave_galicia");
                }}
                whileHover={
                  paymentMethodCompleted ? undefined : { scale: 1.01 }
                }
                whileTap={paymentMethodCompleted ? undefined : { scale: 0.99 }}
                className={cn([
                  "group flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-colors",
                  paymentMethod === "nave_galicia"
                    ? "border-[rgb(var(--brand-600))] bg-[rgb(var(--brand-50))]"
                    : "border-[rgb(var(--brand-200))] bg-[rgb(var(--surface))] hover:bg-[rgb(var(--brand-50))]",
                  paymentMethodCompleted && "cursor-not-allowed opacity-70",
                ])}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn([
                      "flex h-10 w-10 items-center justify-center rounded-xl border",
                      paymentMethod === "nave_galicia"
                        ? "border-[rgb(var(--brand-600)/0.20)] bg-white"
                        : "border-[rgb(var(--brand-200))] bg-[rgb(var(--surface))]",
                    ])}
                  >
                    <Image
                      src={NAVE_LOGO_URL}
                      alt="Nave"
                      width={28}
                      height={28}
                      className="h-7 w-7 object-contain"
                    />
                  </div>
                  <div className="leading-tight">
                    <div className="text-sm font-semibold text-[rgb(var(--brand-900))]">
                      Nave Galicia
                    </div>
                    <div className="text-xs text-[rgb(var(--brand-600))]">
                      Tarjetas y QR
                    </div>
                  </div>
                </div>
                <div
                  className={cn([
                    "h-5 w-5 rounded-full border transition-colors",
                    paymentMethod === "nave_galicia"
                      ? "border-[rgb(var(--brand-600))] bg-[rgb(var(--brand-600))]"
                      : "border-[rgb(var(--brand-300))] bg-transparent",
                  ])}
                >
                  {paymentMethod === "nave_galicia" && (
                    <div className="mx-auto mt-[6px] h-2 w-2 rounded-full bg-white" />
                  )}
                </div>
              </motion.button>
              )}
              <motion.button
                type="button"
                disabled={paymentMethodCompleted}
                onClick={() => {
                  if (paymentMethodCompleted) return;
                  onPaymentMethodChange?.("transferencia");
                }}
                whileHover={
                  paymentMethodCompleted ? undefined : { scale: 1.01 }
                }
                whileTap={paymentMethodCompleted ? undefined : { scale: 0.99 }}
                className={cn([
                  "group flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-colors",
                  displayedPaymentMethod === "transferencia"
                    ? "border-[rgb(var(--brand-600))] bg-[rgb(var(--brand-50))]"
                    : "border-[rgb(var(--brand-200))] bg-[rgb(var(--surface))] hover:bg-[rgb(var(--brand-50))]",
                  paymentMethodCompleted && "cursor-not-allowed opacity-70",
                ])}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn([
                      "flex h-10 w-10 items-center justify-center rounded-xl border",
                      displayedPaymentMethod === "transferencia"
                        ? "border-[rgb(var(--brand-600)/0.20)] bg-white"
                        : "border-[rgb(var(--brand-200))] bg-[rgb(var(--surface))]",
                    ])}
                  >
                    <BanknotesIcon className="h-5 w-5 text-[rgb(var(--brand-700))]" />
                  </div>
                  <div className="leading-tight">
                    <div className="text-sm font-semibold text-[rgb(var(--brand-900))]">
                      Transferencia
                    </div>
                    <div className="text-xs text-[rgb(var(--brand-600))]">
                      Datos al finalizar
                    </div>
                  </div>
                </div>
                <div
                  className={cn([
                    "h-5 w-5 rounded-full border transition-colors",
                    displayedPaymentMethod === "transferencia"
                      ? "border-[rgb(var(--brand-600))] bg-[rgb(var(--brand-600))]"
                      : "border-[rgb(var(--brand-300))] bg-transparent",
                  ])}
                >
                  {displayedPaymentMethod === "transferencia" && (
                    <div className="mx-auto mt-[6px] h-2 w-2 rounded-full bg-white" />
                  )}
                </div>
              </motion.button>
              <motion.button
                type="button"
                disabled={paymentMethodCompleted}
                onClick={() => {
                  if (paymentMethodCompleted) return;
                  onPaymentMethodChange?.("mercadopago");
                }}
                whileHover={
                  paymentMethodCompleted ? undefined : { scale: 1.01 }
                }
                whileTap={paymentMethodCompleted ? undefined : { scale: 0.99 }}
                className={cn([
                  "group flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-colors",
                  displayedPaymentMethod === "mercadopago"
                    ? "border-[rgb(var(--brand-600))] bg-[rgb(var(--brand-50))]"
                    : "border-[rgb(var(--brand-200))] bg-[rgb(var(--surface))] hover:bg-[rgb(var(--brand-50))]",
                  paymentMethodCompleted && "cursor-not-allowed opacity-70",
                ])}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn([
                      "flex h-10 w-10 items-center justify-center rounded-xl border",
                      displayedPaymentMethod === "mercadopago"
                        ? "border-[rgb(var(--brand-600)/0.20)] bg-white"
                        : "border-[rgb(var(--brand-200))] bg-[rgb(var(--surface))]",
                    ])}
                  >
                    <Image
                      src="/mercadopago.svg"
                      alt="Mercado Pago"
                      width={18}
                      height={18}
                      className="h-5 w-5"
                    />
                  </div>
                  <div className="leading-tight">
                    <div className="text-sm font-semibold text-[rgb(var(--brand-900))]">
                      Mercado Pago
                    </div>
                    <div className="text-xs text-[rgb(var(--brand-600))]">
                      Tarjeta o saldo
                    </div>
                  </div>
                </div>
                <div
                  className={cn([
                    "h-5 w-5 rounded-full border transition-colors",
                    displayedPaymentMethod === "mercadopago"
                      ? "border-[rgb(var(--brand-600))] bg-[rgb(var(--brand-600))]"
                      : "border-[rgb(var(--brand-300))] bg-transparent",
                  ])}
                >
                  {displayedPaymentMethod === "mercadopago" && (
                    <div className="mx-auto mt-[6px] h-2 w-2 rounded-full bg-white" />
                  )}
                </div>
              </motion.button>
            </div>
          )}
        </div>
      )}

      {/* Botón Ver más productos */}
      <div className="mt-6">
        <Link
          href="/shop"
          className="btn-surface flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200"
        >
          <TbBasketExclamation className="w-5 h-5 text-[rgb(var(--brand-700))]" />
          Ver más productos
        </Link>
      </div>
    </motion.div>
  );
};

export default OrderSummary;

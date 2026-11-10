"use client";

import React from "react";
import AddToCartBtn from "./AddToCartBtn";
import { Product } from '@/types/product';
import { CASH_DEPOSIT_DISCOUNT_PCT, resolveProductPricing } from '@/lib/product-pricing';
import { formatPrice, parseDiscountPct } from "@/lib/utils";
import { DollarSign, Layers, Ruler, Square, ShoppingCart, CheckCircle2, MapPin, Sparkles, Banknote } from "lucide-react";
import InfoAccordion from "../InfoAccordion";
import { AnimatePresence, motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { PLACEHOLDER_IMAGE } from "@/lib/constants";
import { getQuantityRules } from "@/utils/productUtils";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { addToCart, updateCartItemQuantity } from "@/lib/features/carts/cartsSlice";
import { trackMetaAddToCart, trackMetaViewContent } from "@/lib/meta-pixel";
 

const AddToCardSection = ({ data }: { data: Product }) => {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const cartQty = useAppSelector((s) => {
    const items = s.carts.cart?.items ?? [];
    const item = items.find((it: any) => it.id === data.id || it.productId === data.id);
    return Number(item?.quantity) || 0;
  });
  const pricing = resolveProductPricing(data);
  const hasDiscount = pricing.discount.amount > 0;
  const discountPercent = Math.round(pricing.discount.percentage);
  const finalUnitPrice = pricing.finalPrice;
  const efectivoPctSafe = parseDiscountPct(process.env.NEXT_PUBLIC_TRANSFERENCIA_DESCUENTO_PCT, 0.10);
  const efectivoPrice = Math.round((finalUnitPrice - Math.round(finalUnitPrice * efectivoPctSafe * 100) / 100) * 100) / 100;

  const [ancho, setAncho] = React.useState<string>("");
  const [largo, setLargo] = React.useState<string>("");
  const [isAddingFromCalculator, setIsAddingFromCalculator] = React.useState(false);
  const [calculatorAddedQty, setCalculatorAddedQty] = React.useState<number | null>(null);
  const parseDec = (s: string) => {
    const v = String(s || "").trim().replace(",", ".");
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  const a = parseDec(ancho);
  const l = parseDec(largo);
  const hasMeasures = a > 0 && l > 0;
  const area = hasMeasures
    ? Math.max(0, Math.round((a * l) * 100) / 100)
    : 0;
  const ext = data.external;
  const parseExtNum = (value: any) => {
    const v = String(value ?? "").trim().replace(",", ".");
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  const rendimiento = parseExtNum(ext?.rendimiento);
  const largoCm = parseExtNum(ext?.largo);
  const altoCm = parseExtNum(ext?.alto);
  const coveragePerPiece =
    Number.isFinite(rendimiento) && (rendimiento as number) > 0
      ? Number(rendimiento)
      : (((Number.isFinite(largoCm) ? (largoCm as number) : 0) / 100) * ((Number.isFinite(altoCm) ? (altoCm as number) : 0) / 100));
  const paneles =
    hasMeasures && coveragePerPiece > 0
      ? Math.max(0, Math.ceil(area / coveragePerPiece))
      : 0;
  const costoEstimado = paneles * finalUnitPrice;
  const quantityRules = getQuantityRules({ pack: data.pack, minimoCompra: data.minimoCompra });
  const qtyToAddFromCalculator =
    paneles > 0
      ? Math.max(
          quantityRules.min,
          quantityRules.step > 1
            ? Math.ceil(paneles / quantityRules.step) * quantityRules.step
            : paneles
        )
      : 0;
  const shouldShowCalcAddCta = qtyToAddFromCalculator > 0;
  const adjustedToMultiple =
    quantityRules.step > 1 && paneles > 0 && qtyToAddFromCalculator !== paneles;

  const normalizeUnitText = (value: any) =>
    String(value ?? "")
      .trim()
      .toLowerCase()
      .replace("²", "2");
  const unitRaw =
    (data as any)?.unidad ||
    (data as any)?.unidadMedida ||
    (data as any)?.unit ||
    (data as any)?.priceUnit ||
    data.secondaryPriceText ||
    (data as any)?.external?.unidad ||
    (data as any)?.external?.unidadMedida ||
    "";
  const unitHint = normalizeUnitText(unitRaw);
  const nameHint = String(data?.name || "").toLowerCase();
  const shouldShowCalculator = /\bm2\b/.test(unitHint) || /\bm2\b/.test(normalizeUnitText(nameHint));
  const trackedViewRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!data?.id) return;
    if (trackedViewRef.current === data.id) return;
    trackedViewRef.current = data.id;
    trackMetaViewContent({
      id: data.id,
      productId: data.id,
      name: data.name,
      price: Number(data.price) || 0,
    });
  }, [data?.id, data?.name, data?.price]);

  const addFromCalculator = async () => {
    if (!shouldShowCalcAddCta || isAddingFromCalculator) return;
    setIsAddingFromCalculator(true);

    const checkAvailability = async () => {
      try {
        const response = await fetch(`/api/products/${data.id}`);
        if (!response.ok) return false;
        const product = await response.json();
        return product && product.active === true;
      } catch {
        return false;
      }
    };

    const isAvailable = await checkAvailability();
    if (!isAvailable) {
      setIsAddingFromCalculator(false);
      toast({
        title: "Producto no disponible",
        description: "No hay stock o el producto está inactivo.",
        variant: "destructive",
      });
      return;
    }
    if (cartQty > 0) {
      dispatch(updateCartItemQuantity({ id: data.id, delta: qtyToAddFromCalculator }));
    } else {
      dispatch(
        addToCart({
          id: data.id,
          name: data.name,
          price: Number(data.price) || 0,
          quantity: qtyToAddFromCalculator,
          totalPrice: (Number(data.price) || 0) * qtyToAddFromCalculator,
          image: (data as any)?.images?.[0] || data.srcUrl || PLACEHOLDER_IMAGE,
          srcUrl: data.srcUrl,
          weightKg: (data as any)?.weightKg ?? (data as any)?.external?.kg ?? null,
          discount: data.discount as any,
          slug: data.name.split(" ").join("-"),
          productId: data.id,
          pack: data.pack ?? null,
          minimoCompra: data.minimoCompra ?? null,
        } as any)
      );
    }
    trackMetaAddToCart(
      {
        id: data.id,
        productId: data.id,
        name: data.name,
        price: Number(data.price) || 0,
      },
      qtyToAddFromCalculator
    );

    setCalculatorAddedQty(qtyToAddFromCalculator);
    setIsAddingFromCalculator(false);
    toast({
      title: "¡Listo!",
      description: `Se agregaron ${qtyToAddFromCalculator} unidades al carrito.`,
      variant: "cart",
    });
  };

  React.useEffect(() => {
    if (!calculatorAddedQty) return;
    const t = setTimeout(() => setCalculatorAddedQty(null), 2000);
    return () => clearTimeout(t);
  }, [calculatorAddedQty]);
 

  return (
    <div className="lg:sticky lg:top-24 w-full">
      <div className="w-full space-y-4 sm:space-y-6 pb-4 lg:pb-0">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-6">
          <div className="space-y-2">
            <div className="space-y-1">
              {hasDiscount && (
                <div className="text-sm text-gray-500 line-through">{formatPrice(data.price)}</div>
              )}
              <div className="flex items-center gap-2">
                <div className="text-3xl sm:text-4xl font-bold text-gray-900">{formatPrice(finalUnitPrice)}</div>
                {hasDiscount && (
                  <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 border border-red-200">
                    -{discountPercent}% producto
                  </span>
                )}
              </div>
            </div>
            {/* <button type="button" className="text-xs uppercase tracking-wider text-gray-600 hover:underline">
              Ver otras opciones de financiación
            </button> */}
            <div className="inline-flex items-center rounded-full border border-[rgb(var(--brand-600)/0.25)] bg-[rgb(var(--brand-50))] px-2.5 py-1 font-semibold text-[rgb(var(--brand-800))] uppercase tracking-wide">
              {efectivoPctSafe > 0 ? `-${Math.round(efectivoPctSafe * 100)}% ${hasDiscount ? "adicional " : ""}por ` : ""}Transferencia ·{" "}
              <span className="font-bold">{formatPrice(efectivoPrice)}</span>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              whileHover={{ scale: 1.01 }}
              className="relative overflow-hidden rounded-2xl border border-[rgb(var(--brand-600)/0.18)] bg-gradient-to-r from-[rgb(var(--brand-50))] via-white to-[rgb(var(--brand-50))] p-4 shadow-sm"
            >
              <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-[rgb(var(--brand-200))]/35 to-transparent" />
              <div className="relative flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[rgb(var(--brand-700))] text-white shadow-sm">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-sm font-extrabold uppercase tracking-wide text-[rgb(var(--brand-900))]">
                      {CASH_DEPOSIT_DISCOUNT_PCT * 100}% OFF en efectivo en depósito
                    </span>
                  </div>
                  <div className="mt-1 text-xs leading-relaxed text-[rgb(var(--brand-800))]">
                    Si te acercás a nuestro depósito y pagás en efectivo, tu compra suma un{" "}
                    <strong className="text-[rgb(var(--brand-900))]">{CASH_DEPOSIT_DISCOUNT_PCT * 100}% OFF sobre el precio del producto</strong>. No se combina con el descuento por transferencia.
                  </div>
                  <div className="mt-2 flex items-start gap-2 text-xs text-[rgb(var(--brand-700))]">
                    <MapPin className="mt-[1px] h-4 w-4 shrink-0 text-[rgb(var(--brand-700))]" />
                    <span className="min-w-0">
                      Murature 4574, B1672 Villa Lynch, Provincia de Buenos Aires
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="w-full sm:w-[260px] space-y-2.5 sm:space-y-3">
            <AddToCartBtn data={data} />
            <button
              type="button"
              className="w-full px-4 sm:px-6 min-h-[44px] py-2 rounded-full border border-[rgb(var(--brand-600))] text-[rgb(var(--brand-600))] text-[11px] sm:text-xs font-medium uppercase tracking-wide hover:bg-[rgb(var(--brand-600)/0.05)] transition text-center whitespace-normal break-words leading-tight flex items-center justify-center"
            >
              Consultar cotización personalizada
            </button>
          </div>
        </div>

        {shouldShowCalculator && (
          <div className="rounded-2xl border border-[rgb(var(--brand-600)/0.16)] bg-[rgb(var(--surface))] overflow-hidden shadow-sm">
            <div className="grid grid-cols-1">
              <div className="p-4 sm:p-5 border-b md:border-b-0 md:border-r border-[rgb(var(--brand-600)/0.12)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs uppercase tracking-wider text-[rgb(var(--brand-900))] font-bold">Calculadora de m²</div>
                  <div className="text-[11px] text-[rgb(var(--brand-700))]">Indicá las medidas para estimar.</div>
                </div>
                <div className="pt-3 sm:pt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                    <div className="space-y-1.5">
                      <div className="text-[11px] uppercase tracking-wider text-[rgb(var(--brand-800))] font-bold">Ancho (m)*</div>
                      <div className="flex items-center gap-2 border border-[rgb(var(--brand-600)/0.18)] rounded-xl px-3 h-11 bg-white">
                        <Ruler className="w-4 h-4 text-[rgb(var(--brand-600))]" />
                        <input
                          value={ancho}
                          onChange={(e) => setAncho(e.target.value)}
                          inputMode="decimal"
                          placeholder="0.00"
                          className="w-full outline-none text-sm placeholder:text-[rgb(var(--brand-600))]"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-[11px] uppercase tracking-wider text-[rgb(var(--brand-800))] font-bold">Largo/Alto (m)*</div>
                      <div className="flex items-center gap-2 border border-[rgb(var(--brand-600)/0.18)] rounded-xl px-3 h-11 bg-white">
                        <Ruler className="w-4 h-4 text-[rgb(var(--brand-600))]" />
                        <input
                          value={largo}
                          onChange={(e) => setLargo(e.target.value)}
                          inputMode="decimal"
                          placeholder="0.00"
                          className="w-full outline-none text-sm placeholder:text-[rgb(var(--brand-600))]"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2.5 sm:gap-3 border-t border-[rgb(var(--brand-600)/0.12)] pt-3 sm:pt-4">
                    <div className="rounded-xl border border-[rgb(var(--brand-600)/0.14)] bg-white px-2.5 py-2.5 sm:px-3 sm:py-3 flex flex-col items-center text-center gap-1.5 justify-center">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-[rgb(var(--brand-100))] text-[rgb(var(--brand-700))] flex items-center justify-center shrink-0">
                        <Square className="w-4 h-4" />
                      </div>
                      <div className="leading-tight">
                        <div className="text-sm sm:text-lg font-semibold text-[rgb(var(--brand-900))]">{hasMeasures ? `${area.toFixed(2)} m²` : "—"}</div>
                        <div className="text-[10px] sm:text-[11px] uppercase tracking-wide text-[rgb(var(--brand-700))]">m² totales</div>
                      </div>
                    </div>
                    <div className="rounded-xl border border-[rgb(var(--brand-600)/0.14)] bg-white px-2.5 py-2.5 sm:px-3 sm:py-3 flex flex-col items-center text-center gap-1.5 justify-center">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-[rgb(var(--brand-100))] text-[rgb(var(--brand-700))] flex items-center justify-center shrink-0">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div className="leading-tight">
                        <div className="text-sm sm:text-lg font-semibold text-[rgb(var(--brand-900))]">{hasMeasures && coveragePerPiece > 0 ? paneles : "—"}</div>
                        <div className="text-[10px] sm:text-[11px] uppercase tracking-wide text-[rgb(var(--brand-700))]">Necesarios</div>
                      </div>
                    </div>
                    <div className="rounded-xl border border-[rgb(var(--brand-600)/0.14)] bg-white px-2.5 py-2.5 sm:px-3 sm:py-3 flex flex-col items-center text-center gap-1.5 justify-center">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-[rgb(var(--brand-100))] text-[rgb(var(--brand-700))] flex items-center justify-center shrink-0">
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <div className="leading-tight">
                        <div className="text-sm sm:text-lg font-semibold text-[rgb(var(--brand-900))]">{hasMeasures && coveragePerPiece > 0 ? formatPrice(costoEstimado) : "—"}</div>
                        <div className="text-[10px] sm:text-[11px] uppercase tracking-wide text-[rgb(var(--brand-700))]">Costo estimado</div>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence initial={false}>
                    {shouldShowCalcAddCta && (
                      <motion.div
                        key="calc-cta"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.2 }}
                        className="pt-3"
                      >
                        <motion.button
                          type="button"
                          onClick={addFromCalculator}
                          disabled={isAddingFromCalculator}
                          whileTap={{ scale: 0.98 }}
                          className="w-full h-11 rounded-full bg-[rgb(var(--brand-700))] text-white text-sm font-semibold uppercase tracking-[0.08em] hover:bg-[rgb(var(--brand-800))] transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          Agregar {qtyToAddFromCalculator}
                        </motion.button>

                        {adjustedToMultiple && (
                          <div className="mt-2 text-[11px] text-[rgb(var(--brand-700))] text-center">
                            Se ajusta automáticamente a la presentación del producto.
                          </div>
                        )}

                        <AnimatePresence initial={false}>
                          {calculatorAddedQty && (
                            <motion.div
                              key="calc-added"
                              initial={{ opacity: 0, y: -6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              transition={{ duration: 0.2 }}
                              className="mt-2 h-8 rounded-lg px-3 text-xs flex items-center justify-center gap-1.5 bg-[rgb(var(--brand-600)/0.08)] text-[rgb(var(--brand-700))] border border-[rgb(var(--brand-600)/0.18)]"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Agregado al carrito · {calculatorAddedQty}</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4">
          <InfoAccordion product={data} compact />
        </div>
      </div>
    </div>
  );
};

export default AddToCardSection;

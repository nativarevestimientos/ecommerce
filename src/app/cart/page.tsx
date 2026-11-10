"use client";

import BreadcrumbCart from "@/components/cart-page/BreadcrumbCart";
import ProductCard from "@/components/cart-page/ProductCard";
import { Button } from "@/components/ui/button";
import InputGroup from "@/components/ui/input-group";
import { cn, parseDiscountPct } from "@/lib/utils";
import { satoshi } from "@/styles/fonts";
import { FaArrowRight } from "react-icons/fa6";
import { MdInfoOutline, MdOutlineLocalOffer } from "react-icons/md";
import { TbBasketExclamation } from "react-icons/tb";
import React, { useMemo, useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from '@/context/AuthContext';
import { PLACEHOLDER_IMAGE } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";
import { BanknotesIcon } from "@heroicons/react/24/outline";
import { setCart, setPaymentMethod } from "@/lib/features/carts/cartsSlice";
import { isNaveGaliciaEnabled } from "@/lib/paymentConfig";

const NAVE_LOGO_URL = "https://www.eventosagr.com.ar/networking/assets/img/nave.png";

export default function CartPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const cart = useAppSelector((s) => s.carts.cart);
  const paymentMethod = useAppSelector((s) => s.carts.paymentMethod);
  const loading = false;
  const { user } = useAuth();
  const [showAllItems, setShowAllItems] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [unavailableItemIds, setUnavailableItemIds] = useState<string[]>([]);
  const [mustDiscardChanges, setMustDiscardChanges] = useState(false);
  const [productSnapshots, setProductSnapshots] = useState<Record<string, any>>({});

  const unavailableSet = useMemo(() => new Set(unavailableItemIds), [unavailableItemIds]);

  useEffect(() => {
    if (!isNaveGaliciaEnabled && paymentMethod === "nave_galicia") {
      dispatch(setPaymentMethod("mercadopago"));
    }
  }, [dispatch, paymentMethod]);

  // Detectar si es dispositivo móvil
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Verificar al cargar
    checkIfMobile();

    // Verificar al cambiar el tamaño de la ventana
    window.addEventListener("resize", checkIfMobile);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  const getRecalculatedTotalPrice = (item: any) => {
    const qty = Number(item.quantity) || 0;
    const unit = Number(item.price) || 0;
    const promo = item.activePromo;
    let effectiveTotal = unit * qty;
    if (promo && promo.cantidad > 0) {
      const promoQty = Math.min(qty, promo.cantidad);
      const extraQty = Math.max(0, qty - promoQty);
      effectiveTotal = (promoQty > 0 ? Number(promo.precioFinal) || 0 : 0) + extraQty * unit;
    } else if (item.discount) {
      const percentage = Number(item.discount?.percentage ?? 0);
      const amount = Number(item.discount?.amount ?? 0);
      const discountedUnit =
        percentage > 0 ? unit * (1 - percentage / 100) : (amount > 0 ? unit - amount : unit);
      effectiveTotal = (Math.round(discountedUnit * 100) / 100) * qty;
    }
    return Math.round(effectiveTotal * 100) / 100;
  };

  useEffect(() => {
    if (!cart?.items?.length) return;

    let cancelled = false;
    const run = async () => {
      setIsCheckingAvailability(true);
      try {
        const uniqueIds = Array.from(
          new Set(
            cart.items
              .map((it: any) => String(it.productId || it.id || ""))
              .filter(Boolean)
          )
        );

        const results = await Promise.all(
          uniqueIds.map(async (id) => {
            try {
              const res = await fetch(`/api/products/${encodeURIComponent(id)}`, {
                cache: "no-store",
              });
              if (!res.ok) return { id, ok: false, product: null };
              const product = await res.json().catch(() => null);
              return { id, ok: true, product };
            } catch {
              return { id, ok: false, product: null };
            }
          })
        );

        if (cancelled) return;

        const snapshots: Record<string, any> = {};
        const unavailable: string[] = [];

        for (const r of results) {
          if (r.ok && r.product) {
            snapshots[r.id] = r.product;
          } else {
            unavailable.push(r.id);
          }
        }

        setProductSnapshots(snapshots);
        setUnavailableItemIds(unavailable);
        setMustDiscardChanges(unavailable.length > 0);

        const pickComparable = (it: any) => ({
          name: it?.name,
          price: Number(it?.price ?? 0),
          image: it?.image,
          srcUrl: it?.srcUrl,
          images: it?.images,
          description: it?.description,
          discount: it?.discount,
          pack: it?.pack ?? null,
          minimoCompra: it?.minimoCompra ?? null,
          weightKg: it?.weightKg ?? null,
          external: it?.external ?? null,
          category: it?.category,
          subcategory: it?.subcategory,
          unidad: it?.unidad,
          unidadMedida: it?.unidadMedida,
          unit: it?.unit,
        });

        let shouldWrite = false;
        const updatedItems = cart.items.map((it: any) => {
          const id = String(it.productId || it.id || "");
          const snap = snapshots[id];
          if (!snap) return it;

          const snapImages: string[] = Array.isArray(snap.images) ? snap.images.filter(Boolean) : [];
          const mainImage = snapImages[0] || snap.srcUrl || it.image || it.srcUrl || PLACEHOLDER_IMAGE;

          const next = {
            ...it,
            id: it.id ?? it.productId ?? id,
            productId: it.productId ?? it.id ?? id,
            name: snap.name ?? snap.title ?? it.name,
            price: Number(snap.price ?? it.price) || 0,
            description: snap.description ?? it.description,
            images: snapImages.length ? snapImages : (it.images ?? undefined),
            srcUrl: snap.srcUrl ?? mainImage,
            image: mainImage,
            discount: snap.discount ?? it.discount,
            pack: snap.pack ?? it.pack ?? null,
            minimoCompra: snap.minimoCompra ?? it.minimoCompra ?? null,
            category: snap.category ?? it.category,
            subcategory: snap.subcategory ?? it.subcategory,
            unidad: snap.unidad ?? it.unidad,
            unidadMedida: snap.unidadMedida ?? it.unidadMedida,
            unit: snap.unit ?? it.unit,
            external: snap.external ?? it.external,
            weightKg: (snap.external?.kg ?? it.weightKg ?? null),
          };

          const normalized = {
            ...next,
            slug: String(next.slug || next.name || "").split(" ").join("-"),
          };

          const prevComparable = JSON.stringify(pickComparable(it));
          const nextComparable = JSON.stringify(pickComparable(normalized));
          if (prevComparable !== nextComparable) {
            shouldWrite = true;
          }

          return {
            ...normalized,
            totalPrice: getRecalculatedTotalPrice(normalized),
          };
        });

        if (shouldWrite) {
          dispatch(
            setCart({
              items: updatedItems as any,
              totalQuantities: updatedItems.reduce(
                (acc, it: any) => acc + (Number(it.quantity) || 0),
                0
              ),
            })
          );
        }
      } finally {
        if (!cancelled) setIsCheckingAvailability(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [cart?.items, dispatch]);

  const totalPrice =
    cart?.items?.reduce((acc, item) => acc + item.price * item.quantity, 0) ??
    0;

  // Calcular el total de descuentos por promociones y descuentos normales
  const calculateDiscounts = () => {
    if (!cart?.items) return { promoDiscounts: 0, normalDiscounts: 0 };

    return cart.items.reduce((acc, item) => {
      const qty = Number(item.quantity) || 0;
      const unit = Number(item.price) || 0;
      const originalPrice = unit * qty;
      let promoDiscount = 0;
      let normalDiscount = 0;

      if (item.activePromo) {
        const promo = item.activePromo;
        const promoQty = Math.min(qty, promo.cantidad);
        const extraQty = Math.max(0, qty - promoQty);
        const effectiveTotal =
          (promoQty > 0 ? Number(promo.precioFinal) || 0 : 0) + extraQty * unit;
        promoDiscount = Math.max(0, originalPrice - effectiveTotal);
      } else if (item.discount?.percentage > 0 || item.discount?.amount > 0) {
        const percentage = Number(item.discount?.percentage ?? 0);
        const amount = Number(item.discount?.amount ?? 0);
        const discountedUnit =
          percentage > 0
            ? unit * (1 - percentage / 100)
            : amount > 0
              ? unit - amount
              : unit;
        const effectiveTotal = (Math.round(discountedUnit * 100) / 100) * qty;
        normalDiscount = Math.max(0, originalPrice - effectiveTotal);
      }

      return {
        promoDiscounts: acc.promoDiscounts + promoDiscount,
        normalDiscounts: acc.normalDiscounts + normalDiscount
      };
    }, { promoDiscounts: 0, normalDiscounts: 0 });
  };

  const { promoDiscounts, normalDiscounts } = calculateDiscounts();
  const hasPromoDiscounts = promoDiscounts > 0;
  const hasNormalDiscounts = normalDiscounts > 0;
  const hasBothDiscounts = hasPromoDiscounts && hasNormalDiscounts;

  const totalDiscounts = promoDiscounts + normalDiscounts;
  const netTotal = totalPrice - totalDiscounts;
  const transferenciaPctSafe = parseDiscountPct(process.env.NEXT_PUBLIC_TRANSFERENCIA_DESCUENTO_PCT, 0.10);
  const transferenciaDiscount =
    paymentMethod === "transferencia" && transferenciaPctSafe > 0
      ? Math.round(netTotal * transferenciaPctSafe * 100) / 100
      : 0;
  const finalTotal = Math.round((netTotal - transferenciaDiscount) * 100) / 100;

  const discardChanges = () => {
    if (!cart?.items?.length) return;

    const updatedItems = cart.items
      .filter((it: any) => {
        const id = String(it.productId || it.id || "");
        return id && !unavailableSet.has(id);
      })
      .map((it: any) => {
        const id = String(it.productId || it.id || "");
        const snap = productSnapshots[id];
        const next = {
          ...it,
          id: it.id ?? it.productId ?? id,
          productId: it.productId ?? it.id ?? id,
          name: snap?.name ?? it.name,
          price: Number(snap?.price ?? it.price) || 0,
          srcUrl: snap?.srcUrl ?? it.srcUrl ?? it.image ?? PLACEHOLDER_IMAGE,
          image: snap?.srcUrl ?? it.image ?? it.srcUrl ?? PLACEHOLDER_IMAGE,
          discount: snap?.discount ?? it.discount,
        };
        return {
          ...next,
          totalPrice: getRecalculatedTotalPrice(next),
        };
      });

    dispatch(
      setCart({
        items: updatedItems as any,
        totalQuantities: updatedItems.reduce(
          (acc, it: any) => acc + (Number(it.quantity) || 0),
          0
        ),
      })
    );
    setUnavailableItemIds([]);
    setMustDiscardChanges(false);
  };

  // Determinar qué productos mostrar según el dispositivo
  const displayedItems = useMemo(() => {
    const items = cart?.items ?? [];
    if (isMobile && !showAllItems && items.length > 3) return items.slice(0, 3);
    return items;
  }, [cart?.items, isMobile, showAllItems]);

  const hasMoreItems = isMobile && cart?.items && cart.items.length > 3;

  // Función para formatear moneda
  const formatCurrency = (value: number) => {
    return value.toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[rgb(var(--brand-300))]"></div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center flex-col text-[rgb(var(--brand-400))] mt-32"
      >
        <TbBasketExclamation strokeWidth={1} className="text-6xl mb-4" />
        <span className="block mb-4 text-lg">
          No hay productos en el carrito.
        </span>
        <Button className="btn-brand rounded-full px-8" asChild>
          <Link href="/shop">Comprar</Link>
        </Button>
      </motion.div>
    );
  }

  return (
    <main className="pb-20">
      <hr className="h-[1px] border-t-[rgb(var(--brand-200))] mb-5 sm:mb-6" />
      <div className="max-w-frame mx-auto">
        {cart && cart.items.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <BreadcrumbCart />
            <h2
              className={cn([
                satoshi.className,
                "text-2xl font-bold text-center mb-8 text-[rgb(var(--brand-900))]",
              ])}
            >
              Tu Carrito
            </h2>
            {mustDiscardChanges && (
              <div className="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <MdInfoOutline className="mt-0.5 text-xl text-yellow-700" />
                    <div className="text-sm text-yellow-900">
                      Algunos productos no se encuentran disponible para tu pedido.
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={discardChanges}
                    className="w-full sm:w-auto border-yellow-300 text-yellow-900 hover:bg-yellow-100"
                  >
                    Descartar cambios
                  </Button>
                </div>
              </div>
            )}
            <div className="flex flex-col lg:flex-row space-y-5 lg:space-y-0 lg:space-x-5 items-start">
              <motion.div
                className="w-full p-4 md:p-5 flex-col space-y-4 rounded-xl border border-[rgb(var(--brand-200))] bg-[rgb(var(--surface))] shadow-sm"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <AnimatePresence mode="wait">
                  {displayedItems.map((product, idx, arr) => {
                    const productImage =
                      (product as any)?.srcUrl ||
                      (product as any)?.image ||
                      PLACEHOLDER_IMAGE;
                    const productData = {
                      ...product,
                      id: product.id ?? product.productId ?? idx.toString(),
                      name: product.name ?? "Producto sin nombre",
                      price: product.price ?? 0,
                      quantity: product.quantity ?? 1,
                      totalPrice: typeof (product as any).totalPrice === "number" ? (product as any).totalPrice : undefined,
                      srcUrl: productImage,
                      image: productImage,
                      discount: product.discount ?? {
                        percentage: 0,
                        amount: 0,
                      },
                      slug: product.slug ?? "",
                      productId: product.productId ?? "",
                    };

                    return (
                      <motion.div
                        key={productData.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ProductCard
                          data={productData}
                          isUnavailable={unavailableSet.has(String(productData.productId || productData.id))}
                        />
                        {arr.length - 1 !== idx && (
                          <hr className="border-t-[rgb(var(--brand-200))] my-4" />
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {isMobile && !showAllItems && hasMoreItems && (
                  <motion.div
                    className="flex justify-center pt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <Button
                      onClick={() => setShowAllItems(true)}
                      variant="ghost"
                      className="text-sm text-[rgb(var(--brand-700))] hover:text-[rgb(var(--brand-900))] hover:bg-[rgb(var(--brand-50))]"
                    >
                      Ver {cart.items.length - 3}{" "}
                      {cart.items.length - 3 === 1
                        ? "producto más"
                        : "productos más"}
                    </Button>
                  </motion.div>
                )}

                {isMobile && showAllItems && hasMoreItems && (
                  <motion.div
                    className="flex justify-center pt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <Button
                      onClick={() => setShowAllItems(false)}
                      variant="ghost"
                      className="text-sm text-[rgb(var(--brand-700))] hover:text-[rgb(var(--brand-900))] hover:bg-[rgb(var(--brand-50))]"
                    >
                      Mostrar menos
                    </Button>
                  </motion.div>
                )}
              </motion.div>

              <motion.div
                className="w-full lg:max-w-[400px] p-5 flex-col space-y-4 rounded-xl border border-[rgb(var(--brand-200))] bg-[rgb(var(--surface))] shadow-sm sticky top-4"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h6 className="text-lg font-semibold text-[rgb(var(--brand-900))]">
                  Resumen del Pedido ({cart.items.length}{" "}
                  {cart.items.length === 1 ? "producto" : "productos"})
                </h6>
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[rgb(var(--brand-600))]">Subtotal</span>
                    <span className="text-sm font-medium text-[rgb(var(--brand-900))]">
                      ${formatCurrency(totalPrice)}
                    </span>
                  </div>
                  {hasBothDiscounts && (
                    <motion.div
                      className="flex items-center justify-between"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <span className="text-sm text-[rgb(var(--brand-600))]">
                        Descuentos por promociones
                      </span>
                      <span className="text-sm font-medium text-green-600">
                        -${formatCurrency(promoDiscounts)}
                      </span>
                    </motion.div>
                  )}
                  {hasBothDiscounts && (
                    <motion.div
                      className="flex items-center justify-between"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <span className="text-sm text-[rgb(var(--brand-600))]">
                        Descuentos por productos
                      </span>
                      <span className="text-sm font-medium text-green-600">
                        -${formatCurrency(normalDiscounts)}
                      </span>
                    </motion.div>
                  )}
                  {(hasPromoDiscounts || hasNormalDiscounts) && !hasBothDiscounts && (
                      <motion.div
                        className="flex items-center justify-between"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <span className="text-sm text-[rgb(var(--brand-600))]">Descuento</span>
                        <span className="text-sm font-medium text-green-600">
                          -${formatCurrency(promoDiscounts + normalDiscounts)}
                        </span>
                      </motion.div>
                    )}
                  {hasBothDiscounts && (
                    <motion.div
                      className="flex items-center justify-between"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <span className="text-sm text-[rgb(var(--brand-600))]">
                        Total descuentos
                      </span>
                      <span className="text-sm font-medium text-green-600">
                        -${formatCurrency(promoDiscounts + normalDiscounts)}
                      </span>
                    </motion.div>
                  )}
                  {paymentMethod === "transferencia" && transferenciaDiscount > 0 && (
                    <motion.div
                      className="flex items-center justify-between"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <span className="text-sm text-[rgb(var(--brand-600))]">
                        Desc. transferencia
                      </span>
                      <span className="text-sm font-medium text-green-600">
                        -${formatCurrency(transferenciaDiscount)}
                      </span>
                    </motion.div>
                  )}
                  <hr className="border-t-[rgb(var(--brand-200))]" />
                  <div className="flex items-center justify-between">
                    <span className="text-base font-medium text-[rgb(var(--brand-900))]">
                      Total
                    </span>
                    <span className="text-lg font-semibold text-[rgb(var(--brand-900))]">
                      ${formatCurrency(finalTotal)}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <InputGroup className="bg-[rgb(var(--brand-50))] border border-[rgb(var(--brand-200))]">
                    <InputGroup.Text>
                      <MdOutlineLocalOffer className="text-[rgb(var(--brand-500))] text-lg" />
                    </InputGroup.Text>
                    <InputGroup.Input
                      type="text"
                      name="code"
                      placeholder={
                        loading ? "Cargando..." : "Agregar código promocional"
                      }
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

                <div className="flex flex-col gap-2">
                  <div className="text-sm font-medium text-[rgb(var(--brand-900))]">
                    Elegí tu forma de pago
                  </div>
                  <div className="flex flex-col gap-3">
                    <motion.button
                      type="button"
                      onClick={() => {
                        dispatch(setPaymentMethod("mercadopago"));
                      }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={cn([
                        "group flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-colors",
                        paymentMethod === "mercadopago"
                          ? "border-[rgb(var(--brand-600))] bg-[rgb(var(--brand-50))]"
                          : "border-[rgb(var(--brand-200))] bg-[rgb(var(--surface))] hover:bg-[rgb(var(--brand-50))]",
                      ])}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn([
                            "flex h-10 w-10 items-center justify-center rounded-xl border",
                            paymentMethod === "mercadopago"
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
                          paymentMethod === "mercadopago"
                            ? "border-[rgb(var(--brand-600))] bg-[rgb(var(--brand-600))]"
                            : "border-[rgb(var(--brand-300))] bg-transparent",
                        ])}
                      >
                        {paymentMethod === "mercadopago" && (
                          <div className="mx-auto mt-[6px] h-2 w-2 rounded-full bg-white" />
                        )}
                      </div>
                    </motion.button>

                    <motion.button
                      type="button"
                      onClick={() => {
                        dispatch(setPaymentMethod("transferencia"));
                      }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={cn([
                        "group flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left",
                        paymentMethod === "transferencia"
                          ? "border-[rgb(var(--brand-600))] bg-[rgb(var(--brand-50))]"
                          : "border-[rgb(var(--brand-200))] bg-[rgb(var(--surface))] hover:bg-[rgb(var(--brand-50))]",
                      ])}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn([
                            "flex h-10 w-10 items-center justify-center rounded-xl border",
                            paymentMethod === "transferencia"
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
                          paymentMethod === "transferencia"
                            ? "border-[rgb(var(--brand-600))] bg-[rgb(var(--brand-600))]"
                            : "border-[rgb(var(--brand-300))] bg-transparent",
                        ])}
                      >
                        {paymentMethod === "transferencia" && (
                          <div className="mx-auto mt-[6px] h-2 w-2 rounded-full bg-white" />
                        )}
                      </div>
                    </motion.button>

                    {isNaveGaliciaEnabled && (
                    <motion.button
                      type="button"
                      onClick={() => {
                        dispatch(setPaymentMethod("nave_galicia"));
                      }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={cn([
                        "group flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left",
                        paymentMethod === "nave_galicia"
                          ? "border-[rgb(var(--brand-600))] bg-[rgb(var(--brand-50))]"
                          : "border-[rgb(var(--brand-200))] bg-[rgb(var(--surface))] hover:bg-[rgb(var(--brand-50))]",
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
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => {
                    router.push("/checkout");
                  }}
                  disabled={mustDiscardChanges || isCheckingAvailability}
                  className={cn([
                    "btn-brand text-sm font-medium rounded-full w-full h-12 group shadow-lg transition-all",
                    (mustDiscardChanges || isCheckingAvailability) && "opacity-50 cursor-not-allowed",
                  ])}
                >
                  Ir a Pagar
                  <FaArrowRight className="text-base ml-2 group-hover:translate-x-1 transition-all" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center flex-col text-[rgb(var(--brand-400))] mt-32"
          >
            <TbBasketExclamation strokeWidth={1} className="text-6xl mb-4" />
            <span className="block mb-4 text-lg">
              Tu carrito de compras está vacío.
            </span>
            <Button className="btn-brand rounded-full px-8" asChild>
              <Link href="/shop">Comprar</Link>
            </Button>
          </motion.div>
        )}
      </div>
    </main>
  );
}

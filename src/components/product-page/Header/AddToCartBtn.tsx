"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { PLACEHOLDER_IMAGE } from '@/lib/constants'
import { CheckCircle2, Minus, Package, Plus, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { getQuantityRules } from "@/utils/productUtils";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { addToCart, updateCartItemQuantity } from "@/lib/features/carts/cartsSlice";
import { trackMetaAddToCart } from "@/lib/meta-pixel";

interface Props {
  data: {
    id: string;
    name: string;
    price: number;
    srcUrl: string;
    pack?: number | null;
    minimoCompra?: number | null;
    discount?: { percentage: number; amount: number };
    quantity?: number;
    images: string[];
    weightKg?: number | null;
    external?: {
      kg?: number | null;
    } | null;
    promos?: Array<{
      cantidad: number;
      descuento: number;
      precioFinal: number;
    }>;
  };
  variant?: "pdp" | "card";
  disableIncrease?: boolean;
}

export default function AddToCartBtn({
  data,
  variant = "pdp",
  disableIncrease = false,
}: Props) {
  const [quantity, setQuantity] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const isCard = variant === "card";
  const cartQty = useAppSelector((s) => {
    const items = s.carts.cart?.items ?? [];
    const item = items.find((it: any) => it.id === data.id || it.productId === data.id);
    return Number(item?.quantity) || 0;
  });

  const lastCommittedQtyRef = React.useRef(0);
  const pendingQtyRef = React.useRef<number | null>(null);
  const commitTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const inFlightRef = React.useRef(false);
  const quantityRef = React.useRef(0);

  const quantityRules = useMemo(
    () =>
      getQuantityRules({
        pack: (data as any)?.pack,
        minimoCompra: (data as any)?.minimoCompra,
      }),
    [data]
  );

  useEffect(() => {
    lastCommittedQtyRef.current = cartQty;
    quantityRef.current = cartQty;
    setQuantity(cartQty);
  }, [cartQty]);

  const cartItemBase = useMemo(
    () => ({
      id: data.id,
      name: data.name,
      price: Number(data.price) || 0,
      quantity: 0,
      totalPrice: 0,
      image: data.images?.[0] || data.srcUrl || PLACEHOLDER_IMAGE,
      srcUrl: data.srcUrl,
      weightKg: (data as any)?.weightKg ?? (data as any)?.external?.kg ?? null,
      discount: data.discount ?? { percentage: 0, amount: 0 },
      slug: data.name.split(" ").join("-"),
      productId: data.id,
      pack: (data as any)?.pack ?? null,
      minimoCompra: (data as any)?.minimoCompra ?? null,
    }),
    [data]
  );

  const updateCart = useCallback(async (newQty: number): Promise<boolean> => {
    const checkAvailability = async () => {
      try {
        const response = await fetch(`/api/products/${data.id}`);
        if (!response.ok) {
          return false;
        }

        const product = await response.json();
        return product && product.active === true;
      } catch {
        return false;
      }
    };

    const previousQty = lastCommittedQtyRef.current;
    const delta = newQty - previousQty;
    if (delta === 0) return true;

    if (delta > 0) {
      if (disableIncrease) {
        return false;
      }
      const isAvailable = await checkAvailability();
      if (!isAvailable) {
        return false;
      }
    }

    if (delta > 0) {
      dispatch(
        addToCart({
          ...cartItemBase,
          quantity: delta,
          totalPrice: cartItemBase.price * delta,
        } as any)
      );
      trackMetaAddToCart(
        {
          id: data.id,
          productId: data.id,
          name: data.name,
          price: cartItemBase.price,
        },
        delta
      );
    } else {
      dispatch(updateCartItemQuantity({ id: data.id, delta }));
    }
    return true;
  }, [cartItemBase, data.id, data.name, disableIncrease, dispatch]);

  const commitPending = useCallback(async () => {
    if (inFlightRef.current) return;
    const targetQty = pendingQtyRef.current;
    if (typeof targetQty !== "number") return;

    inFlightRef.current = true;
    setIsUpdating(true);

    const previousQty = lastCommittedQtyRef.current;
    const ok = await updateCart(targetQty);

    if (!ok) {
      if (pendingQtyRef.current === targetQty) {
        pendingQtyRef.current = null;
      }
      inFlightRef.current = false;
      setIsUpdating(false);
      setQuantity(previousQty);
      toast({
        title: "Producto no disponible",
        description: "No hay stock o el producto está inactivo.",
        variant: "destructive",
      });
      if (typeof pendingQtyRef.current === "number") {
        commitPending();
      }
      return;
    }

    lastCommittedQtyRef.current = targetQty;
    if (pendingQtyRef.current === targetQty) {
      pendingQtyRef.current = null;
    }
    inFlightRef.current = false;
    setIsUpdating(false);

    if (previousQty === 0 && targetQty > 0) {
      toast({
        title: "¡Producto agregado al carrito!",
        description: `${data.name} ha sido agregado correctamente al carrito.`,
        variant: "cart",
      });
    } else if (previousQty > 0 && targetQty > 0 && targetQty !== previousQty) {
      toast({
        title: "¡Cantidad actualizada!",
        description: `Se ha actualizado la cantidad de ${data.name} en el carrito.`,
        variant: "cart",
      });
    } else if (previousQty > 0 && targetQty === 0) {
      toast({
        title: "¡Producto eliminado del carrito!",
        description: `${data.name} ha sido eliminado del carrito.`,
        variant: "destructive",
      });
    }

    if (typeof pendingQtyRef.current === "number") {
      commitPending();
    }
  }, [data.name, toast, updateCart]);

  const scheduleCommit = useCallback(
    (nextQty: number, opts?: { flush?: boolean }) => {
      pendingQtyRef.current = nextQty;
      if (commitTimerRef.current) {
        clearTimeout(commitTimerRef.current);
        commitTimerRef.current = null;
      }
      if (opts?.flush) {
        commitPending();
        return;
      }
      commitTimerRef.current = setTimeout(() => {
        commitPending();
      }, 250);
    },
    [commitPending],
  );

  const flushCommit = useCallback(() => {
    if (commitTimerRef.current) {
      clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    }
    commitPending();
  }, [commitPending]);

  const incrementTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const stopIncrementTimer = useCallback(() => {
    if (incrementTimerRef.current) {
      clearInterval(incrementTimerRef.current);
      incrementTimerRef.current = null;
    }
  }, []);
  const setQuantityAndSchedule = useCallback(
    (nextQty: number, opts?: { flush?: boolean }) => {
      quantityRef.current = nextQty;
      setQuantity(nextQty);
      scheduleCommit(nextQty, opts);
    },
    [scheduleCommit],
  );

  const startIncrement = (e: React.PointerEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (disableIncrease) return;
    stopIncrementTimer();
    const base = Number(quantityRef.current) || 0;
    const newQty = base <= 0 ? quantityRules.min : base + quantityRules.step;
    setQuantityAndSchedule(newQty, { flush: base <= 0 });
    incrementTimerRef.current = setInterval(() => {
      const next = (Number(quantityRef.current) || 0) + quantityRules.step;
      setQuantityAndSchedule(next);
    }, 200);
  };

  const startDecrement = (e: React.PointerEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    stopIncrementTimer();
    const base = Number(quantityRef.current) || 0;
    const candidate = Math.max(0, base - quantityRules.step);
    const newQty = candidate > 0 && candidate < quantityRules.min ? 0 : candidate;
    setQuantityAndSchedule(newQty, { flush: true });
    if (newQty === 0) return;
    incrementTimerRef.current = setInterval(() => {
      const current = Number(quantityRef.current) || 0;
      const candidateNext = Math.max(0, current - quantityRules.step);
      const nextQty =
        candidateNext > 0 && candidateNext < quantityRules.min ? 0 : candidateNext;
      setQuantityAndSchedule(nextQty);
      if (nextQty === 0) {
        stopIncrementTimer();
      }
    }, 200);
  };

  const stopAutoChange = () => {
    stopIncrementTimer();
    flushCommit();
  };

  useEffect(() => {
    if (cartQty <= 0) {
      stopIncrementTimer();
    }
    return () => {
      if (commitTimerRef.current) {
        clearTimeout(commitTimerRef.current);
        commitTimerRef.current = null;
      }
      stopIncrementTimer();
    };
  }, [cartQty, stopIncrementTimer]);

  const handleAddToCart = async (e?: React.MouseEvent | React.PointerEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (disableIncrease) return;
    const base = Number(quantity) || 0;
    const newQuantity = base <= 0 ? quantityRules.min : base + quantityRules.step;
    setQuantityAndSchedule(newQuantity, { flush: true });
  };

  const handleDecrease = async (e?: React.MouseEvent | React.PointerEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (quantity === 0) return;
    const candidate = Math.max(0, quantity - quantityRules.step);
    const newQuantity =
      candidate > 0 && candidate < quantityRules.min ? 0 : candidate;
    setQuantityAndSchedule(newQuantity, { flush: true });
    if (newQuantity === 0) {
      stopIncrementTimer();
    }
  };

  return (
    <div className={isCard ? "space-y-2" : "space-y-2.5"}>
      {!isCard && (quantityRules.isPack || quantityRules.min > 1) && (
        <div className="rounded-xl border border-[rgb(var(--brand-600)/0.18)] bg-[rgb(var(--brand-50))] px-3 py-2 space-y-1.5">
          {quantityRules.isPack ? (
            <>
              <div className="flex items-start gap-2">
                <Package className="w-4 h-4 mt-0.5 text-[rgb(var(--brand-700))]" />
                <div className="text-xs font-semibold text-[rgb(var(--brand-800))] leading-snug">
                  Venta por pack cerrado de {quantityRules.step} unidades
                </div>
              </div>
              <div className="flex items-start gap-2">
                <ShoppingCart className="w-4 h-4 mt-0.5 text-[rgb(var(--brand-700))]" />
                <div className="text-[11px] font-semibold text-[rgb(var(--brand-700))] leading-snug">
                  Compra mínima: {Math.max(1, Math.round(quantityRules.min / quantityRules.step))}{" "}
                  {Math.max(1, Math.round(quantityRules.min / quantityRules.step)) === 1 ? "pack" : "packs"} (
                  {quantityRules.min} unidades)
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-start gap-2">
              <ShoppingCart className="w-4 h-4 mt-0.5 text-[rgb(var(--brand-700))]" />
              <div className="text-xs font-semibold text-[rgb(var(--brand-800))] leading-snug">
                Compra mínima: {quantityRules.min} unidades
              </div>
            </div>
          )}
        </div>
      )}
      {quantity === 0 ? (
        <button
          onClick={handleAddToCart}
          type="button"
          disabled={isUpdating || disableIncrease}
          className={
            isCard
              ? "w-full rounded-md text-black transition-colors mt-2 py-1.5 text-xs font-medium bg-[rgb(var(--brand-600))] text-white hover:bg-[rgb(var(--brand-700))] disabled:opacity-60"
              : "w-full px-6 h-11 rounded-full bg-[rgb(var(--brand-700))] text-white text-sm font-semibold uppercase tracking-[0.08em] hover:bg-[rgb(var(--brand-800))] transition-colors disabled:opacity-60"
          }
        >
          {isCard ? "AGREGAR" : "Agregar al carrito"}
        </button>
      ) : (
        <div
          className={
            isCard
              ? "flex items-center h-9 rounded-md border border-[rgb(var(--brand-600)/0.18)] bg-[rgb(var(--brand-50))] overflow-hidden select-none mt-2"
              : "flex items-center h-11 rounded-xl border border-[rgb(var(--brand-600)/0.18)] bg-[rgb(var(--brand-50))] overflow-hidden select-none"
          }
        >
          <button
            onPointerDown={startDecrement}
            onPointerUp={stopAutoChange}
            onPointerLeave={stopAutoChange}
            onPointerCancel={stopAutoChange}
            type="button"
            disabled={isUpdating}
            className={
              isCard
                ? "w-9 h-full inline-flex items-center justify-center bg-[rgb(var(--brand-700))] text-white hover:bg-[rgb(var(--brand-800))] disabled:opacity-50 transition-colors"
                : "w-11 h-full inline-flex items-center justify-center bg-[rgb(var(--brand-700))] text-white hover:bg-[rgb(var(--brand-800))] disabled:opacity-50 transition-colors"
            }
          >
            <Minus className="w-4 h-4" />
          </button>
          <div
            className={
              isCard
                ? "flex-1 h-full text-gray-900 inline-flex items-center justify-center text-xs font-semibold"
                : "flex-1 h-full text-gray-900 inline-flex items-center justify-center text-sm font-semibold"
            }
          >
            {quantity}
          </div>
          <button
            onPointerDown={startIncrement}
            onPointerUp={stopAutoChange}
            onPointerLeave={stopAutoChange}
            onPointerCancel={stopAutoChange}
            type="button"
            disabled={isUpdating || disableIncrease}
            className={
              isCard
                ? "w-9 h-full inline-flex items-center justify-center bg-[rgb(var(--brand-700))] text-white hover:bg-[rgb(var(--brand-800))] disabled:opacity-50 transition-colors"
                : "w-11 h-full inline-flex items-center justify-center bg-[rgb(var(--brand-700))] text-white hover:bg-[rgb(var(--brand-800))] disabled:opacity-50 transition-colors"
            }
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}

      {!isCard && quantity > 0 && (
        <div className="w-full space-y-2">
          <div className="h-7 rounded-lg px-2.5 text-xs flex items-center justify-center gap-1.5 bg-[rgb(var(--brand-600)/0.08)] text-[rgb(var(--brand-700))] border border-[rgb(var(--brand-600)/0.18)]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Agregado al carrito · {quantity} {quantity === 1 ? "unidad" : "unidades"}</span>
          </div>
          <Link
            href="/cart"
            aria-label="Ir a comprar"
            className="w-full px-4 sm:px-6 min-h-[44px] py-2 rounded-full bg-[rgb(var(--brand-700))] text-white text-[11px] sm:text-xs font-semibold uppercase tracking-wide inline-flex items-center justify-center hover:bg-[rgb(var(--brand-800))] transition-colors text-center whitespace-normal break-words leading-tight"
          >
            Ir a comprar
          </Link>
        </div>
      )}
    </div>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { Product } from "@/types/product";
import ProductPrices from "./ProductPrices";
import CatalogProductPrices from "./CatalogProductPrices";
import cardStyles from "./product-card.module.css";
import { motion } from "framer-motion";
import { Home, Package, ShoppingCart, Sun } from "lucide-react";
import { ProductImage } from "@/components/ui/ProductImage";
import { PLACEHOLDER_IMAGE } from "@/lib/constants";
import { useCart } from "@/lib/hooks/useCart";
import { useRouter } from "next/navigation";
import { getQuantityRules } from "@/utils/productUtils";
import AddToCartBtn from "@/components/product-page/Header/AddToCartBtn";

function formatearTituloProducto(nombre: string): string {
  if (!nombre || typeof nombre !== "string") return "";
  const palabrasMinusculas = new Set([
    "de",
    "del",
    "la",
    "el",
    "los",
    "las",
    "y",
    "e",
    "o",
    "u",
    "para",
    "con",
    "sin",
    "en",
    "por",
    "al",
  ]);

  return nombre
    .toLowerCase()
    .split(/\s+/)
    .map((palabra, indice) => {
      if (palabra === "x") return "X";
      if (/^[0-9]/.test(palabra)) return palabra; // números o fracciones (1/2, 3.10)
      if (palabrasMinusculas.has(palabra) && indice !== 0) return palabra;
      if (!palabra) return palabra;
      return palabra.charAt(0).toUpperCase() + palabra.slice(1);
    })
    .join(" ");
}

type ProductCardProps = {
  data: Product;
  variant?: "shop" | "carousel" | "popup";
  showNewBadge?: boolean;
  showDiscountBadge?: boolean;
  className?: string;
  onNavigate?: () => void;
};

const ProductCard = ({
  data,
  variant = "carousel",
  showNewBadge = false,
  showDiscountBadge = false,
  className,
  onNavigate,
}: ProductCardProps) => {
  const router = useRouter();
  const { cart } = useCart();

  // Diseño unificado y responsivo para todas las cards

  const isPopup = variant === "popup";
  const isNew = showNewBadge && data.newArrival;

  const productSlug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const productUrl = `/shop/product/${data.id}/${productSlug}`;
  const cantidadEnCarrito =
    cart?.items?.find((item: any) => item.id === data.id || item.productId === data.id)?.quantity || 0;
  const usoLabel = typeof (data as any)?.uso === "string" ? (data as any).uso.trim() : "";
  const UsoIcon = /exterior/i.test(usoLabel) ? Sun : Home;

  const quantityRules = getQuantityRules({
    pack: (data as any)?.pack,
    minimoCompra: (data as any)?.minimoCompra,
  });
  const stepQty = quantityRules.step;

  const irAlCarrito = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    router.push("/cart");
  };

  return (
    <motion.div
      data-product-card
      data-card-variant={variant}
      className={`group bg-[rgb(var(--surface))] rounded-xl overflow-hidden flex flex-col ${
        variant === "shop" ? "p-3" : "p-2"
      } border border-[rgb(var(--brand-600)/0.16)] shadow-sm hover:shadow-lg hover:border-[rgb(var(--brand-600)/0.24)] ${isPopup ? `h-auto ${cardStyles.popup}` : "h-full"} ${className ?? ""}`}
      initial={isPopup ? false : { opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className={`flex flex-col ${isPopup ? "" : "h-full"}`}>
        {/* Imagen y título */}
        <Link href={productUrl} className="block" onClick={onNavigate}>
          <div
            data-card-image
            className={`relative w-full ${variant === "carousel" ? "aspect-[4/5]" : "aspect-square"} rounded-lg overflow-hidden bg-gray-50`}
          >
            <ProductImage
              src={data.srcUrl || PLACEHOLDER_IMAGE}
              alt={data.name}
              className="absolute inset-0 w-full h-full object-cover flex items-center justify-center"
              width={variant === "shop" ? 400 : 180}
              height={variant === "shop" ? 400 : 220}
              variant={isPopup ? "shop" : variant}
            />
            {/* Badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {isNew && (
                <div
                  className={`bg-[rgb(var(--brand-700))] text-white uppercase tracking-wide font-semibold px-2 py-1 rounded ${
                    variant === "shop"
                      ? "text-[10px]"
                      : "text-[11px] sm:text-xs"
                  }`}
                >
                  NUEVO
                </div>
              )}
            </div>
            {/* Favorite icon top-right */}
            {!isPopup && cantidadEnCarrito > 0 && (
              <button
                type="button"
                onClick={irAlCarrito}
                className="absolute top-2.5 right-2.5 h-8 min-w-[74px] px-3 rounded-full bg-[rgb(var(--brand-700))] text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 shadow-md tabular-nums"
                aria-label="Ir al carrito"
              >
                <ShoppingCart className="h-4 w-4 text-white" />
                x{cantidadEnCarrito}
              </button>
            )}

          </div>
          
          {/* Título y marca */}
          <div className="mt-2">
            <h3
              data-card-title
              className={`uppercase font-semibold text-gray-900 leading-snug line-clamp-2 ${
                variant === "shop" ? "text-sm mt-1" : "text-sm sm:text-base mt-1"
              }`}
            >
              {formatearTituloProducto(data.name)}
            </h3>
            {!isPopup && usoLabel && (
              <div className="mt-1 flex justify-start">
                <div
                  className={`inline-flex items-center gap-1.5 font-semibold text-[rgb(var(--brand-700))] uppercase tracking-wide ${
                    variant === "shop" ? "text-[11px]" : "text-[11px] sm:text-xs"
                  }`}
                >
                  <UsoIcon className="h-3.5 w-3.5" />
                  <span>USO: {usoLabel}</span>
                </div>
              </div>
            )}
          </div>
        </Link>

        <div className={isPopup ? "" : "mt-2"}>
          {!isPopup && cantidadEnCarrito > 0 && (
            <button
              type="button"
              onClick={irAlCarrito}
              className="inline-flex w-full items-center justify-center gap-2 h-9 px-3 rounded-md bg-[rgb(var(--brand-700))] text-white text-xs sm:text-sm font-semibold uppercase tracking-wide"
            >
              <ShoppingCart className="h-4 w-4 text-white" />
              COMPRAR
            </button>
          )}
          {isPopup
            ? <ProductPrices data={data} showCash={false} />
            : <CatalogProductPrices data={data} variant={variant} />}
          {/* {(quantityRules.isPack || quantityRules.min > 1) && (
            <div className="mt-2 rounded-lg border border-[rgb(var(--brand-600)/0.18)] bg-[rgb(var(--brand-50))] px-2.5 py-2 space-y-1">
              {quantityRules.isPack ? (
                <>
                  <div className="flex items-start gap-2">
                    <Package className={`mt-0.5 text-[rgb(var(--brand-700))] ${variant === "shop" ? "w-3.5 h-3.5" : "w-4 h-4"}`} />
                    <div className={`font-semibold text-[rgb(var(--brand-800))] leading-snug ${variant === "shop" ? "text-[11px]" : "text-[11px] sm:text-xs"}`}>
                      Pack cerrado: {quantityRules.step}u
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <ShoppingCart className={`mt-0.5 text-[rgb(var(--brand-700))] ${variant === "shop" ? "w-3.5 h-3.5" : "w-4 h-4"}`} />
                    <div className={`font-semibold text-[rgb(var(--brand-700))] leading-snug ${variant === "shop" ? "text-[11px]" : "text-[11px] sm:text-xs"}`}>
                      Mínimo: {Math.max(1, Math.round(quantityRules.min / quantityRules.step))}{" "}
                      {Math.max(1, Math.round(quantityRules.min / quantityRules.step)) === 1 ? "pack" : "packs"} ({quantityRules.min}u)
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-start gap-2">
                  <ShoppingCart className={`mt-0.5 text-[rgb(var(--brand-700))] ${variant === "shop" ? "w-3.5 h-3.5" : "w-4 h-4"}`} />
                  <div className={`font-semibold text-[rgb(var(--brand-800))] leading-snug ${variant === "shop" ? "text-[11px]" : "text-[11px] sm:text-xs"}`}>
                    Compra mínima: {quantityRules.min}u
                  </div>
                </div>
              )}
            </div>
          )} */}
          {(data as any).secondaryPriceText && (
            <div className="text-[11px] text-gray-500">
              {(data as any).secondaryPriceText}
            </div>
          )}
        </div>

        {!isPopup && <div className="mt-auto">
          <AddToCartBtn
            variant="card"
            data={{
              id: data.id,
              name: data.name,
              price: Number(data.price) || 0,
              srcUrl: data.srcUrl,
              pack: (data as any)?.pack ?? null,
              minimoCompra: (data as any)?.minimoCompra ?? null,
              discount: (data as any)?.discount ?? { percentage: 0, amount: 0 },
              images: (data as any)?.images ?? [],
              weightKg: (data as any)?.weightKg ?? (data as any)?.external?.kg ?? null,
              external: (data as any)?.external ?? null,
              promos: (data as any)?.promos ?? undefined,
            }}
          />
        </div>}
      </div>
    </motion.div>
  );
};

export default ProductCard;

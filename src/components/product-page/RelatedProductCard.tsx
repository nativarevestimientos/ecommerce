"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Product } from "@/types/product";
import { formatPrice } from "@/lib/utils";
import { useAppSelector } from "@/lib/hooks/redux";

type RelatedProductCardProps = {
  product: Product;
  compact?: boolean;
  className?: string;
};

export default function RelatedProductCard({ product, compact = false, className = "" }: RelatedProductCardProps) {
  const quantityInCart = useAppSelector((s) => {
    const items = s.carts.cart?.items ?? [];
    const match = items.find((cartItem: any) => cartItem.id === product.id || cartItem.productId === product.id);
    return Number(match?.quantity) || 0;
  });

  return (
    <div className={`rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden ${className}`}>
      <div className="relative aspect-[4/3]">
        <Image
          src={product.srcUrl || product.images?.[0] || "/placeholder.png"}
          alt={product.name}
          width={600}
          height={480}
          className="w-full h-full object-cover"
        />
        {quantityInCart > 0 && (
          <div className="absolute top-2.5 right-2.5 h-8 min-w-[74px] px-3 rounded-full bg-[rgb(var(--brand-700))] text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 shadow-md tabular-nums">
            <CheckCircle2 className="w-4 h-4" />
            x{quantityInCart}
          </div>
        )}
      </div>
      <div className={compact ? "p-2 space-y-1" : "p-2.5 space-y-1.5"}>
        <div className={compact ? "text-[11px] leading-tight min-h-[28px] font-medium" : "text-xs leading-tight min-h-[30px] font-medium"}>{product.name}</div>
        <div className={compact ? "text-sm font-bold" : "text-xl font-bold"}>{formatPrice(product.price)}</div>
        {quantityInCart > 0 && (
          <div className="h-7 rounded-md bg-[rgb(var(--brand-600)/0.10)] text-[rgb(var(--brand-600))] text-[11px] font-semibold uppercase tracking-wide inline-flex items-center justify-center w-full tabular-nums">
            En carrito: {quantityInCart}
          </div>
        )}
        <Link
          href={`/shop/product/${product.id}`}
          className={compact
            ? "inline-flex items-center justify-center h-7 px-3 rounded-md bg-[rgb(var(--brand-600))] text-white text-[11px] font-medium hover:bg-[rgb(var(--brand-700))]"
            : "inline-flex items-center justify-center h-7 px-3 rounded-md bg-[rgb(var(--brand-600))] text-white text-xs font-medium hover:bg-[rgb(var(--brand-700))]"}
        >
          Ver detalle
        </Link>
      </div>
    </div>
  );
}

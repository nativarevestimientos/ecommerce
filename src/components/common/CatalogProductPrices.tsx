import { Product } from "@/types/product";
import { resolveProductPricing } from "@/lib/product-pricing";
import { formatPrice, parseDiscountPct } from "@/lib/utils";

// Original catalog presentation, independent from the popup's compact layout.
export default function CatalogProductPrices({ data, variant }: { data: Product; variant: "shop" | "carousel" }) {
  const pricing = resolveProductPricing(data);
  const hasDiscount = pricing.discount.amount > 0;
  const discountPercent = Math.round(pricing.discount.percentage);
  const transferPct = parseDiscountPct(process.env.NEXT_PUBLIC_TRANSFERENCIA_DESCUENTO_PCT, 0.10);
  const transferDiscount = Math.round(pricing.finalPrice * transferPct * 100) / 100;
  const transferPrice = Math.round((pricing.finalPrice - transferDiscount) * 100) / 100;

  return <div data-catalog-prices>
    {hasDiscount && <div className="text-xs text-gray-500 line-through">{formatPrice(pricing.price)}</div>}
    <div className="grid grid-cols-[1fr_auto] items-baseline gap-2">
      <div className="flex items-baseline gap-2">
        <span data-product-price className={`font-bold text-gray-900 ${variant === "shop" ? "text-2xl" : "text-xl"}`}>
          {formatPrice(pricing.finalPrice)}
        </span>
        <span className="text-xs font-semibold text-gray-500">c/u</span>
        {hasDiscount ? <div>
          <span className="bg-red-100 text-red-700 border border-red-200 font-semibold px-2 py-0.5 rounded-full text-[10px]">
            {discountPercent > 0 ? `-${discountPercent}%` : ""}
          </span>
        </div> : <div />}
      </div>
    </div>
    {!hasDiscount && <div className="text-xs text-gray-500">Precio regular</div>}
    <div className="mt-2 flex flex-wrap gap-1.5">
      <span data-transfer-price={transferPrice} className={`inline-flex items-center rounded-full border border-[rgb(var(--brand-600)/0.25)] bg-[rgb(var(--brand-50))] px-2 py-1 font-semibold text-[rgb(var(--brand-800))] uppercase tracking-wide ${variant === "shop" ? "text-[11px]" : "text-xs"}`}>
        {transferPct > 0 ? `-${Math.round(transferPct * 100)}% ` : ""}TRANSFERENCIA · {formatPrice(transferPrice)}
      </span>
    </div>
  </div>;
}

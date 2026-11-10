import { Product } from "@/types/product";
import { CASH_DEPOSIT_DISCOUNT_PCT, resolveProductPricing } from "@/lib/product-pricing";
import { formatPrice, parseDiscountPct } from "@/lib/utils";
import styles from "./product-card.module.css";

export default function ProductPrices({ data, showCash = true }: { data: Product; showCash?: boolean }) {
  const pricing = resolveProductPricing(data);
  const transferPct = parseDiscountPct(process.env.NEXT_PUBLIC_TRANSFERENCIA_DESCUENTO_PCT, 0.10);
  const transferDiscount = Math.round(pricing.finalPrice * transferPct * 100) / 100;
  const transferPrice = Math.round((pricing.finalPrice - transferDiscount) * 100) / 100;
  const unit = data.unidad || data.unidadMedida || data.unit || "c/u";
  const unitLabel = /^m2$/i.test(unit) ? "m²" : unit;
  const discountPct = Math.round(pricing.discount.percentage * 100) / 100;
  const cashDiscount = Math.round(pricing.finalPrice * CASH_DEPOSIT_DISCOUNT_PCT * 100) / 100;
  const cashPrice = Math.round((pricing.finalPrice - cashDiscount) * 100) / 100;

  return <div className={styles.prices} data-product-prices>
    {pricing.discount.amount > 0 && <div className={styles.original}>
      <del>{formatPrice(pricing.price)}</del>
      <span className={styles.productDiscount}>−{discountPct}% producto</span>
    </div>}
    <div className={styles.mainPrice}><strong data-product-price>{formatPrice(pricing.finalPrice)}</strong><span>/{unitLabel}</span></div>
    {pricing.discount.amount === 0 && <span className={styles.regular}>Precio regular</span>}
    {transferPct > 0 && <div className={styles.transfer} data-transfer-price={transferPrice}>
      <span>−{Math.round(transferPct * 10000) / 100}% {pricing.discount.amount > 0 ? "adicional por transferencia" : "por transferencia"}</span>
      <b>{formatPrice(transferPrice)} <small>/{unitLabel}</small></b>
    </div>}
    {showCash && data.cyberMonday && <div className={styles.cash} data-cash-price={cashPrice}>
      <span>{transferPct > 0 ? "O " : ""}−{CASH_DEPOSIT_DISCOUNT_PCT * 100}% {pricing.discount.amount > 0 ? "adicional " : ""}en efectivo en depósito</span>
      <b>{formatPrice(cashPrice)} <small>/{unitLabel}</small></b>
    </div>}
  </div>;
}

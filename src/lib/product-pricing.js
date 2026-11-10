// Keep in sync with sistema/lib/product-pricing.js (independent deployments).
// Never fold payment-method benefits into the general product finalPrice.
// Existing in-person offer advertised on the product detail page, not checkout.
export const CASH_DEPOSIT_DISCOUNT_PCT = 0.10;

export function parsePaymentDiscountPct(value, fallback = 0.10) {
  const explicitPercent = /%\s*$/.test(String(value ?? ""));
  const text = String(value ?? "").trim().replace(/%$/, "").replace(",", ".");
  const number = text ? Number(text) : NaN;
  const normalized = Number.isFinite(number)
    ? (explicitPercent || number > 1 ? number / 100 : number)
    : fallback;
  return Math.min(0.9, Math.max(0, normalized));
}
function numberOrNull(value) {
  if (value == null || value === "" || typeof value === "boolean") return null;
  const text = String(value).trim();
  if (!text) return null;
  const normalized = text.includes(",")
    ? text.replace(/\./g, "").replace(",", ".")
    : text;
  const number = Number(normalized);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function firstNumber(...values) {
  for (const value of values) {
    const number = numberOrNull(value);
    if (number !== null) return number;
  }
  return null;
}

const cents = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

/** Resolve both raw /precios payloads and storefront Product objects. */
export function resolveProductPricing(item) {
  const p = item?.producto ?? item ?? {};
  const pr = item?.pricing ?? {};
  const suppliedFinal = firstNumber(pr.precioUnitarioFinal, p.finalPrice, p.precioVenta, p.valorVenta);
  const price = cents(firstNumber(pr.precioUnitarioBase, p.price, p.precioLista,
    p.precioBase, p.precioVenta, p.valorVenta, suppliedFinal) ?? 0);
  const percentage = Math.min(100, firstNumber(p.discount?.percentage,
    pr.discount?.percentage, p.descuentoPorcentaje, p.porcentajeDescuento,
    pr.descuentoPorcentaje, pr.porcentajeDescuento) ?? 0);
  const amount = firstNumber(p.discount?.amount, pr.discount?.amount,
    p.descuentoMonto, p.descuentoImporte, pr.descuentoMonto, pr.descuentoImporte) ?? 0;

  // A lower final is already discounted. Equal base/final is a legacy API
  // placeholder: resolve the separate percentage OR amount, never both.
  const finalPrice = cents(suppliedFinal !== null && suppliedFinal < price
    ? suppliedFinal
    : Math.max(0, percentage > 0 ? price * (1 - percentage / 100) : price - amount));
  const saved = cents(Math.max(0, price - finalPrice));
  return {
    price,
    finalPrice,
    discount: { amount: saved, percentage: price > 0 ? saved / price * 100 : 0 },
  };
}

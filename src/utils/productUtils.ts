export type QuantityRules = {
  step: number;
  min: number;
  isPack: boolean;
  pack: number | null;
  minimoCompra: number | null;
  label: string;
};

const toPositiveIntOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.trim())
        : Number(value as any);
  if (!Number.isFinite(n)) return null;
  const i = Math.trunc(n);
  if (i <= 0) return null;
  return i;
};

export const getQuantityRules = (input?: {
  pack?: unknown;
  minimoCompra?: unknown;
} | null): QuantityRules => {
  const pack = toPositiveIntOrNull(input?.pack);
  const minimoCompra = toPositiveIntOrNull(input?.minimoCompra);

  const step = pack && pack >= 2 ? pack : 1;
  const minBase = minimoCompra && minimoCompra >= 1 ? minimoCompra : 1;
  const min = step > 1 ? Math.ceil(minBase / step) * step : minBase;

  let label = "";
  if (step > 1) {
    const minPacks = Math.max(1, Math.round(min / step));
    const packWord = minPacks === 1 ? "pack" : "packs";
    label = `Venta por pack cerrado de ${step} unidades\nCompra mínima: ${minPacks} ${packWord} (${min} unidades)`;
  } else if (min > 1) {
    label = `Compra mínima: ${min} unidades`;
  }

  return {
    step,
    min,
    isPack: step > 1,
    pack,
    minimoCompra,
    label,
  };
};

export const normalizeQuantity = (
  quantity: number,
  rules: QuantityRules,
  direction: "up" | "down" = "up"
): number => {
  const q = Number(quantity) || 0;
  if (q <= 0) return 0;

  const step = rules.step > 1 ? rules.step : 1;
  const min = rules.min > 1 ? rules.min : 1;

  const rounded =
    direction === "down"
      ? Math.floor(q / step) * step
      : Math.ceil(q / step) * step;

  if (rounded <= 0) return 0;
  if (rounded < min) return min;
  return rounded;
};

export const applyQuantityDelta = (
  currentQty: number,
  delta: number,
  rules: QuantityRules
): number => {
  const current = normalizeQuantity(currentQty, rules, "up");
  const d = Number(delta) || 0;
  if (!Number.isFinite(d) || d === 0) return current;

  const candidate = current + d;
  if (candidate <= 0) return 0;

  if (d > 0) return normalizeQuantity(candidate, rules, "up");

  const next = normalizeQuantity(candidate, rules, "down");
  return next < rules.min ? 0 : next;
};

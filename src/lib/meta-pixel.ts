"use client";

type FbqParams = Record<string, unknown>;

type PixelProduct = {
  id?: string | number | null;
  productId?: string | number | null;
  name?: string | null;
  price?: number | null;
  quantity?: number | null;
};

declare global {
  interface Window {
    fbq?: (command: string, eventName: string, params?: FbqParams) => void;
  }
}

const DEFAULT_CURRENCY = process.env.NEXT_PUBLIC_META_PIXEL_CURRENCY || "ARS";

const toNumber = (value: unknown, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const toPixelId = (value: unknown) => String(value ?? "").trim();

const toPixelItem = (item: PixelProduct) => {
  const id = toPixelId(item.productId || item.id);
  return {
    id,
    quantity: Math.max(1, Math.floor(toNumber(item.quantity, 1))),
    item_price: Math.max(0, toNumber(item.price, 0)),
  };
};

export const trackMetaEvent = (eventName: string, params?: FbqParams) => {
  if (typeof window === "undefined") return;
  if (typeof window.fbq !== "function") return;
  try {
    window.fbq("track", eventName, params);
  } catch {
    // noop: no rompemos UX por fallas de tracking
  }
};

export const trackMetaViewContent = (product: PixelProduct) => {
  const pixelItem = toPixelItem(product);
  if (!pixelItem.id) return;
  trackMetaEvent("ViewContent", {
    content_type: "product",
    content_ids: [pixelItem.id],
    content_name: String(product.name || ""),
    contents: [pixelItem],
    currency: DEFAULT_CURRENCY,
    value: pixelItem.item_price,
  });
};

export const trackMetaAddToCart = (product: PixelProduct, quantityDelta = 1) => {
  const qty = Math.max(1, Math.floor(toNumber(quantityDelta, 1)));
  const pixelItem = toPixelItem({ ...product, quantity: qty });
  if (!pixelItem.id) return;
  trackMetaEvent("AddToCart", {
    content_type: "product",
    content_ids: [pixelItem.id],
    content_name: String(product.name || ""),
    contents: [pixelItem],
    currency: DEFAULT_CURRENCY,
    value: Math.round(pixelItem.item_price * qty * 100) / 100,
  });
};

export const trackMetaInitiateCheckout = (items: PixelProduct[], total?: number) => {
  const contents = items
    .map((item) => toPixelItem(item))
    .filter((item) => item.id);
  if (!contents.length) return;

  const derivedTotal = Math.round(
    contents.reduce((acc, item) => acc + item.item_price * item.quantity, 0) * 100
  ) / 100;
  const finalTotal = Math.max(0, toNumber(total, derivedTotal));

  trackMetaEvent("InitiateCheckout", {
    content_type: "product",
    content_ids: contents.map((item) => item.id),
    contents,
    num_items: contents.reduce((acc, item) => acc + item.quantity, 0),
    currency: DEFAULT_CURRENCY,
    value: finalTotal,
  });
};

export const trackMetaPurchase = (items: PixelProduct[], total?: number, orderId?: string | null) => {
  const contents = items
    .map((item) => toPixelItem(item))
    .filter((item) => item.id);
  if (!contents.length) return;

  const derivedTotal = Math.round(
    contents.reduce((acc, item) => acc + item.item_price * item.quantity, 0) * 100
  ) / 100;
  const finalTotal = Math.max(0, toNumber(total, derivedTotal));

  trackMetaEvent("Purchase", {
    content_type: "product",
    content_ids: contents.map((item) => item.id),
    contents,
    num_items: contents.reduce((acc, item) => acc + item.quantity, 0),
    currency: DEFAULT_CURRENCY,
    value: finalTotal,
    order_id: orderId ? String(orderId) : undefined,
  });
};


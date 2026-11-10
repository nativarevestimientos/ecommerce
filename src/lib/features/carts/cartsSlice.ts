// src/redux/slices/cartSlice.ts
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { Product } from "@/types/product";
import { applyQuantityDelta, getQuantityRules, normalizeQuantity } from "@/utils/productUtils";

export type RemoveCartItem = {
  id: string;
};

export type CartItem = {
  id: string;
  name: string;
  srcUrl: string;
  price: number;
  discount: Product['discount'];
  quantity: number;
  slug?: string;
  productId?: string;
  pack?: number | null;
  minimoCompra?: number | null;
  activePromo?: {
    cantidad: number;
    descuento: number;
    precioFinal: number;
  };
};

export type Cart = {
  items: CartItem[];
  totalQuantities: number;
};

const getAdjustedItemPrice = (item: CartItem): number => {
  let adjustedPrice = item.price;
  
  if (item.discount.percentage > 0) {
    adjustedPrice = item.price * (1 - item.discount.percentage / 100);
  } else if (item.discount.amount > 0) {
    adjustedPrice = item.price - item.discount.amount;
  }
  
  return Math.round(adjustedPrice);
};

const getAdjustedItemTotal = (item: CartItem, quantity?: number): number => {
  const qty = quantity ?? item.quantity;
  const unit = getAdjustedItemPrice(item);
  const promo = item.activePromo;
  if (promo && promo.cantidad > 0) {
    const promoQty = Math.min(qty, promo.cantidad);
    const extraQty = Math.max(0, qty - promoQty);
    const promoTotal = promoQty > 0 ? Number(promo.precioFinal) || 0 : 0;
    return Math.round(promoTotal + extraQty * unit);
  }
  return Math.round(unit * qty);
};

interface CartsState {
  cart: Cart | null;
  totalPrice: number;
  adjustedTotalPrice: number;
  paymentMethod: "mercadopago" | "transferencia" | "nave_galicia";
  action: "update" | "add" | "delete" | null;
}

const initialState: CartsState = {
  cart: null,
  totalPrice: 0,
  adjustedTotalPrice: 0,
  paymentMethod: "mercadopago",
  action: null,
};

const recalculateTotals = (state: CartsState) => {
  const items = state.cart?.items ?? [];
  let totalPrice = 0;
  let adjustedTotalPrice = 0;

  for (const item of items) {
    const qty = Number(item.quantity) || 0;
    const unit = Number(item.price) || 0;
    totalPrice += unit * qty;
    adjustedTotalPrice += getAdjustedItemTotal(item);
  }

  state.totalPrice = Math.round(totalPrice);
  state.adjustedTotalPrice = Math.round(adjustedTotalPrice);
};

const getItemRules = (item: Pick<CartItem, "pack" | "minimoCompra">) =>
  getQuantityRules({ pack: item.pack, minimoCompra: item.minimoCompra });

export const cartsSlice = createSlice({
  name: "carts",
  initialState,
  reducers: {
    setPaymentMethod: (
      state,
      action: PayloadAction<"mercadopago" | "transferencia" | "nave_galicia">
    ) => {
      state.paymentMethod = action.payload;
    },
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const item = action.payload;
      const incomingQty = Number(item.quantity) || 0;
      if (!Number.isFinite(incomingQty) || incomingQty <= 0) return;
      const rules = getItemRules(item);

      if (state.cart === null) {
        const nextQty = normalizeQuantity(incomingQty, rules, "up");
        state.cart = {
          items: [{ ...item, quantity: nextQty }],
          totalQuantities: nextQty,
        };
        recalculateTotals(state);
        return;
      }

      const existingItem = state.cart.items.find(i => i.id === item.id);

      if (existingItem) {
        const merged = state.cart.items.map((i) => {
          if (i.id !== item.id) return i;
          const base = { ...i, pack: i.pack ?? item.pack, minimoCompra: i.minimoCompra ?? item.minimoCompra };
          const nextQty = normalizeQuantity((Number(base.quantity) || 0) + incomingQty, getItemRules(base), "up");
          return { ...base, quantity: nextQty };
        });
        state.cart.items = merged;
      } else {
        const nextQty = normalizeQuantity(incomingQty, rules, "up");
        state.cart.items.push({ ...item, quantity: nextQty });
      }
      state.cart.totalQuantities = state.cart.items.reduce(
        (acc, it) => acc + (Number(it.quantity) || 0),
        0
      );
      recalculateTotals(state);
    },

    removeCartItem: (state, action: PayloadAction<RemoveCartItem>) => {
      if (!state.cart) return;

      const item = state.cart.items.find(i => i.id === action.payload.id);
      if (!item) return;

      const rules = getItemRules(item);
      const nextQty = applyQuantityDelta(item.quantity, -rules.step, rules);
      const updatedItems = state.cart.items
        .map((i) => (i.id === item.id ? { ...i, quantity: nextQty } : i))
        .filter((i) => (Number(i.quantity) || 0) > 0);

      state.cart.items = updatedItems;
      state.cart.totalQuantities = updatedItems.reduce(
        (acc, it) => acc + (Number(it.quantity) || 0),
        0
      );
      recalculateTotals(state);
    },

    remove: (state, action: PayloadAction<RemoveCartItem & { quantity: number }>) => {
      if (!state.cart) return;

      const item = state.cart.items.find(i => i.id === action.payload.id);
      if (!item) return;

      state.cart.items = state.cart.items.filter(i => i.id !== item.id);
      state.cart.totalQuantities -= item.quantity;
      recalculateTotals(state);
    },

    updateCartItemQuantity: (
      state,
      action: PayloadAction<{ id: string; delta: number }>
    ) => {
      if (!state.cart) return;

      const { id, delta } = action.payload;
      if (!Number.isFinite(delta) || delta === 0) return;

      const existing = state.cart.items.find((i) => i.id === id);
      if (!existing) return;

      const rules = getItemRules(existing);
      const nextQty = applyQuantityDelta(existing.quantity, delta, rules);
      if (nextQty <= 0) {
        state.cart.items = state.cart.items.filter((i) => i.id !== id);
      } else {
        state.cart.items = state.cart.items.map((i) =>
          i.id === id ? { ...i, quantity: nextQty } : i
        );
      }

      state.cart.totalQuantities = state.cart.items.reduce(
        (acc, it) => acc + (Number(it.quantity) || 0),
        0
      );
      recalculateTotals(state);
    },

    setCart: (state, action: PayloadAction<Cart>) => {
      const incoming = action.payload;
      const normalizedItems = (incoming?.items ?? [])
        .map((it) => {
          const rules = getItemRules(it);
          const nextQty = normalizeQuantity(it.quantity, rules, "up");
          return { ...it, quantity: nextQty };
        })
        .filter((it) => (Number(it.quantity) || 0) > 0);

      state.cart = {
        items: normalizedItems,
        totalQuantities: normalizedItems.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0),
      };
      recalculateTotals(state);
      state.action = "update";
    },
  },
});

export const {
  setPaymentMethod,
  addToCart,
  removeCartItem,
  remove,
  updateCartItemQuantity,
  setCart,
} = cartsSlice.actions;
export default cartsSlice.reducer;

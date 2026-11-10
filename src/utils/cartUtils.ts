// src/utils/cartUtils.ts

import { CartItem } from "@/lib/features/carts/cartsSlice";

let memoryCart: CartItem[] = [];

export const getLocalCart = (): CartItem[] => {
  try {
    if (!Array.isArray(memoryCart)) return [];
    return memoryCart.filter((item: any) => {
      return item &&
        typeof item === "object" &&
        typeof item.id === "string" &&
        typeof item.quantity === "number" &&
        item.quantity > 0 &&
        typeof item.price === "number" &&
        typeof item.name === "string";
    });
  } catch (error) {
    console.error("Error reading cart:", error);
    memoryCart = [];
    return [];
  }
};

export const saveLocalCart = (items: CartItem[]) => {
  memoryCart = Array.isArray(items) ? items : [];
};

export const clearLocalCart = () => {
  memoryCart = [];
};

export const getLocalCartCount = (): number => {
  try {
    const cart = getLocalCart();
    return cart.reduce((acc, item) => acc + (item.quantity || 0), 0);
  } catch (error) {
    console.error("Error calculating cart count:", error);
    return 0;
  }
};

export const validateAndCleanCart = (): CartItem[] => {
  try {
    const cart = getLocalCart();
    // Si hay algún problema, limpiar completamente
    if (!Array.isArray(cart) || cart.some(item => !item || typeof item !== 'object')) {
      console.warn("Cart validation failed, clearing completely");
      clearLocalCart();
      return [];
    }
    return cart;
  } catch (error) {
    console.error("Cart validation error:", error);
    clearLocalCart();
    return [];
  }
};

export const mergeCarts = (localItems: CartItem[], remoteItems: CartItem[]): CartItem[] => {
  const merged: { [id: string]: CartItem } = {};

  [...remoteItems, ...localItems].forEach((item) => {
    if (merged[item.id]) {
      merged[item.id].quantity += item.quantity;
      merged[item.id].price = merged[item.id].quantity * item.price;
    } else {
      merged[item.id] = { ...item };
    }
  });

  return Object.values(merged);
};

import { useMemo } from "react";
import { useAppSelector } from "@/lib/hooks/redux";

interface CartItem {
  id?: string;
  name: string;
  price: number;
  quantity: number;
  totalPrice: number;
  image: string;
  slug?: string;
  productId?: string;
  pack?: number | null;
  minimoCompra?: number | null;
  /** Peso unitario en kg (opcional) */
  weightKg?: number | null;
  discount: {
    percentage: number;
    amount: number;
  };
  srcUrl?: string;
  activePromo?: {
    cantidad: number;
    descuento: number;
    precioFinal: number;
  };
}

interface CartData {
  items: CartItem[];
  adjustedTotalPrice?: number;
}

export function useCart() {
  const cartState = useAppSelector((s) => s.carts.cart);
  const adjustedTotalPrice = useAppSelector((s) => s.carts.adjustedTotalPrice);

  const cart = useMemo<CartData>(
    () => ({
      items: (cartState?.items as any) ?? [],
      adjustedTotalPrice,
    }),
    [adjustedTotalPrice, cartState?.items]
  );

  const totalQuantity =
    cartState?.items?.reduce((acc, item: any) => acc + (Number(item.quantity) || 0), 0) ?? 0;

  return {
    cart,
    loading: false,
    totalQuantity,
    carritoRemotoId: null,
    refrescarCarrito: async () => {},
  };
}

 

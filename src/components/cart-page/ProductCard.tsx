"use client";

import React, { useMemo } from "react";
import { PiTrashFill } from "react-icons/pi";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CartItem } from "@/lib/features/carts/cartsSlice";
import { motion, AnimatePresence } from "framer-motion";
import { useAppDispatch } from "@/lib/hooks/redux";
import { remove } from "@/lib/features/carts/cartsSlice";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "../../components/ui/badge";
import AddToCartBtn from "@/components/product-page/Header/AddToCartBtn";

type ProductCardProps = {
  data: CartItem & { 
    totalPrice?: number;
    activePromo?: {
      cantidad: number;
      descuento: number;
      precioFinal: number;
    };
  };
  isUnavailable?: boolean;
};

const ProductCard = ({ data, isUnavailable }: ProductCardProps) => {
  const dispatch = useAppDispatch();

  const formatCurrency = (value: number) => {
    const safe = Number(value);
    if (!Number.isFinite(safe)) return "0";
    return safe.toLocaleString("es-AR", {
      useGrouping: true,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const priceDetails = useMemo(() => {
    const qty = Number(data.quantity) || 0;
    const unit = Number(data.price) || 0;
    const originalTotal = unit * qty;

    const promo = data.activePromo;
    let effectiveTotal = originalTotal;

    if (promo && promo.cantidad > 0) {
      const promoQty = Math.min(qty, promo.cantidad);
      const extraQty = Math.max(0, qty - promoQty);
      effectiveTotal =
        (promoQty > 0 ? Number(promo.precioFinal) || 0 : 0) + extraQty * unit;
    } else if (data.discount) {
      const percentage = Number(data.discount?.percentage ?? 0);
      const amount = Number(data.discount?.amount ?? 0);
      const discountedUnit =
        percentage > 0
          ? unit * (1 - percentage / 100)
          : amount > 0
            ? unit - amount
            : unit;
      effectiveTotal = (Math.round(discountedUnit * 100) / 100) * qty;
    }

    const totalPrice = Math.round(effectiveTotal * 100) / 100;
    const savings = Math.max(0, Math.round((originalTotal - totalPrice) * 100) / 100);
    
    return {
      totalPrice,
      savings,
      promoQuantity: data.activePromo?.cantidad || 0,
      extraQuantity: Math.max(0, data.quantity - (data.activePromo?.cantidad || 0)),
      promoPrice: data.activePromo?.precioFinal || 0,
      normalPrice: data.price,
      originalTotal,
    };
  }, [data]);

  return (
    <motion.div 
      className={`flex items-start space-x-3 md:space-x-4 ${isUnavailable ? "rounded-xl border border-yellow-200 bg-yellow-50 p-3" : ""}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Link
        href={`/shop/product/${data.id}/${data.name.split(" ").join("-")}`}
        className="bg-[#F0EEED] rounded-lg w-full min-w-[80px] max-w-[80px] sm:min-w-[90px] sm:max-w-[90px] md:min-w-[100px] md:max-w-[100px] lg:min-w-[110px] lg:max-w-[110px] aspect-square overflow-hidden"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={data.srcUrl}
          width={110}
          height={110}
          className="rounded-md w-full h-full object-cover hover:scale-110 transition-all duration-500"
          alt={data.name}
        />
      </Link>
      <div className="flex w-full self-stretch flex-col">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-2">
            <Link
              href={`/shop/product/${data.id}/${data.name.split(" ").join("-")}`}
              className="text-black font-bold text-sm sm:text-base md:text-lg xl:text-xl line-clamp-2 hover:text-gray-700 transition-colors"
            >
              {data.name}
            </Link>
            {isUnavailable && (
              <Badge className="bg-yellow-100 text-yellow-900 border border-yellow-200">
                No disponible
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 md:h-7 md:w-7 hover:bg-red-50 transition-colors"
            onClick={() => dispatch(remove({ id: data.id, quantity: data.quantity }))}
          >
            <PiTrashFill className="text-lg md:text-xl text-red-600" />
          </Button>
        </div>

        <div className="flex flex-col space-y-2 mt-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center space-x-[5px] xl:space-x-2.5 cursor-help">
                  <span className="font-bold text-black text-base sm:text-lg md:text-xl xl:text-2xl">
                    ${formatCurrency(Math.round(priceDetails.totalPrice))}
                  </span>
                  {data.activePromo && (
                    <div className="text-sm text-green-600 font-medium">
                      {data.activePromo.cantidad}x -{data.activePromo.descuento}%
                    </div>
                  )}
                  {data.discount?.percentage > 0 && !data.activePromo && (
                    <span className="font-medium text-[8px] sm:text-[9px] md:text-[10px] xl:text-xs py-1 px-2 md:py-1.5 md:px-3.5 rounded-full bg-[#FF3333]/10 text-[#FF3333]">
                      -{data.discount.percentage}%
                    </span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-white p-3 shadow-lg rounded-lg border">
                <div className="space-y-1 text-sm">
                  {data.activePromo && (
                    <>
                      <p className="font-medium">Desglose del precio:</p>
                      <p>{priceDetails.promoQuantity}x unidades con promoción: ${formatCurrency(priceDetails.promoPrice)}</p>
                      {priceDetails.extraQuantity > 0 && (
                        <p>{priceDetails.extraQuantity}x unidades al precio normal: ${formatCurrency(priceDetails.extraQuantity * priceDetails.normalPrice)}</p>
                      )}
                      <p className="text-gray-500 line-through">Precio original: ${formatCurrency(priceDetails.originalTotal)}</p>
                    </>
                  )}
                  {(data.discount?.percentage > 0 || data.discount?.amount > 0) && !data.activePromo && (
                    <>
                      <p className="font-medium">Desglose del precio:</p>
                      <p className="text-gray-500 line-through">Precio original: ${formatCurrency(priceDetails.originalTotal)}</p>
                      {data.discount?.percentage > 0 && <p>Descuento: -{data.discount.percentage}%</p>}
                      {data.discount?.amount > 0 && <p>Descuento: -${formatCurrency(data.discount.amount)}</p>}
                    </>
                  )}
                  <p className="font-medium text-green-600">Total: ${formatCurrency(Math.round(priceDetails.totalPrice))}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <AnimatePresence>
            {(data.activePromo || data.discount?.percentage > 0) && priceDetails.savings > 0 && (
              <motion.div 
                className="text-sm text-green-600"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                Ahorras ${formatCurrency(priceDetails.savings)}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="min-w-[90px] max-w-[90px] sm:min-w-[100px] sm:max-w-[100px] md:min-w-[105px] md:max-w-[105px]">
            <AddToCartBtn
              variant="card"
              disableIncrease={Boolean(isUnavailable)}
              data={{
                id: data.id,
                name: data.name,
                price: Number(data.price) || 0,
                srcUrl: data.srcUrl,
                pack: (data as any)?.pack ?? null,
                minimoCompra: (data as any)?.minimoCompra ?? null,
                discount: (data as any)?.discount ?? { percentage: 0, amount: 0 },
                images: Array.isArray((data as any)?.images)
                  ? ((data as any).images as string[]).filter(Boolean)
                  : [data.srcUrl].filter(Boolean),
                weightKg: (data as any)?.weightKg ?? (data as any)?.external?.kg ?? null,
                external: (data as any)?.external ?? null,
                promos: (data as any)?.promos ?? undefined,
              }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;

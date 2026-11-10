"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { FaMinus, FaPlus } from "react-icons/fa6";
import { cn } from "@/lib/utils";

type CartCounterProps = {
  isZeroDelete?: boolean;
  onAdd?: (value: number) => void;
  onRemove?: (value: number) => void;
  className?: string;
  initialValue?: number;
};

const CartCounter = ({
  isZeroDelete,
  onAdd,
  onRemove,
  className,
  initialValue = 1,
}: CartCounterProps) => {
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const addToCart = () => {
    onAdd?.(initialValue + 1);
  };

  const remove = () => {
    if ((!isZeroDelete && initialValue <= 1) || initialValue <= 0) return;
    onRemove?.(initialValue - 1);
  };

  const startIncrement = (e: React.PointerEvent) => {
    e.preventDefault();
    addToCart();
    timerRef.current = setInterval(() => {
      addToCart();
    }, 200);
  };

  const startDecrement = (e: React.PointerEvent) => {
    e.preventDefault();
    remove();
    timerRef.current = setInterval(() => {
      remove();
    }, 200);
  };

  const stopAutoChange = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <div
      className={cn(
        "bg-[#F0F0F0] w-full min-w-[110px] max-w-[110px] sm:max-w-[170px] py-3 md:py-3.5 px-4 sm:px-5 rounded-full flex items-center justify-between select-none",
        className
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        type="button"
        className="h-5 w-5 sm:h-6 sm:w-6 text-xl hover:bg-transparent"
        onPointerDown={startDecrement}
        onPointerUp={stopAutoChange}
        onPointerLeave={stopAutoChange}
        onPointerCancel={stopAutoChange}
      >
        <FaMinus />
      </Button>
      <span className="font-medium text-sm sm:text-base tabular-nums">
        {initialValue}
      </span>
      <Button
        variant="ghost"
        size="icon"
        type="button"
        className="h-5 w-5 sm:h-6 sm:w-6 text-xl hover:bg-transparent"
        onPointerDown={startIncrement}
        onPointerUp={stopAutoChange}
        onPointerLeave={stopAutoChange}
        onPointerCancel={stopAutoChange}
      >
        <FaPlus />
      </Button>
    </div>
  );
};

export default CartCounter;

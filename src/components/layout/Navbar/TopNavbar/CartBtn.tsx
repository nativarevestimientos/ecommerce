// src/components/navbar/CartBtn.tsx

import Link from "next/link";
import React from "react";
// import Image from "next/image";

interface CartBtnProps {
  totalItems: number;
}

const CartBtn = ({ totalItems }: CartBtnProps) => {
  return (
    <Link href="/cart" className="relative p-2 hover:scale-105 transition-transform">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icons/cart.svg"
        height={24}
        width={24}
        alt="Cart"
        className="max-w-[24px] max-h-[24px] h-auto"
      />
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
          {totalItems}
        </span>
      )}
    </Link>
  );
};

export default CartBtn;

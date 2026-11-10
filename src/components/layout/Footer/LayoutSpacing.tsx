"use client";

import { usePathname } from "next/navigation";
import React from "react";

export const LayoutSpacing = () => {
  const pathname = usePathname();

  if (!pathname || !pathname.includes("product")) return;

  return <div className="mb-20 md:mb-0" />;
};

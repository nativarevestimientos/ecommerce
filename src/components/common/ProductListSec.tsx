"use client";

import React, { useEffect, useState } from "react";
import * as motion from "framer-motion/client";
import { cn } from "@/lib/utils";
import { satoshi } from "@/styles/fonts";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import ProductCard from "./ProductCard";
import { Product } from "@/types/product";
import Link from "next/link";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";
import Image from "next/image";

type ProductListSecProps = {
  title: string;
  data: Product[];
  viewAllLink?: string;
  showDiscountBadge?: boolean;
  showNewBadge?: boolean;
  layout?: "carousel" | "grid";
  ctaLabel?: string;
  preserveOrder?: boolean;
  autoScroll?: "none" | "desktop" | "always";
  loop?: boolean;
};

const ProductListSec = ({
  title,
  data,
  viewAllLink,
  showDiscountBadge,
  showNewBadge,
  layout = "carousel",
  ctaLabel,
  preserveOrder = false,
  autoScroll = "desktop",
  loop,
}: ProductListSecProps) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  // Función para obtener el timestamp de una fecha (soporta Date, ISO string y formato español)
  const getTimestamp = (valorFecha: any): number => {
    if (!valorFecha) return 0;

    // Date nativo
    if (valorFecha instanceof Date) {
      const ms = valorFecha.getTime();
      return Number.isNaN(ms) ? 0 : ms;
    }

    // Timestamp de Firebase
    if (typeof valorFecha === 'object' && typeof valorFecha.seconds === 'number') {
      return valorFecha.seconds * 1000; // Convertir a milisegundos
    }

    // String ISO u otros formatos parseables por Date
    if (typeof valorFecha === 'string') {
      const parsedIso = Date.parse(valorFecha);
      if (!Number.isNaN(parsedIso)) {
        return parsedIso;
      }

      // Formato español: "día de mes de año, hh:mm:ss a.m./p.m."
      try {
        const meses: { [key: string]: number } = {
          'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
          'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
        };

        const [parteFecha, parteTiempo] = valorFecha.split(', ');
        const [dia, mes, anio] = (parteFecha || '').split(' de ');
        const [horaTexto, periodoRaw] = (parteTiempo || '').split(' ');
        const [horas, minutos, segundos] = (horaTexto || '').split(':');

        let hora = parseInt(horas || '0');
        const periodo = (periodoRaw || '').toLowerCase().replace(/\./g, '').trim(); // 'pm' | 'am'
        if (periodo === 'pm' && hora !== 12) {
          hora += 12;
        } else if (periodo === 'am' && hora === 12) {
          hora = 0;
        }

        const indiceMes = meses[(mes || '').toLowerCase()];
        if (typeof indiceMes !== 'number') return 0;

        return new Date(
          parseInt(anio || '0'),
          indiceMes,
          parseInt(dia || '1'),
          hora,
          parseInt(minutos || '0'),
          parseInt(segundos || '0')
        ).getTime();
      } catch {
        return 0;
      }
    }

    return 0;
  };

  
  const activeProducts = preserveOrder
    ? data.filter((product) => product.active === true)
    : data
        .filter((product) => product.active === true)
        .sort((a, b) => {
          const timestampA = getTimestamp(a.createdAt);
          const timestampB = getTimestamp(b.createdAt);
          return timestampB - timestampA;
        });
    
  // Determinar si el carrusel debe hacer loop (solo si hay más de 5 productos)
  const shouldLoop = typeof loop === "boolean" ? loop : activeProducts.length > 5;

  useEffect(() => {
    if (!api) return;

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  useEffect(() => {
    if (!api) return;

    const shouldAutoScroll =
      autoScroll === "always"
        ? true
        : autoScroll === "desktop"
          ? window.innerWidth >= 768
          : false;

    if (!shouldAutoScroll) return;
    if (activeProducts.length <= 1) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [api, activeProducts.length, autoScroll]);

  return (
    <section className="max-w-frame mx-auto">
      <motion.h2
        initial={{ y: "100px", opacity: 0 }}
        whileInView={{ y: "0", opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className={cn([
          satoshi.className,
          "text-2xl font-bold text-left mb-8 md:mb-12 px-4 md:px-0",
        ])}
      >
        {title}
      </motion.h2>
      <motion.div
        initial={{ y: "100px", opacity: 0 }}
        whileInView={{ y: "0", opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.6, duration: 0.6 }}
      >
        {layout === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4 xl:px-0">
            {data.slice(0, 4).map((product) => (
              <div key={product.id} className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
                <Link href={`/shop/product/${product.id}`} className="block">
                  <div className="aspect-square bg-white">
                    <Image
                      src={product.srcUrl || product.images?.[0] || "/placeholder.png"}
                      alt={product.name}
                      width={600}
                      height={600}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    <div className="text-base font-semibold text-gray-900">${product.price.toLocaleString()}</div>
                    <div className="pt-2">
                      <span className="inline-block bg-[rgb(var(--brand-600))] text-white text-sm rounded-full px-4 py-2">
                        {ctaLabel || "Ver detalle"}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
        <div className="relative overflow-hidden px-4 md:px-0">
          <Carousel
            setApi={setApi}
            opts={{
              align: "start",
              loop: shouldLoop,
              skipSnaps: false,
              containScroll: "trimSnaps",
            }}
            className="w-full mb-6 md:mb-9"
          >
            {shouldLoop && (
              <>
                <CarouselPrevious
                  variant="ghost"
                  className="pointer-events-auto hidden md:flex absolute left-2 lg:left-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full border border-black/10 bg-white/90 text-lg shadow-sm hover:bg-white"
                >
                  <FaArrowLeft />
                </CarouselPrevious>
                <CarouselNext
                  variant="ghost"
                  className="pointer-events-auto hidden md:flex absolute right-2 lg:right-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full border border-black/10 bg-white/90 text-lg shadow-sm hover:bg-white"
                >
                  <FaArrowRight />
                </CarouselNext>
              </>
            )}
            <CarouselContent className="-ml-3 sm:-ml-4">
            {activeProducts.map((product) => (
              <CarouselItem
                key={product.id}
                className="pl-3 sm:pl-4 basis-[82%] sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5"
              >
                <ProductCard 
                  data={product} 
                  variant="shop"
                  showNewBadge={showNewBadge}
                  showDiscountBadge={showDiscountBadge}
                />
              </CarouselItem>
            ))}
            </CarouselContent>
          </Carousel>
        </div>
        )}
        {viewAllLink && (
          <div className="w-full px-4 sm:px-0 text-center">
            <Link
              href={viewAllLink}
              className="btn bg-[rgb(var(--brand-600))] text-white inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 shadow-sm hover:bg-[rgb(var(--brand-700))] hover:shadow-md"
            >
              <span>Ver todos</span>
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M17 8l4 4m0 0l-4 4m4-4H3" 
                />
              </svg>
            </Link>
          </div>
        )}
      </motion.div>
    </section>
  );
};

export default ProductListSec;

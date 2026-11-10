"use client";

import React from "react";
import Image from "next/image";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import ProductCard from "@/components/common/ProductCard";
import { Product } from "@/types/product";

type Props = {
  title?: string;
  subtitle?: string;
  featuredImage: string;
  products: Product[];
  linkHref?: string;
  mobileFeaturedImage?: string;
};

const CategoryCarousel = ({ title = "Colección", subtitle = "", featuredImage, products, linkHref = "/shop", mobileFeaturedImage }: Props) => {
  const mobileSrc =
    mobileFeaturedImage ||
    (featuredImage.startsWith("/images/")
      ? featuredImage.replace("/images/", "/images/mobile/")
      : featuredImage);
  return (
    <section className="w-full pb-6 md:max-w-frame md:mx-auto md:px-4 xl:px-0">
      
      {/* =======================
          MOBILE LAYOUT (< md)
          ======================= */}
      <div className="md:hidden w-full relative">
        {/* Imagen de fondo full-width con altura fija */}
        <div className="relative w-full h-[450px]">
          <Image 
            src={mobileSrc} 
            alt={title} 
            fill 
            className=""
            priority
          />
          {/* Carrusel flotante superpuesto en la parte inferior */}
          <div className="absolute bottom-0 left-0 right-0 translate-y-1/4 z-10 px-4">
             <Carousel 
               opts={{
                 align: "center",
                 containScroll: "trimSnaps",
                 loop: false,
               }}
               className="w-full"
             >
              <CarouselContent className="-ml-3">
                {products.map((p) => (
                  <CarouselItem
                    key={p.id}
                    // Ancho de tarjeta fijo para mobile similar a la captura
                    className="pl-3 basis-[78%] xs:basis-[64%]" 
                  >
                    <div className="surface-card rounded-xl overflow-hidden h-full">
                      <ProductCard data={p} variant="shop" className="border-0 shadow-none h-full" />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        </div>
        
        {/* Espaciador para compensar el carrusel que sobresale (translate-y-1/3) */}
        <div className="h-44 w-full bg-transparent" />
        
        {/* Botón VER MÁS abajo a la derecha */}
        <div className="flex justify-center pr-0 mt-2 mb-8">
           <a 
             href={linkHref} 
             className="btn-brand text-sm font-medium px-4 py-1.5 rounded-md shadow-sm transition-colors"
           >
             VER MÁS
           </a>
        </div>
      </div>


      {/* =======================
          DESKTOP LAYOUT (>= md)
          ======================= */}
      <div className="hidden md:grid grid-cols-2 gap-6 items-center">
        {/* Left: imagen de categoría */}
        <div className="rounded-2xl overflow-hidden relative h-96 group">
          <Image src={featuredImage} alt={title} fill className="object-fill object-top transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute bottom-6 right-6">
            <a href={linkHref} className="btn-brand text-sm font-medium px-4 py-1.5 rounded-md shadow-sm transition-colors">VER MÁS</a>
          </div>
        </div>

        {/* Right: Carrusel de productos */}
        <div>
          <Carousel className="relative z-10 pt-12">
            <div className="absolute top-0 right-0 z-10 flex items-center gap-2">
              <CarouselPrevious className="relative translate-y-0 translate-x-0 left-0 bg-[rgb(var(--surface))] border-[rgb(var(--brand-600)/0.16)] hover:bg-[rgb(var(--brand-600)/0.06)]" />
              <CarouselNext className="relative translate-y-0 translate-x-0 right-0 bg-[rgb(var(--surface))] border-[rgb(var(--brand-600)/0.16)] hover:bg-[rgb(var(--brand-600)/0.06)]" />
            </div>
            <CarouselContent className="-ml-4">
              {products.map((p) => (
                <CarouselItem
                  key={p.id}
                  className="pl-4 md:basis-1/2 lg:basis-1/2 xl:basis-1/3"
                >
                  <div className="h-full">
                    <ProductCard data={p} variant="shop" className="h-full" />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div>
    </section>
  );
};

export default CategoryCarousel;

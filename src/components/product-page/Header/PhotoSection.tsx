"use client";

import { Product } from '@/types/product';
import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { PLACEHOLDER_IMAGE } from '@/lib/constants'
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

function normalizeImageUrl(input: unknown): string {
  if (typeof input !== "string") return "";
  return input.trim().replace(/^`+|`+$/g, "").trim();
}

const PhotoSection = ({ data }: { data: Product }) => {
  const thumbnails = useMemo(
    () =>
      Array.from(
        new Set([data.srcUrl, ...(data.images || [])].map(normalizeImageUrl).filter(Boolean))
      ),
    [data.srcUrl, data.images]
  );
  const thumbnailsKey = useMemo(() => thumbnails.join("|"), [thumbnails]);

  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);
  const [paused, setPaused] = useState<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (thumbnails.length <= 1) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (paused || isLightboxOpen) return;
    intervalRef.current = setInterval(() => {
      setSelectedIndex((idx) => (idx + 1) % thumbnails.length);
    }, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [thumbnails.length, paused, isLightboxOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [thumbnailsKey]);

  const selected = thumbnails[selectedIndex] || normalizeImageUrl(data.srcUrl);
  const lightboxSelected = thumbnails[lightboxIndex] || selected;

  const goPrev = () => {
    if (thumbnails.length <= 1) return;
    setLightboxIndex((idx) => (idx - 1 + thumbnails.length) % thumbnails.length);
  };

  const goNext = () => {
    if (thumbnails.length <= 1) return;
    setLightboxIndex((idx) => (idx + 1) % thumbnails.length);
  };

  return (
    <div
      className="flex flex-col-reverse lg:flex-row gap-2.5 sm:gap-3 lg:gap-4"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Galería de miniaturas */}
      <div className="flex flex-nowrap lg:flex-col gap-2.5 sm:gap-3 w-full lg:w-[96px] items-center lg:items-start justify-start overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
        {thumbnails.map((photo, index) => (
            <button
              key={index}
              type="button"
              className={`relative rounded-[12px] w-20 h-20 sm:w-24 sm:h-24 lg:w-[96px] lg:h-[96px] shrink-0 overflow-hidden border-2 ${selectedIndex === index ? "border-blue-500" : "border-[rgb(var(--brand-600)/0.18)]"}`}
              onClick={() => setSelectedIndex(index)}
            >
            <Image
                src={photo || PLACEHOLDER_IMAGE}
                width={96}
                height={96}
                sizes="96px"
                quality={85}
                className="w-full h-full object-cover hover:scale-110 transition-all duration-500"
                alt={data.name}
              />
            </button>
          ))}
        </div>

      {/* Imagen principal */}
      <DialogPrimitive.Root
        open={isLightboxOpen}
        onOpenChange={(open) => {
          if (open) setLightboxIndex(selectedIndex);
          if (!open) setSelectedIndex(lightboxIndex);
          setIsLightboxOpen(open);
        }}
      >
        <DialogPrimitive.Trigger asChild>
          <button
            type="button"
            className="group flex items-center justify-center rounded-3xl w-full mx-auto max-w-[520px] sm:max-w-[620px] lg:max-w-[640px] xl:max-w-[720px] 2xl:max-w-[820px] aspect-square overflow-hidden mb-2 sm:mb-3 lg:mb-0 relative cursor-zoom-in shadow-sm ring-1 ring-[rgb(var(--brand-600)/0.14)]"
          >
            <Image
              src={selected || PLACEHOLDER_IMAGE}
              fill
              sizes="(min-width: 1536px) 820px, (min-width: 1280px) 720px, (min-width: 1024px) 640px, (min-width: 640px) 620px, 100vw"
              quality={95}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              alt={data.name}
              priority
            />
          </button>
        </DialogPrimitive.Trigger>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/90 backdrop-blur-[2px]" />
          <DialogPrimitive.Content
            className="fixed inset-0 z-50 p-0 outline-none"
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") {
                e.preventDefault();
                goPrev();
              }
              if (e.key === "ArrowRight") {
                e.preventDefault();
                goNext();
              }
            }}
          >
            <DialogPrimitive.Close asChild>
              <button
                type="button"
                aria-label="Cerrar visor"
                className="absolute inset-0 z-0 cursor-zoom-out"
              />
            </DialogPrimitive.Close>

            <div className="absolute inset-0 z-10 flex flex-col pointer-events-none">
              <div className="flex items-center justify-end px-4 sm:px-6 pt-4 sm:pt-6 pointer-events-none">
                <DialogPrimitive.Close asChild>
                  <button
                    type="button"
                    aria-label="Cerrar"
                    className="pointer-events-auto inline-flex items-center gap-2 h-11 px-4 rounded-full bg-black/55 text-white ring-1 ring-white/15 hover:bg-black/75 transition backdrop-blur-md"
                  >
                    <X className="w-5 h-5" />
                    <span className="text-sm font-semibold hidden sm:inline">Cerrar</span>
                  </button>
                </DialogPrimitive.Close>
              </div>

              <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-6 pointer-events-none">
                <button
                  type="button"
                  aria-label="Imagen ampliada"
                  className="pointer-events-auto cursor-default"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Image
                    src={lightboxSelected || PLACEHOLDER_IMAGE}
                    width={2400}
                    height={2400}
                    sizes="100vw"
                    quality={100}
                    className="w-auto h-auto max-w-[92vw] max-h-[76vh] object-contain select-none"
                    alt={data.name}
                  />
                </button>
              </div>

              {thumbnails.length > 1 && (
                <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-3 sm:px-6 pointer-events-none">
                  <button
                    type="button"
                    aria-label="Imagen anterior"
                    onClick={goPrev}
                    className="pointer-events-auto inline-flex items-center justify-center w-11 h-11 rounded-full bg-black/45 text-white ring-1 ring-white/15 hover:bg-black/70 transition backdrop-blur-md"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    type="button"
                    aria-label="Imagen siguiente"
                    onClick={goNext}
                    className="pointer-events-auto inline-flex items-center justify-center w-11 h-11 rounded-full bg-black/45 text-white ring-1 ring-white/15 hover:bg-black/70 transition backdrop-blur-md"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              )}

              {thumbnails.length > 1 && (
                <div className="shrink-0 w-full pointer-events-none">
                  <div className="px-3 sm:px-6 pb-5 pt-3 bg-black/35 backdrop-blur-md border-t border-white/10 pointer-events-none">
                    <div className="flex gap-2 sm:gap-3 overflow-x-auto pointer-events-auto">
                      {thumbnails.map((photo, idx) => (
                        <button
                          key={photo + idx}
                          type="button"
                          onClick={() => setLightboxIndex(idx)}
                          className={cn(
                            "relative shrink-0 w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-xl overflow-hidden ring-2 transition",
                            idx === lightboxIndex ? "ring-white" : "ring-white/15 hover:ring-white/40"
                          )}
                        >
                          <Image
                            src={photo || PLACEHOLDER_IMAGE}
                            fill
                            sizes="72px"
                            quality={90}
                            className="object-cover"
                            alt={data.name}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
};

export default PhotoSection;

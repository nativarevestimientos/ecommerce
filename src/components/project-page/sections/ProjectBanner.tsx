"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ProjectBanner as ProjectBannerType, ProjectBannerSlide } from '@/types/project';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Phone, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ProjectBannerProps {
  banner: ProjectBannerType;
}

const ProjectBanner = ({ banner }: ProjectBannerProps) => {
  const [indice, setIndice] = useState(0);
  const contenedorRef = useRef<HTMLDivElement | null>(null);
  const pausaAutoPlayRef = useRef(false);
  const prefiereReducido = useMemo(
    () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  const slides = banner.slides;
  const currentSlide = slides[indice];

  const irA = useCallback(
    (nuevo: number) => {
      const total = slides.length;
      if (total === 0) return;
      const normalizado = ((nuevo % total) + total) % total;
      setIndice(normalizado);
    },
    [slides.length]
  );

  // Autoplay con pausa al hover/teclado/visibilidad
  useEffect(() => {
    if (prefiereReducido || slides.length <= 1) return;
    const interval = banner.autoplayInterval || 5000;
    const id = setInterval(() => {
      if (!pausaAutoPlayRef.current) irA(indice + 1);
    }, interval);
    return () => clearInterval(id);
  }, [indice, irA, prefiereReducido, slides.length, banner.autoplayInterval]);

  useEffect(() => {
    const onVisibility = () => {
      pausaAutoPlayRef.current = document.hidden;
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const onMouseEnter = () => (pausaAutoPlayRef.current = true);
  const onMouseLeave = () => (pausaAutoPlayRef.current = false);

  // Navegación por teclado
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!contenedorRef.current) return;
      if (e.key === "ArrowRight") irA(indice + 1);
      if (e.key === "ArrowLeft") irA(indice - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [indice, irA]);

  // Swipe con framer-motion
  const dragThreshold = 80;

  const contentVariants = {
    initial: { opacity: 0, y: 50, scale: 0.95 },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    },
    exit: { 
      opacity: 0, 
      y: -50, 
      scale: 1.05,
      transition: { duration: 0.5 }
    }
  };

  const itemVariants = {
    initial: { opacity: 0, y: 30 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    },
    exit: { 
      opacity: 0, 
      y: -30,
      transition: { duration: 0.4 }
    }
  };

  if (!slides || slides.length === 0) {
    return null;
  }

  return (
    <section 
      ref={contenedorRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      aria-roledescription="carousel" 
      aria-label="Banner de proyecto" 
      className="relative h-screen overflow-hidden bg-black"
    >
      {/* Background Images Carousel */}
      <motion.div
        className="flex h-full"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -dragThreshold) irA(indice + 1);
          if (info.offset.x > dragThreshold) irA(indice - 1);
        }}
        animate={{ x: `-${(indice * 100) / slides.length}%` }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
        style={{ width: `${slides.length * 100}%` }}
      >
        {slides.map((slide, i) => (
          <div 
            key={slide.id} 
            className="relative w-full h-full shrink-0" 
            style={{ width: `${100 / slides.length}%` }}
          >
            <div className="w-full h-full relative">
              <div 
                className="w-full h-full bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${slide.backgroundImage})` }}
              />
              <div 
                className="absolute inset-0 bg-black"
                style={{ opacity: slide.overlayOpacity || 0.5 }}
              />
            </div>
          </div>
        ))}
      </motion.div>

      {/* Content Overlay */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 text-center text-white">
          <AnimatePresence mode="wait">
            <motion.div
              key={indice}
              variants={contentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <motion.h1 
                variants={itemVariants}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight"
              >
                {currentSlide.title}
              </motion.h1>
              
              <motion.h2 
                variants={itemVariants}
                className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-light mb-6 sm:mb-8 text-gray-200"
              >
                {currentSlide.subtitle}
              </motion.h2>
              
              <motion.p 
                variants={itemVariants}
                className="text-sm sm:text-base md:text-lg lg:text-xl mb-8 sm:mb-12 max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto leading-relaxed text-gray-300"
              >
                {currentSlide.description}
              </motion.p>

              <motion.div 
                variants={itemVariants}
                className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center"
              >
                <Link href={currentSlide.ctaUrl}>
                  <Button 
                    size="lg" 
                    className="text-sm sm:text-base md:text-lg px-6 sm:px-8 py-3 sm:py-4 h-auto font-semibold group transition-all duration-300 w-full sm:w-auto"
                  >
                    {currentSlide.ctaText}
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                
                {currentSlide.secondaryCtaText && currentSlide.secondaryCtaUrl ? (
                  <Link href={currentSlide.secondaryCtaUrl}>
                    <Button 
                      size="lg"
                      className="text-sm sm:text-base md:text-lg px-6 sm:px-8 py-3 sm:py-4 h-auto font-semibold group transition-all duration-300 w-full sm:w-auto"
                    >
                      {currentSlide.secondaryCtaText}
                    </Button>
                  </Link>
                ) : (
                  <Link href="tel:01121781148">
                    <Button 
                      size="lg"
                      className="text-sm sm:text-base md:text-lg px-6 sm:px-8 py-3 sm:py-4 h-auto font-semibold group transition-all duration-300 w-full sm:w-auto"
                    >
                      <Phone className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      Llamar Ahora
                    </Button>
                  </Link>
                )}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Controls */}
      {banner.showControls !== false && slides.length > 1 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-2 sm:px-4 md:px-6 lg:px-8 z-20">
          <button
            type="button"
            onClick={() => irA(indice - 1)}
            aria-label="Banner anterior"
            className="pointer-events-auto inline-flex h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm transition-all duration-300 shadow-lg hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
          </button>
          <button
            type="button"
            onClick={() => irA(indice + 1)}
            aria-label="Banner siguiente"
            className="pointer-events-auto inline-flex h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm transition-all duration-300 shadow-lg hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
          </button>
        </div>
      )}

      {/* Indicators */}
      {banner.showIndicators !== false && slides.length > 1 && (
        <div className="absolute bottom-6 sm:bottom-8 left-1/2 transform -translate-x-1/2 z-20">
          <div className="flex space-x-2 sm:space-x-3">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndice(i)}
                aria-label={`Ir al banner ${i + 1}`}
                className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                  i === indice 
                    ? 'bg-white scale-125' 
                    : 'bg-white/50 hover:bg-white/75'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Scroll Indicator */}
      <motion.div 
        className={cn([
          "absolute left-1/2 transform -translate-x-1/2 z-10",
          slides.length > 1 ? "bottom-20 sm:bottom-24" : "bottom-8 sm:bottom-12"
        ])}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.2 }}
      >
        <motion.div 
          className="w-5 h-8 sm:w-6 sm:h-10 border-2 border-white rounded-full flex justify-center"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.div 
            className="w-1 h-2 sm:h-3 bg-white rounded-full mt-1.5 sm:mt-2"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default ProjectBanner;

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { satoshi } from "@/styles/fonts";
import ProductSkeleton from "./ProductSkeleton";

interface ProductSectionSkeletonProps {
  title: string;
  showViewAllButton?: boolean;
}

// Hook personalizado para detectar el viewport
const useViewport = () => {
  const [viewport, setViewport] = useState<'mobile' | 'sm' | 'md' | 'lg' | 'xl'>('mobile');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updateViewport = () => {
      const width = window.innerWidth;
      if (width < 640) setViewport('mobile');
      else if (width < 768) setViewport('sm');
      else if (width < 1024) setViewport('md');
      else if (width < 1280) setViewport('lg');
      else setViewport('xl');
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  // Retornar un valor por defecto hasta que el componente esté montado
  if (!mounted) return 'mobile';
  return viewport;
};

const ProductSectionSkeleton: React.FC<ProductSectionSkeletonProps> = ({ 
  title, 
  showViewAllButton = true 
}) => {
  const viewport = useViewport();
  
  // Determinar la cantidad de skeletons según el viewport
  const getSkeletonCount = () => {
    switch (viewport) {
      case 'mobile': return 2; // basis-2/3 = 2 productos visibles
      case 'sm': return 2;     // basis-1/2 = 2 productos
      case 'md': return 3;     // basis-1/3 = 3 productos
      case 'lg': return 4;     // basis-1/4 = 4 productos
      case 'xl': return 5;     // basis-1/5 = 5 productos
      default: return 3;
    }
  };

  const skeletonCount = getSkeletonCount();
  
  // Generar skeletons responsivos
  const skeletons = Array.from({ length: skeletonCount }, (_, index) => (
    <div
      key={index}
      className="pl-0 basis-2/3 sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5"
    >
      <ProductSkeleton variant="carousel" />
    </div>
  ));

  return (
    <section className="max-w-frame mx-auto">
      <motion.h2
        initial={{ y: "100px", opacity: 0 }}
        animate={{ y: "0", opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className={cn([
          satoshi.className,
          "text-2xl font-bold text-left mb-8 md:mb-12 ml-8 md:ml-0",
        ])}
      >
        {title}
      </motion.h2>
      
      <motion.div
        initial={{ y: "100px", opacity: 0 }}
        animate={{ y: "0", opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.6, duration: 0.6 }}
      >
        <div className="w-full mb-6 md:mb-9 relative">
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 px-4 xl:px-0">
            {skeletons}
          </div>
        </div>
        
        {showViewAllButton && (
          <div className="w-full px-4 sm:px-0 text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-200 rounded-xl animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-16" />
              <div className="w-4 h-4 bg-gray-300 rounded" />
            </div>
          </div>
        )}
      </motion.div>
    </section>
  );
};

export default ProductSectionSkeleton;

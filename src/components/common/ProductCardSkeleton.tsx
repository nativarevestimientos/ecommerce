import React from "react";
import { motion } from "framer-motion";

interface ProductCardSkeletonProps {
  variant?: "carousel" | "shop" | "cart";
}

const ProductCardSkeleton = ({ variant = "carousel" }: ProductCardSkeletonProps) => {
  const isCompact = variant === "shop";
  
  return (
    <motion.div
      className={`group bg-white rounded-xl shadow-sm flex flex-col ${
        isCompact ? "p-3" : "p-4"
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col h-full">
        {/* Imagen skeleton */}
        <div className={`relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-gray-200 animate-pulse`}>
          <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
        </div>
        
        {/* Rating skeleton */}
        <div className={`flex items-center gap-1 ${
          isCompact ? "mt-2" : "mt-3"
        }`}>
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`bg-gray-200 rounded animate-pulse ${
                  isCompact ? "w-2.5 h-2.5" : "w-3 h-3"
                }`}
              />
            ))}
          </div>
          <div className={`bg-gray-200 rounded animate-pulse ${
            isCompact ? "w-8 h-3" : "w-10 h-4"
          }`} />
        </div>
        
        {/* Título skeleton */}
        <div className={`mt-2 space-y-1`}>
          <div className={`bg-gray-200 rounded animate-pulse ${
            isCompact ? "h-3" : "h-4"
          }`} />
          <div className={`bg-gray-200 rounded animate-pulse ${
            isCompact ? "h-3 w-3/4" : "h-4 w-2/3"
          }`} />
        </div>
        
        {/* Precio skeleton */}
        <div className={`mt-2 space-y-1`}>
          <div className={`bg-gray-200 rounded animate-pulse ${
            isCompact ? "h-3 w-16" : "h-4 w-20"
          }`} />
        </div>
        
        {/* Botón skeleton */}
        <div className={`mt-3 ${
          isCompact ? "mt-2" : "mt-3"
        }`}>
          <div className={`w-full rounded-full bg-gray-200 animate-pulse ${
            isCompact ? "h-8" : "h-10"
          }`} />
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCardSkeleton;

import React from "react";
import { motion } from "framer-motion";

interface ProductSkeletonProps {
  variant?: "carousel" | "shop";
}

const ProductSkeleton: React.FC<ProductSkeletonProps> = ({ variant = "carousel" }) => {
  const isShop = variant === "shop";
  
  return (
    <motion.div
      className={`group bg-white rounded-xl flex flex-col ${
        isShop ? "p-3" : "p-4"
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col h-full">
        {/* Imagen skeleton */}
        <div className={`relative w-full aspect-[3/3] rounded-lg overflow-hidden bg-gray-200`}>
          <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
        
        {/* Contenido skeleton */}
        <div className="flex-1 flex flex-col justify-between mt-3 space-y-2">
          {/* Título skeleton */}
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
          
          {/* Precio skeleton */}
          <div className="h-5 bg-gray-200 rounded w-1/2 animate-pulse" />
          
          {/* Botón skeleton */}
          <div className="h-8 bg-gray-200 rounded-lg animate-pulse mt-2" />
        </div>
      </div>
    </motion.div>
  );
};

export default ProductSkeleton;

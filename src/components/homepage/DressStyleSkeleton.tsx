import React from "react";
import { motion } from "framer-motion";

const DressStyleSkeleton = () => {
  // Generar 6 skeletons para simular categorías
  const categorySkeletons = Array.from({ length: 6 }, (_, index) => (
    <motion.div
      key={index}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className="relative w-full h-48 sm:h-52 md:h-56 bg-gray-200 rounded-xl overflow-hidden shadow-sm"
    >
      {/* Badge skeleton */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10">
        <div className="w-16 h-6 sm:w-20 sm:h-7 bg-gray-300 rounded-full"></div>
      </div>
      
              {/* Título skeleton */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-6 sm:w-24 sm:h-7 md:w-28 md:h-8 bg-gray-300 rounded"></div>
        </div>
      
      {/* Indicador de acción skeleton */}
      <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-300 rounded-full"></div>
      </div>
      
      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
    </motion.div>
  ));

  return (
    <div className="px-4 xl:px-0">
      <section className="max-w-frame mx-auto py-6 md:py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
          {categorySkeletons}
        </div>
      </section>
    </div>
  );
};

export default DressStyleSkeleton;

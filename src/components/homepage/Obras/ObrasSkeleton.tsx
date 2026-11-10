import React from "react";
import { motion } from "framer-motion";

const ObrasSkeleton = () => {
  // Generar 6 skeletons para simular las obras
  const obraSkeletons = Array.from({ length: 6 }, (_, index) => (
    <motion.div
      key={index}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.6 }}
      className="group cursor-pointer"
    >
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
        {/* Imagen skeleton */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-200">
          {/* Categoría skeleton */}
          <div className="absolute top-4 left-4">
            <div className="w-20 h-6 bg-gray-300 rounded-full" />
          </div>
        </div>

        {/* Contenido skeleton */}
        <div className="p-6">
          <div className="w-3/4 h-6 bg-gray-200 rounded mb-2" />
          <div className="space-y-2">
            <div className="w-full h-4 bg-gray-200 rounded" />
            <div className="w-5/6 h-4 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    </motion.div>
  ));

  return (
    <div className="px-4 xl:px-0">
      <section className="max-w-frame mx-auto px-4 md:px-6 py-16 md:py-24">
        {/* Header skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ y: "100px", opacity: 0 }}
            animate={{ y: "0", opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="w-48 h-8 bg-gray-200 rounded mx-auto mb-4"
          />
          <motion.div
            initial={{ y: "100px", opacity: 0 }}
            animate={{ y: "0", opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="w-80 h-5 bg-gray-200 rounded mx-auto"
          />
        </motion.div>

        {/* Galería skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {obraSkeletons}
        </div>

        {/* CTA skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-16"
        >
          <div className="w-48 h-12 bg-gray-200 rounded-xl mx-auto" />
        </motion.div>
      </section>
    </div>
  );
};

export default ObrasSkeleton;

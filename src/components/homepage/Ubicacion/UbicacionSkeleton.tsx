import React from "react";
import { motion } from "framer-motion";

const UbicacionSkeleton = () => {
  // Generar 2 skeletons para simular las ubicaciones
  const ubicacionSkeletons = Array.from({ length: 2 }, (_, index) => (
    <motion.div
      key={index}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.2, duration: 0.8 }}
      className={`flex flex-col lg:flex-row items-center gap-4 lg:gap-6 justify-around ${
        index % 2 === 1 ? 'lg:flex-row-reverse' : ''
      }`}
    >
      {/* Texto skeleton */}
      <motion.div
        initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="w-full lg:w-auto space-y-4"
      >
        <div>
          {/* Título skeleton */}
          <div className="w-48 h-7 bg-gray-200 rounded mb-3" />
          <div className="space-y-2">
            {/* Dirección skeleton */}
            <div className="w-64 h-6 bg-gray-200 rounded" />
            {/* Ciudad y provincia skeleton */}
            <div className="w-40 h-6 bg-gray-200 rounded" />
          </div>
        </div>
        
        {/* Enlace skeleton */}
        <div className="w-24 h-5 bg-gray-200 rounded" />
      </motion.div>

      {/* Mapa skeleton */}
      <motion.div
        initial={{ opacity: 0, x: index % 2 === 0 ? 30 : -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="w-full lg:w-auto relative"
      >
        <div className="relative w-full sm:w-80 md:w-96 lg:w-[500px] xl:w-[600px] h-64 sm:h-72 md:h-80 lg:h-96 rounded-2xl overflow-hidden bg-gray-200">
          {/* Degradado solo en el lado donde se conecta con el texto */}
          {index % 2 === 0 ? (
            // Primera ubicación: degradado en el lado izquierdo (donde se conecta con el texto)
            <div className="absolute top-0 bottom-0 left-0 w-8 sm:w-12 lg:w-16 bg-gradient-to-r from-gray-100 via-gray-100/80 to-transparent" />
          ) : (
            // Segunda ubicación: degradado en el lado derecho (donde se conecta con el texto)
            <div className="absolute top-0 bottom-0 right-0 w-8 sm:w-12 lg:w-16 bg-gradient-to-l from-gray-100 via-gray-100/80 to-transparent" />
          )}
        </div>
      </motion.div>
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
            className="w-64 h-8 bg-gray-200 rounded mx-auto mb-4"
          />
          <motion.div
            initial={{ y: "100px", opacity: 0 }}
            animate={{ y: "0", opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="w-80 h-5 bg-gray-200 rounded mx-auto"
          />
        </motion.div>

        {/* Ubicaciones skeleton */}
        <div className="space-y-20 md:space-y-24">
          {ubicacionSkeletons}
        </div>
      </section>
    </div>
  );
};

export default UbicacionSkeleton;

import React from "react";
import { motion } from "framer-motion";

const QuienesSomosSkeleton = () => {
  return (
    <div className="px-4 xl:px-0">
      <section className="max-w-frame mx-auto px-4 md:px-6 py-16 md:py-24 bg-gradient-to-br from-gray-100 to-white rounded-3xl">
        {/* Header skeleton */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-48 h-8 bg-gray-200 rounded mx-auto mb-4"
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="w-80 h-5 bg-gray-200 rounded mx-auto"
          />
        </div>

        {/* Contenido skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Texto skeleton */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            {/* Historia skeleton */}
            <div>
              <div className="w-32 h-6 bg-gray-200 rounded mb-3" />
              <div className="space-y-2">
                <div className="w-full h-4 bg-gray-200 rounded" />
                <div className="w-5/6 h-4 bg-gray-200 rounded" />
                <div className="w-4/6 h-4 bg-gray-200 rounded" />
              </div>
            </div>

            {/* Compromiso skeleton */}
            <div>
              <div className="w-36 h-5 bg-gray-200 rounded mb-3" />
              <div className="space-y-2">
                <div className="w-full h-4 bg-gray-200 rounded" />
                <div className="w-5/6 h-4 bg-gray-200 rounded" />
                <div className="w-4/6 h-4 bg-gray-200 rounded" />
              </div>
            </div>

            {/* Misión skeleton */}
            <div>
              <div className="w-28 h-5 bg-gray-200 rounded mb-3" />
              <div className="space-y-2">
                <div className="w-full h-4 bg-gray-200 rounded" />
                <div className="w-5/6 h-4 bg-gray-200 rounded" />
                <div className="w-4/6 h-4 bg-gray-200 rounded" />
              </div>
            </div>
          </motion.div>

          {/* Imagen skeleton */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="aspect-square bg-gray-200 rounded-2xl p-8 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4" />
                <div className="w-20 h-5 bg-gray-300 rounded mx-auto mb-2" />
                <div className="w-32 h-4 bg-gray-300 rounded mx-auto" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default QuienesSomosSkeleton;

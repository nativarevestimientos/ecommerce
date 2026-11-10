import React from "react";
import { motion } from "framer-motion";

const AtencionPersonalizadaSkeleton = () => {
  return (
    <div className="px-4 xl:px-0">
      <section className="max-w-frame mx-auto px-4 md:px-6 py-12 md:py-16 bg-gray-100 rounded-3xl">
        <div className="text-center">
          {/* Título skeleton */}
          <motion.div
            initial={{ y: "100px", opacity: 0 }}
            animate={{ y: "0", opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="w-64 h-8 bg-gray-200 rounded mx-auto mb-4"
          />
          
          {/* Descripción skeleton */}
          <motion.div
            initial={{ y: "100px", opacity: 0 }}
            animate={{ y: "0", opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="w-80 h-5 bg-gray-200 rounded mx-auto mb-8 md:mb-12"
          />

          {/* Botón skeleton */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="w-56 h-12 bg-gray-200 rounded-xl mx-auto" />
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default AtencionPersonalizadaSkeleton;

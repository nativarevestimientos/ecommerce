import React from 'react';
import ProductCard from '@/components/common/ProductCard';
import { motion } from 'framer-motion';
import { Product } from '@/types/product';

interface ProductGridProps {
  products: Product[];
}

const ProductGrid: React.FC<ProductGridProps> = ({ products }) => {
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          No se encontraron productos
        </h3>
        <p className="text-gray-600">
          Intenta ajustar los filtros para ver más resultados
        </p>
      </div>
    );
  }

  return (
    <motion.div
      layout
      className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-6"
    >
      {products.map((product) => (
        <motion.div
          key={product.id}
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <ProductCard data={product} variant="shop" />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default ProductGrid; 
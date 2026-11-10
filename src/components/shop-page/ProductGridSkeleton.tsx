import React from 'react';
import { motion } from 'framer-motion';
import ProductSkeleton from '@/components/shop-page/product/ProductSkeleton';

interface ProductGridSkeletonProps {
  count?: number;
}

const ProductGridSkeleton: React.FC<ProductGridSkeletonProps> = ({ count = 12 }) => {
  const skeletons = Array.from({ length: count }, (_, index) => (
    <motion.div
      key={index}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <ProductSkeleton />
    </motion.div>
  ));

  return (
    <motion.div
      layout
      className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-6"
    >
      {skeletons}
    </motion.div>
  );
};

export default ProductGridSkeleton;

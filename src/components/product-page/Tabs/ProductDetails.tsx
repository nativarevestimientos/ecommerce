import React from "react";
import { Product } from '@/types/product';

const ProductDetails = ({ product }: { product: Product }) => {
  if (!product.description) {
    return (
      <div className="text-center py-4 text-neutral-500">
        No hay detalle disponible para este producto
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="prose max-w-none">
        <p>{product.description}</p>
      </div>
    </div>
  );
};

export default ProductDetails;

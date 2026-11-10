import React from "react";
import ProductDetails from "./ProductDetails";
import { Product } from '@/types/product';

const ProductDetailsContent = ({ product }: { product: Product }) => {
  return (
    <section>
      <h3 className="text-xl sm:text-2xl font-bold text-black mb-5 sm:mb-6">
        Especificaciones del producto
      </h3>
      <ProductDetails product={product} />
    </section>
  );
};

export default ProductDetailsContent;

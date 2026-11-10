import React from "react";

interface ProductPlaceholderProps {
  size?: "xs" | "sm" | "md" | "lg";
}

const ProductPlaceholder: React.FC<ProductPlaceholderProps> = ({ size = "sm" }) => {
  const sizeClasses = {
    xs: "w-8 h-8",
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-20 h-20"
  };

  return (
    <div className={`${sizeClasses[size]} relative rounded-md overflow-hidden`}>
      <div className="absolute inset-0 bg-[rgb(var(--brand-100))]"></div>
      <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-[rgb(var(--surface))]/70 to-transparent" />
      
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="w-1/2 h-0.5 bg-[rgb(var(--brand-300))] rounded-full mb-0.5"></div>
        <div className="w-1/3 h-0.5 bg-[rgb(var(--brand-300))] rounded-full"></div>
      </div>
      
      <div className="absolute inset-0 border border-[rgb(var(--brand-200))] rounded-md"></div>
    </div>
  );
};

export default ProductPlaceholder; 

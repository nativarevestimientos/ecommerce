import React from 'react';
import { useFilter } from '@/context/FilterContext';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowDownWideNarrow } from "lucide-react";

const sortOptions = [
  { value: 'most-popular', label: 'Más Populares', icon: '🔥' },
  { value: 'low-price', label: 'Precio: Menor a Mayor', icon: '💰' },
  { value: 'high-price', label: 'Precio: Mayor a Menor', icon: '💎' },
  { value: 'newest', label: 'Más Recientes', icon: '✨' },
  { value: 'best-rated', label: 'Mejor Valorados', icon: '⭐' },
  { value: 'discount', label: 'Mayor Descuento', icon: '🏷️' }
];

const ProductSort = () => {
  const { sortOption, setSortOption, filteredProducts } = useFilter();

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="text-sm text-gray-600">
        Mostrando {filteredProducts.length} Productos
      </div>
      
      <div className="flex items-center gap-2">
        <ArrowDownWideNarrow className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Ordenar por:</span>
        <RadioGroup
          value={sortOption}
          onValueChange={setSortOption}
          className="flex items-center gap-4 ml-2"
        >
          {sortOptions.map((option) => (
            <div key={option.value} className="flex items-center gap-1">
              <RadioGroupItem value={option.value} id={option.value} />
              <Label
                htmlFor={option.value}
                className="flex items-center gap-1 text-sm font-normal cursor-pointer"
              >
                <span className="text-base">{option.icon}</span>
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
};

export default ProductSort; 
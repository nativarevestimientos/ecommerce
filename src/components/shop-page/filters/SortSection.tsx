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

const SortSection = () => {
  const { sortOption, setSortOption } = useFilter();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <ArrowDownWideNarrow className="w-4 h-4 text-gray-500" />
        <h3 className="font-medium text-gray-900">Ordenar por</h3>
      </div>
      
      <RadioGroup
        value={sortOption}
        onValueChange={setSortOption}
        className="space-y-2"
      >
        {sortOptions.map((option) => (
          <div
            key={option.value}
            className="flex items-center space-x-2 rounded-lg hover:bg-gray-50 p-2 transition-colors"
          >
            <RadioGroupItem value={option.value} id={option.value} />
            <Label
              htmlFor={option.value}
              className="flex items-center gap-2 text-sm font-normal cursor-pointer w-full"
            >
              <span className="text-base">{option.icon}</span>
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};

export default SortSection; 
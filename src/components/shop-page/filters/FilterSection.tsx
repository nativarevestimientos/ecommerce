import React from 'react';
import { useFilter } from '@/context/FilterContext';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { SlidersHorizontal } from "lucide-react";

const filterOptions = [
  { value: 'in-stock', label: 'En Stock', icon: '📦' },
  { value: 'on-sale', label: 'En Oferta', icon: '🎯' },
  { value: 'free-shipping', label: 'Envío Gratis', icon: '🚚' },
  { value: 'new-arrivals', label: 'Novedades', icon: '🆕' },
  { value: 'best-sellers', label: 'Más Vendidos', icon: '📈' }
];

const FilterSection = () => {
  const { activeFilters, toggleFilter } = useFilter();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <SlidersHorizontal className="w-4 h-4 text-gray-500" />
        <h3 className="font-medium text-gray-900">Filtros Adicionales</h3>
      </div>

      <div className="space-y-1">
        {filterOptions.map((option) => (
          <div
            key={option.value}
            className="flex items-center space-x-2 rounded-lg hover:bg-gray-50 p-2 transition-colors"
          >
            <Checkbox
              id={option.value}
              checked={activeFilters.includes(option.value)}
              onCheckedChange={() => toggleFilter(option.value)}
              className="data-[state=checked]:bg-black data-[state=checked]:border-black"
            />
            <Label
              htmlFor={option.value}
              className="flex items-center gap-2 text-sm font-normal cursor-pointer w-full"
            >
              <span className="text-base">{option.icon}</span>
              {option.label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FilterSection; 
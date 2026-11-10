import React, { useEffect, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { useFilter } from "@/context/FilterContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";

const PriceSection = () => {
  const { priceRange, setPriceRange, products } = useFilter();
  const [localPriceRange, setLocalPriceRange] = useState<[number, number]>(priceRange);
  const [minPrice, maxPrice] = localPriceRange;

  // Calcular el precio mínimo y máximo de los productos
  const productPriceRange = React.useMemo(() => {
    if (!products.length) return [0, 1000] as [number, number];
    const prices = products.map(product => product.price);
    return [Math.min(...prices), Math.max(...prices)] as [number, number];
  }, [products]);

  // Actualizar el rango local cuando cambie el rango global
  useEffect(() => {
    setLocalPriceRange(priceRange);
  }, [priceRange]);

  const handleSliderChange = (value: number[]) => {
    setLocalPriceRange([value[0], value[1]]);
  };

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(0, Math.min(Number(e.target.value), maxPrice));
    setLocalPriceRange([value, maxPrice]);
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(minPrice, Math.min(Number(e.target.value), productPriceRange[1]));
    setLocalPriceRange([minPrice, value]);
  };

  const handleApplyPriceRange = () => {
    setPriceRange(localPriceRange);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-sm">Rango de Precio</h3>
      
      <div className="space-y-4">
        <Slider
          min={productPriceRange[0]}
          max={productPriceRange[1]}
          step={1}
          value={localPriceRange}
          onValueChange={handleSliderChange}
          className="w-full"
        />
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="min-price">Precio Mínimo</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">$</span>
              <Input
                id="min-price"
                type="number"
                value={minPrice}
                onChange={handleMinPriceChange}
                className="pl-7"
                min={productPriceRange[0]}
                max={maxPrice}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="max-price">Precio Máximo</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">$</span>
              <Input
                id="max-price"
                type="number"
                value={maxPrice}
                onChange={handleMaxPriceChange}
                className="pl-7"
                min={minPrice}
                max={productPriceRange[1]}
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Rango: {formatCurrency(minPrice)} - {formatCurrency(maxPrice)}</span>
          <button
            onClick={handleApplyPriceRange}
            className="text-black hover:underline font-medium"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PriceSection;

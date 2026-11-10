import React from 'react';
import { useFilter } from '@/context/FilterContext';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const CategoriesSection = () => {
  const { categories, selectedCategory, setSelectedCategory } = useFilter();

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-sm">Categorías</h3>
      <RadioGroup
        value={selectedCategory || ''}
        onValueChange={setSelectedCategory}
        className="space-y-2"
      >
        {categories.map((category) => (
          <div key={category} className="flex items-center space-x-2">
            <RadioGroupItem value={category} id={category} />
            <Label htmlFor={category} className="text-sm font-normal capitalize">
              {category}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};

export default CategoriesSection;

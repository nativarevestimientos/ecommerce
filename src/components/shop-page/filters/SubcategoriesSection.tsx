import React from 'react';
import { useFilter } from '@/context/FilterContext';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const SubcategoriesSection = () => {
  const { 
    selectedCategory, 
    selectedSubcategory, 
    setSelectedSubcategory,
    getSubcategoriesForCategory
  } = useFilter();

  // Si no hay categoría seleccionada, no mostrar subcategorías
  if (!selectedCategory) return null;

  // Obtener las subcategorías específicas para la categoría seleccionada
  const categorySubcategories = getSubcategoriesForCategory(selectedCategory);

  // Si no hay subcategorías para esta categoría, no mostrar la sección
  if (!categorySubcategories.length) return null;

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-sm">Subcategorías de {selectedCategory}</h3>
      <RadioGroup
        value={selectedSubcategory || ''}
        onValueChange={setSelectedSubcategory}
        className="space-y-2"
      >
        {categorySubcategories.map((subcategory) => (
          <div key={subcategory} className="flex items-center space-x-2">
            <RadioGroupItem value={subcategory} id={subcategory} />
            <Label htmlFor={subcategory} className="text-sm font-normal">
              {subcategory}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};

export default SubcategoriesSection; 
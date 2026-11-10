import React from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { FiSliders } from "react-icons/fi";
import Filters from ".";
import { useFilter } from "@/context/FilterContext";

const MobileFilters = () => {
  const {
    setSelectedCategory,
    setSelectedSubcategory,
    setSelectedWoodType,
    setSelectedUso,
    setSpecialOffer,
    setBlackFriday,
    setCyberMonday,
    setNewArrival,
    setFeaturedBrand,
    setFreeShipping,
  } = useFilter();

  const limpiarFiltros = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSelectedWoodType(null);
    setSelectedUso(null);
    setSpecialOffer(false);
    setBlackFriday(false);
    setCyberMonday(false);
    setNewArrival(false);
    setFeaturedBrand(false);
    setFreeShipping(false);
  };

  return (
    <>
      <Drawer>
        <DrawerTrigger asChild>
          <button
            type="button"
            className="h-8 w-8 rounded-full bg-[#F0F0F0] text-black p-1 md:hidden"
          >
            <FiSliders className="text-base mx-auto" />
          </button>
        </DrawerTrigger>
        <DrawerContent className="max-h-[90%]">
          <DrawerHeader>
            <div className="flex items-center justify-between">
              <span className="font-bold text-black text-xl">Filtros</span>
              <FiSliders className="text-2xl text-black/40" />
            </div>
            <DrawerTitle className="hidden">filtros</DrawerTitle>
            <DrawerDescription className="hidden">filtros</DrawerDescription>
          </DrawerHeader>
          <div className="max-h-[90%] overflow-y-auto w-full px-5 md:px-6 py-5 space-y-5 md:space-y-6">
            <Filters />
          </div>
          <DrawerFooter className="px-5 md:px-6">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={limpiarFiltros}
                className="flex-1 border rounded-lg py-2.5 text-sm hover:bg-gray-50"
              >
                Limpiar filtros
              </button>
              <DrawerClose asChild>
                <button className="flex-1 bg-black text-white rounded-lg py-2.5 text-sm hover:opacity-90">
                  Cerrar
                </button>
              </DrawerClose>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default MobileFilters;

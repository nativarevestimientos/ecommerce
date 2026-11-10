"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FilterProvider, useFilter } from "@/context/FilterContext";
import { useSearchParams, useRouter } from "next/navigation";
import BreadcrumbShop from "@/components/shop-page/BreadcrumbShop";
import { FiSliders } from "react-icons/fi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MobileFilters from "@/components/shop-page/filters/MobileFilters";
import Filters from "@/components/shop-page/filters";
import FiltersSkeleton from "@/components/shop-page/filters/FiltersSkeleton";
import ProductGrid from '@/components/shop-page/ProductGrid';
import ProductGridSkeleton from '@/components/shop-page/ProductGridSkeleton';
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePromotionCampaign } from "@/context/PromotionCampaignContext";
import { isPromotionProduct, promotionName } from "@/lib/promotions";

const ShopSkeletonBlock = ({ className }: { className: string }) => (
  <div className={`animate-pulse rounded-full bg-[rgb(var(--brand-100))] ${className}`} />
);

type SortOption = 'most-popular' | 'low-price' | 'high-price' | 'newest';
type FilterType = 'specialOffer' | 'blackFriday' | 'cyberMonday' | 'newArrival' | 'featuredBrand' | 'freeShipping';

interface Product {
  active: boolean;
  category: string;
  createdAt: Date;
  description: string;
  discount: {
    amount: number;
    percentage: number;
  };
  featuredBrand: boolean;
  cyberMonday: boolean;
  freeShipping: boolean;
  images: string[];
  name: string;
  newArrival: boolean;
  price: number;
  promos: Array<{
    cantidad: number;
    descuento: number;
    precioFinal: number;
  }>;
  rating: number;
  sales: number;
  specialOffer: boolean;
  srcUrl: string;
  stock: number;
  subcategory: string;
  title: string;
  updatedAt: string;
}

function ShopContent() {
  const { 
    filteredProducts: catalogFilteredProducts,
    sortOption,
    setSortOption, 
    loading,
    specialOffer,
    blackFriday,
    cyberMonday,
    newArrival,
    featuredBrand,
    freeShipping,
    selectedCategory,
    selectedSubcategory,
    selectedWoodType,
    selectedUso
  } = useFilter();
  const searchParams = useSearchParams();
  const { campaign, active: promotionActive, loading: promotionLoading } = usePromotionCampaign();
  const requestedPromotion = searchParams.get("promotion");
  const matchesPromotion = Boolean(requestedPromotion && promotionActive && campaign?.id === requestedPromotion);
  const filteredProducts = useMemo(() => !requestedPromotion ? catalogFilteredProducts : matchesPromotion && campaign ? catalogFilteredProducts.filter((p) => isPromotionProduct(campaign, p)) : [], [catalogFilteredProducts, requestedPromotion, matchesPromotion, campaign]);
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;
  const urlKey = searchParams?.toString() ?? "";
  const lastUrlKeyRef = useRef<string>(urlKey);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [sortOption, specialOffer, blackFriday, cyberMonday, newArrival, featuredBrand, freeShipping, selectedCategory, selectedSubcategory, selectedWoodType, selectedUso, requestedPromotion]);

  useEffect(() => {
    if (!searchParams) return;
    const urlChanged = lastUrlKeyRef.current !== urlKey;
    lastUrlKeyRef.current = urlKey;
    if (urlChanged) return;

    const desired = new URLSearchParams(searchParams.toString());

    const setOrDelete = (key: string, value: string | null) => {
      const v = (value ?? "").trim();
      if (v) desired.set(key, v);
      else desired.delete(key);
    };

    const urlCategory = searchParams.get("category");
    const shouldWriteCategory =
      !!selectedCategory &&
      !(
        selectedWoodType &&
        (selectedCategory || "").toLowerCase() === "maderas" &&
        !urlCategory
      );

    setOrDelete("category", shouldWriteCategory ? selectedCategory : null);
    setOrDelete("subcategory", selectedSubcategory);
    setOrDelete("madera", selectedWoodType);
    setOrDelete("uso", selectedUso);

    if (sortOption && sortOption !== "most-popular") {
      desired.set("sort", sortOption);
    } else {
      desired.delete("sort");
    }

    const active: FilterType[] = [];
    if (specialOffer) active.push("specialOffer");
    if (blackFriday) active.push("blackFriday");
    if (cyberMonday) active.push("cyberMonday");
    if (newArrival) active.push("newArrival");
    if (featuredBrand) active.push("featuredBrand");
    if (freeShipping) active.push("freeShipping");

    if (active.length > 0) {
      desired.set("filter", active.join(","));
    } else {
      desired.delete("filter");
    }

    const current = new URLSearchParams(searchParams.toString());
    const normalize = (p: URLSearchParams) =>
      Array.from(p.entries())
        .sort(([ak, av], [bk, bv]) => ak.localeCompare(bk) || av.localeCompare(bv));

    const a = normalize(desired);
    const b = normalize(current);
    const equal =
      a.length === b.length && a.every(([k, v], idx) => k === b[idx][0] && v === b[idx][1]);

    if (!equal) {
      router.push(`/shop?${desired.toString()}`);
    }
  }, [
    featuredBrand,
    freeShipping,
    newArrival,
    router,
    searchParams,
    selectedCategory,
    selectedSubcategory,
    selectedUso,
    selectedWoodType,
    sortOption,
    specialOffer,
    blackFriday,
    cyberMonday,
    urlKey,
  ]);

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSortChange = (value: SortOption) => {
    setSortOption(value);
  };

  if (loading || (requestedPromotion && promotionLoading)) {
    return (
      <main className="pb-20">
        <div className="max-w-frame mx-auto">
          <hr className="h-[1px] border-t-black/10 mb-5 sm:mb-6" />
          <BreadcrumbShop />
          <div className="flex items-start md:space-x-5">
            <div className="hidden md:block min-w-[295px] max-w-[295px] rounded-xl border border-gray-100 bg-white px-5 py-5 shadow-lg md:px-6">
              <div className="flex items-center justify-between">
                <span className="font-bold text-black text-xl">Filtros</span>
                <FiSliders className="text-2xl text-black/40" />
              </div>
              <div className="mt-5">
                <FiltersSkeleton />
              </div>
            </div>

            <div className="flex-1">
              <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-2">
                    <ShopSkeletonBlock className="h-8 w-36 md:w-44" />
                    <div className="hidden md:block">
                      <ShopSkeletonBlock className="h-4 w-28" />
                    </div>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-[rgb(var(--brand-100))] md:hidden" />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:mt-0">
                  <ShopSkeletonBlock className="h-4 w-44 sm:w-48" />
                  <div className="flex items-center gap-2">
                    <ShopSkeletonBlock className="h-4 w-20" />
                    <div className="h-10 w-36 rounded-xl bg-[rgb(var(--brand-50))]" />
                  </div>
                </div>
              </div>

              <ProductGridSkeleton count={12} />
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="pb-20">
      <div className="max-w-frame mx-auto">
        <hr className="h-[1px] border-t-black/10 mb-5 sm:mb-6" />
        <BreadcrumbShop />
        <div className="flex md:space-x-5 items-start">
          <div className="hidden md:block min-w-[295px] max-w-[295px] bg-white rounded-xl shadow-lg border border-gray-100 px-5 md:px-6 py-5 space-y-5 md:space-y-6">
            <div className="flex items-center justify-between">
              <span className="font-bold text-black text-xl">Filtros</span>
              <FiSliders className="text-2xl text-black/40" />
            </div>
            <Filters />
          </div>

          <div className="flex-1">
            <div className="flex flex-col lg:flex-row lg:justify-between mb-6">
              <div className="flex items-center justify-between">
                <h1 className="font-bold text-2xl md:text-[32px]">{matchesPromotion && campaign ? promotionName(campaign) : "Productos"}</h1>
                <MobileFilters />
              </div>
              <div className="flex flex-col sm:items-center sm:flex-row mt-4 lg:mt-0">
                <span className="text-sm md:text-base text-black/60 mr-3">
                  Mostrando {filteredProducts.length} Productos
                </span>
                <div className="flex items-center">
                  Ordenar por:{" "}
                  <Select 
                    value={sortOption || "most-popular"} 
                    onValueChange={handleSortChange}
                  >
                    <SelectTrigger className="font-medium text-sm px-1.5 sm:text-base w-fit text-black bg-transparent shadow-none border-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="most-popular">Más Popular</SelectItem>
                      <SelectItem value="low-price">Precio Bajo</SelectItem>
                      <SelectItem value="high-price">Precio Alto</SelectItem>
                      <SelectItem value="newest">Más Recientes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {requestedPromotion && <div className="mb-5 rounded-xl border border-[rgb(var(--brand-200))] bg-[rgb(var(--brand-50))] p-4 text-sm text-[rgb(var(--brand-700))]">{matchesPromotion ? "Estás viendo los productos de esta promoción." : "Esta promoción no está disponible o ya finalizó."} <Link href="/shop" className="ml-1 font-semibold underline">Ver todo el catálogo</Link></div>}
            <ProductGrid products={currentProducts} />

            {filteredProducts.length > productsPerPage && (
              <>
                <hr className="border-t-black/10 mt-8" />
                {/* Paginación responsive y compacta */}
                <div className="mt-6">
                  {/* Mobile: indicador compacto */}
                  <div className="flex items-center justify-between md:hidden">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`flex items-center gap-1 px-3 py-2 rounded-md border border-black/10 ${
                        currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                      }`}
                    >
                      <ArrowLeftIcon className="h-4 w-4" />
                      <span>Anterior</span>
                    </button>
                    <span className="text-sm text-black/70">Página {currentPage} de {totalPages}</span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`flex items-center gap-1 px-3 py-2 rounded-md border border-black/10 ${
                        currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                      }`}
                    >
                      <span>Siguiente</span>
                      <ArrowRightIcon className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Desktop: paginación con elipsis */}
                  <div className="hidden md:flex items-center justify-between">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`flex items-center gap-1 px-2.5 py-2 rounded-md border border-black/10 ${
                        currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                      }`}
                    >
                      <ArrowLeftIcon className="h-4 w-4" />
                      <span>Anterior</span>
                    </button>

                    <div className="flex items-center gap-1 flex-wrap">
                      {(() => {
                        const pages: (number | string)[] = [];
                        const add = (p: number | string) => pages.push(p);
                        const last = totalPages;
                        const cur = currentPage;
                        // Siempre mostrar 1
                        add(1);
                        // Ellipsis después de 1
                        if (cur > 4) add('…');
                        // Ventana alrededor del actual
                        const start = Math.max(2, cur - 1);
                        const end = Math.min(last - 1, cur + 1);
                        for (let p = start; p <= end; p++) add(p);
                        // Ellipsis antes del último
                        if (cur < last - 3) add('…');
                        // Mostrar último si hay más de 1 página
                        if (last > 1) add(last);

                        return pages.map((p, idx) =>
                          typeof p === 'number' ? (
                            <button
                              key={`p-${p}-${idx}`}
                              onClick={() => handlePageChange(p)}
                              className={`min-w-[36px] h-9 px-2 flex items-center justify-center rounded-md ${
                                currentPage === p ? 'bg-black/5 text-black' : 'hover:bg-gray-50'
                              }`}
                            >
                              {p}
                            </button>
                          ) : (
                            <span key={`d-${idx}`} className="px-2 text-black/40">
                              {p}
                            </span>
                          )
                        );
                      })()}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`flex items-center gap-1 px-2.5 py-2 rounded-md border border-black/10 ${
                        currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                      }`}
                    >
                      <span>Siguiente</span>
                      <ArrowRightIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ShopPage() {
  const searchParams = useSearchParams();

  const rawCategory = searchParams?.get('category') || null;
  const rawSubcategory = searchParams?.get('subcategory') || null;
  const rawMadera = searchParams?.get('madera') || null;
  const rawUso = searchParams?.get('uso') || null;
  // Decodificar '+' como espacio para soportar enlaces tipo Piedra+Flex
  const decodePlus = (v: string | null) => v ? v.replace(/\+/g, ' ') : v;
  const category = decodePlus(rawCategory);
  const subcategory = decodePlus(rawSubcategory);
  const madera = decodePlus(rawMadera);
  const uso = decodePlus(rawUso);
  const sort = searchParams?.get('sort') as SortOption | null;
  const filter = searchParams?.get('filter');

  const initialFilters = useMemo(
    () => ({
      selectedCategory: category || (madera ? 'Maderas' : null),
      selectedSubcategory: subcategory,
      selectedWoodType: madera,
      selectedUso: uso || null,
      sortOption: sort || 'most-popular',
      filter: filter,
    }),
    [category, filter, madera, sort, subcategory, uso],
  );

  return (
    <FilterProvider initialFilters={initialFilters}>
      <ShopContent />
    </FilterProvider>
  );
}

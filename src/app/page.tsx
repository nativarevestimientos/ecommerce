"use client";

import { useEffect, useState } from "react";
import ProductSectionSkeleton from "@/components/common/ProductSectionSkeleton";
import DressStyle from "@/components/homepage/DressStyle";
import DressStyleSkeleton from "@/components/homepage/DressStyleSkeleton";
import Destacados from "@/components/homepage/Destacados";
import DestacadosSkeleton from "@/components/homepage/Destacados/DestacadosSkeleton";
import Cotizador from "@/components/homepage/CotizadorNew";
import QuienesSomos from "@/components/homepage/QuienesSomos";
import QuienesSomosSkeleton from "@/components/homepage/QuienesSomos/QuienesSomosSkeleton";
// Obras y Ubicacion ocultas en la versión actual
// import Obras from "@/components/homepage/Obras";
// import ObrasSkeleton from "@/components/homepage/Obras/ObrasSkeleton";
// import Ubicacion from "@/components/homepage/Ubicacion";
// import UbicacionSkeleton from "@/components/homepage/Ubicacion/UbicacionSkeleton";
import InstagramGrid from "@/components/homepage/InstagramGrid";
import AtencionPersonalizada from "@/components/homepage/AtencionPersonalizada";
import AtencionPersonalizadaSkeleton from "@/components/homepage/AtencionPersonalizada/AtencionPersonalizadaSkeleton";
import Header from "@/components/homepage/Header";
import { api } from "@/lib/api";
import { Product } from "@/types/product";
import OfferPopup from "@/components/common/OfferPopup";
import { AnimatePresence } from "framer-motion";
import WhatsAppButton from "@/components/common/WhatsAppButton";
import CategoryCarousel from "@/components/homepage/CategoryCarousel";
import { Truck, Headphones, PackageCheck, CreditCard } from "lucide-react";
import { usePromotionCampaign } from "@/context/PromotionCampaignContext";

export default function Home() {
  const { active: cyberActive } = usePromotionCampaign();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue("--page-bg")
      .trim();
    const rgb = raw ? `rgb(${raw})` : "rgb(243, 242, 241)";
    document.body.style.backgroundColor = rgb;
    return () => {
      document.body.style.backgroundColor = "";
    };
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Usar la API interna que ya filtra por estadoTienda === 'Activo'
        const res = await fetch("/api/products?all=1", { cache: "no-store" });
        if (!res.ok) {
          throw new Error("Error al cargar productos");
        }
        const fetchedProducts = (await res.json()) as Product[];
        setProducts(fetchedProducts);
        setError(null);
      } catch (error) {
        console.error("Error fetching products:", error);
        setError("Error al cargar los productos. Por favor, intenta de nuevo.");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Derivados: ofertas y nuevos productos (ya filtrados por estadoTienda === 'Activo')
  const ofertasEspeciales = products.filter((p) => p.specialOffer === true);
  const nuevosIngresos = products.filter((p) => p.newArrival === true);

  // Nuevas categorías filtradas
  const revestimientos = products.filter(
    (p) => p.category === "Revestimientos",
  );
  const decks = products.filter((p) => {
    const category = (p.category || "").toLowerCase();
    return category === "decks" || category.includes("deck");
  });
  const beneficios = [
    {
      icon: Truck,
      eyebrow: "Envíos a",
      title: "Todo el país",
      detail: "Pactados previamente",
    },
    {
      icon: Headphones,
      eyebrow: "Atención",
      title: "Personalizada",
      detail: "Asesoramiento comercial",
    },
    {
      icon: PackageCheck,
      eyebrow: "Stock para",
      title: "Entrega inmediata",
      detail: "Disponibilidad permanente",
    },
    {
      icon: CreditCard,
      eyebrow: "Financiación",
      title: "Consultá opciones",
      detail: "Alternativas para tu proyecto",
    },
  ];
  return (
    <>
      <Header />
      <div className="section-bg-1 section-pad">
        <div className="max-w-frame mx-auto py-5">
          {loading ? <DressStyleSkeleton /> : <DressStyle />}
        </div>
      </div>

      <div className="section-bg-1">
        <div className="max-w-frame mx-auto">
          {!loading && ofertasEspeciales.length > 0 && (
            <CategoryCarousel
              title="Ofertas Especiales"
              subtitle="Colección"
              featuredImage="/images/home/collections/ofertas-especiales/desktop.png"
              mobileFeaturedImage="/images/home/collections/ofertas-especiales/mobile.png"
              products={ofertasEspeciales.slice(0, 8)}
              linkHref="/shop?filter=specialOffer"
            />
          )}
        </div>
      </div>

      <div className="section-bg-1">
        <div className="max-w-frame mx-auto">
          {!loading && decks.length > 0 && (
            <CategoryCarousel
              title="Decks"
              subtitle="Colección"
              featuredImage="/images/home/collections/tablas-deck/desktop.png"
              mobileFeaturedImage="/images/home/collections/tablas-deck/mobile.png"
              products={decks.slice(0, 8)}
              linkHref="/shop?category=Decks"
            />
          )}
        </div>
      </div>

      <div className="section-bg-1">
        <div className="max-w-frame mx-auto">
          {!loading && nuevosIngresos.length > 0 && (
            <CategoryCarousel
              title="Nuevos Ingresos"
              subtitle="Colección"
              featuredImage="/images/home/collections/nuevos-ingresos/desktop.png"
              mobileFeaturedImage="/images/home/collections/nuevos-ingresos/mobile.png"
              products={nuevosIngresos.slice(0, 8)}
              linkHref="/shop?filter=newArrival"
            />
          )}
        </div>
      </div>

      <div className="section-bg-1">
        <div className="max-w-frame mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <a href="/shop?uso=Interior" className="group relative h-32 md:h-44 rounded-2xl overflow-hidden block">
              <picture>
                <source media="(max-width: 768px)" srcSet="/images/home/uso/interior/mobile.png" />
                <img src="/images/home/uso/interior/desktop.png" alt="Interior" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </picture>
              <div className="absolute bottom-4 right-4">
                <span className="btn-brand text-sm font-medium px-4 py-1.5 rounded-md shadow-sm transition-colors">VER MÁS</span>
              </div>
            </a>
            <a href="/shop?uso=Exterior" className="group relative h-32 md:h-44 rounded-2xl overflow-hidden block">
              <picture>
                <source media="(max-width: 768px)" srcSet="/images/home/uso/exterior/mobile.png" />
                <img src="/images/home/uso/exterior/desktop.png" alt="Exterior" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </picture>
              <div className="absolute bottom-4 right-4">
                <span className="btn-brand text-sm font-medium px-4 py-1.5 rounded-md shadow-sm transition-colors">VER MÁS</span>
              </div>
            </a>
          </div>
        </div>
      </div>

      <div className="section-bg-1 mt-8 md:mt-0">
        <div className="max-w-frame mx-auto">
          {!loading && revestimientos.length > 0 && (
            <CategoryCarousel
              title="Revestimientos"
              subtitle="Colección"
              featuredImage="/images/home/collections/revestimientos/desktop.png"
              mobileFeaturedImage="/images/home/collections/revestimientos/mobile.png"
              products={revestimientos.slice(0, 8)}
              linkHref="/shop?category=Revestimientos"
            />
          )}
        </div>
      </div>

      {/* Secciones de categorías eliminadas en favor de Ofertas y Nuevossss */}

      {/* COTIZADOR: maqueta no funcional */}
      <div className="section-bg-2">
        <div className="max-w-frame mx-auto">
          <Cotizador />
        </div>
      </div>

      
      {loading ? (
        <AtencionPersonalizadaSkeleton />
      ) : (
        <div className="section-bg-2 section-pad pt-0 md:pt-2">
          <div className="max-w-frame mx-auto">
            <AtencionPersonalizada />
          </div>
        </div>
      )}
      
      <div className="section-bg-1 section-pad pt-2 md:pt-4">
        <div className="max-w-frame mx-auto">
          <div className="rounded-2xl md:rounded-3xl bg-[linear-gradient(180deg,rgb(var(--surface)),rgb(var(--brand-50)))] border border-[rgb(var(--brand-600)/0.16)] p-4 sm:p-5 md:p-8 shadow-sm">
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
              {beneficios.map((beneficio) => {
                const Icon = beneficio.icon;
                return (
                  <div
                    key={beneficio.title}
                    className="group rounded-xl border border-[rgb(var(--brand-600)/0.14)] bg-[rgb(var(--surface))] p-4 md:p-5 text-center shadow-sm hover:shadow-lg hover:border-[rgb(var(--brand-600)/0.22)] hover:bg-[rgb(var(--brand-50))] transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="mx-auto h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-[rgb(var(--brand-600))] group-hover:bg-[rgb(var(--brand-100))] flex items-center justify-center transition-colors duration-300">
                      <Icon className="h-9 w-9 md:h-11 md:w-11 text-[rgb(var(--surface))] group-hover:text-[rgb(var(--brand-700))] transition-colors duration-300" />
                    </div>
                    <div className="mt-3">
                      <p className="text-[11px] md:text-xs uppercase tracking-[0.12em] font-semibold text-[rgb(var(--brand-700))]">
                        {beneficio.eyebrow}
                      </p>
                      <p className="text-base md:text-xl font-black text-gray-900 leading-tight mt-1">
                        {beneficio.title}
                      </p>
                      <p className="text-xs md:text-sm font-medium text-gray-600 mt-1">
                        {beneficio.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <QuienesSomosSkeleton />
      ) : (
        <div className="section-bg-1 section-pad pb-6 md:pb-10">
          <div className="max-w-frame mx-auto">
            <InstagramGrid />
            <QuienesSomos />
          </div>
        </div>
      )}
      

      <AnimatePresence>
        {!cyberActive && <OfferPopup />}
      </AnimatePresence>
      <WhatsAppButton />
    </>
  );
}

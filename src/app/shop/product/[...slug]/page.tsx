import { getProductById, getAllProducts } from '@/services/productService';
import BreadcrumbProduct from "@/components/product-page/BreadcrumbProduct";
import Header from "@/components/product-page/Header";
import ProductListSec from "@/components/common/ProductListSec";
import { Product } from '@/types/product';
import { notFound } from "next/navigation";
import ProductSkeleton from '@/components/shop-page/product/ProductSkeleton';
import { Suspense } from 'react';

// Configurar no-cache para esta página
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProductPage({
  params,
}: {
  params: { slug: string[] };
}) {
  const [id] = params.slug;

  // Obtener producto individual desde servicio (evita fetch relativo en server)
  const product = await getProductById(id);
  if (!product) return notFound();

  // Intentar cargar un set de relacionados (listado rápido). No es crítico si falla
  let relatedProducts: Product[] = [];
  try {
    const all = await getAllProducts();
    const base = (all || []).filter((p) => p.id !== product.id && p.active !== false);

    const score = (p: Product) => {
      let s = 0;
      if (product.subcategory && p.subcategory && p.subcategory === product.subcategory) s += 6;
      if (product.category && p.category && p.category === product.category) s += 4;
      if (product.tipoMadera && p.tipoMadera && p.tipoMadera === product.tipoMadera) s += 3;
      if (product.uso && p.uso && p.uso === product.uso) s += 2;
      if (product.specialOffer && p.specialOffer) s += 1;
      if (product.newArrival && p.newArrival) s += 1;
      return s;
    };

    const ranked = base
      .map((p) => ({ p, s: score(p) }))
      .sort((a, b) => {
        if (b.s !== a.s) return b.s - a.s;
        if ((b.p.sales ?? 0) !== (a.p.sales ?? 0)) return (b.p.sales ?? 0) - (a.p.sales ?? 0);
        return (b.p.rating ?? 0) - (a.p.rating ?? 0);
      })
      .map((x) => x.p);

    const primary = ranked.filter((p) => score(p) > 0);
    const fallback = ranked.filter((p) => score(p) === 0);
    relatedProducts = [...primary, ...fallback].slice(0, 12);
  } catch {}

  return (
    <Suspense fallback={<ProductSkeleton />}>
      <main>
        <div className="max-w-frame mx-auto mb-[50px] sm:mb-20">
          <hr className="h-[1px] border-t-black/10 mb-5 sm:mb-6" />
          <BreadcrumbProduct name={product.name ?? "product"} />
          <section className="mb-8 sm:mb-11">
            <Header data={product} />
          </section>
          <section className="mb-8 sm:mb-10">
            <ProductListSec
              title="Productos relacionados"
              data={relatedProducts}
              layout="carousel"
              preserveOrder
              autoScroll="always"
              loop={relatedProducts.length > 1}
            />
          </section>
        </div>
      </main>
    </Suspense>
  );
}

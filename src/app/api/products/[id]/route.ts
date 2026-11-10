import { NextResponse } from 'next/server';
import { api } from '@/lib/api';
import { Product } from '@/types/product';
import { resolveProductPricing } from '@/lib/product-pricing';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function isTiendaActivo(item: any): boolean {
  const p = item?.producto ?? item;
  const estadoTienda = p?.estadoTienda ?? item?.estadoTienda;
  return estadoTienda === 'Activo';
}

function mapPrecioToProduct(item: any): Product {
  const p = item?.producto ?? item;
  const pr = item?.pricing ?? item;
  const ext = item?.external ?? p?.external ?? null;
  const toNumOrNull = (v: any): number | null => {
    if (v === null || v === undefined) return null;
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const toPositiveIntOrNull = (v: any): number | null => {
    if (v === null || v === undefined) return null;
    const n = typeof v === "number" ? v : typeof v === "string" ? Number(v.trim()) : Number(v);
    if (!Number.isFinite(n)) return null;
    const i = Math.trunc(n);
    return i > 0 ? i : null;
  };

  const normalizeImages = (value: any): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value
        .map((v) => {
          if (typeof v === "string") return v;
          if (v && typeof v === "object") {
            return (
              v.url ||
              v.src ||
              v.image ||
              v.imageUrl ||
              v.imagen ||
              v.imagenUrl ||
              v.srcUrl ||
              ""
            );
          }
          return "";
        })
        .flatMap((s) => normalizeImages(s))
        .filter(Boolean);
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return [];

      const cleaned = trimmed
        .replace(/`/g, "")
        .replace(/^"+|"+$/g, "")
        .replace(/^'+|'+$/g, "")
        .replace(/%7C/gi, "|")
        .replace(/\s+\|\s+/g, "|");

      const hasManyUrls = (cleaned.match(/https?:\/\//g) || []).length > 1;
      if (hasManyUrls) {
        const matches = cleaned.match(/https?:\/\/[^\s"|,]+/g) || [];
        return matches.map((s) => s.trim()).filter(Boolean);
      }

      if (cleaned.includes("|") || cleaned.includes(",")) {
        return cleaned
          .split(/[|,]/g)
          .map((s) => s.trim())
          .filter(Boolean);
      }

      return [cleaned];
    }
    return [];
  };

  const images: string[] = [
    ...normalizeImages(p?.imagenes),
    ...normalizeImages(p?.images),
    ...normalizeImages(item?.imagenes),
    ...normalizeImages(item?.images),
    ...normalizeImages(p?.atributos?.imagenes),
    ...normalizeImages(p?.attributes?.images),
  ];
  const fallbackSrc = typeof p?.srcUrl === "string" && p.srcUrl.trim().length > 0 ? p.srcUrl.trim() : "";
  const imagesFinal = images.length > 0 ? images : (fallbackSrc ? [fallbackSrc] : []);

  const pricing = resolveProductPricing(item);
  const { amount: discountAmount, percentage: discountPercentage } = pricing.discount;

  const resolvedName = (typeof p?.nombre === 'string' && p.nombre.trim().length > 0)
    ? p.nombre
    : ((typeof p?.descripcion === 'string' && p.descripcion.trim().length > 0) ? p.descripcion : 'Sin nombre');

  const unidad = String(
    p?.unidad ??
      p?.unidadMedida ??
      pr?.unidad ??
      pr?.unidadMedida ??
      item?.unidad ??
      item?.unidadMedida ??
      p?.unit ??
      item?.unit ??
      "",
  ).trim();

  const pack = toPositiveIntOrNull(
    p?.pack ??
      pr?.pack ??
      p?.atributos?.pack ??
      p?.attributes?.pack ??
      ext?.pack
  );
  const minimoCompra = toPositiveIntOrNull(
    p?.minimoCompra ??
      pr?.minimoCompra ??
      p?.atributos?.minimoCompra ??
      p?.attributes?.minimoCompra ??
      ext?.minimoCompra
  );

  return {
    id: String(p?.id ?? p?.codigo ?? crypto.randomUUID()),
    title: resolvedName,
    name: resolvedName,
    description: p?.descripcion ?? '',
    price: pricing.price,
    finalPrice: pricing.finalPrice,
    images: imagesFinal,
    srcUrl: imagesFinal[0] || p?.srcUrl || '/placeholder.png',
    category: p?.categoria ?? pr?.categoria ?? '',
    subcategory:
      p?.subCategoria ??
      p?.subcategoria ??
      p?.subCategory ??
      pr?.subCategoria ??
      pr?.subcategoria ??
      pr?.subcategory ??
      '',
    stock: Number(p?.stockDisponible ?? p?.stock ?? 0),
    unidad,
    unidadMedida: unidad,
    unit: unidad,
    pack,
    minimoCompra,
    discount: { amount: Math.max(0, Number(discountAmount) || 0), percentage: Math.max(0, Number(discountPercentage) || 0) },
    freeShipping: false,
    createdAt: new Date(),
    sales: 0,
    rating: 0,
    active: isTiendaActivo(item),
    specialOffer: (Number(discountAmount) || 0) > 0 || (Number(discountPercentage) || 0) > 0,
    newArrival: false,
    featuredBrand: false,
    blackFriday: Boolean(p?.blackFriday ?? pr?.blackFriday ?? item?.blackFriday ?? false),
    cyberMonday: Boolean(p?.cyberMonday ?? pr?.cyberMonday ?? item?.cyberMonday ?? false),
    promos: [],
    updatedAt: new Date().toISOString(),
    external: {
      largo: toNumOrNull(ext?.largo),
      alto: toNumOrNull(ext?.alto),
      espesor: toNumOrNull(ext?.espesor),
      kg: toNumOrNull(ext?.kg),
      rendimiento: toNumOrNull(ext?.rendimiento),
    },
  } as Product;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;
    let precio: any | null = null;
    try {
      precio = await api.get<any>(`/precios?id=${encodeURIComponent(productId)}`);
    } catch (e) {
      // ignore and try fallback by codigo
    }

    // Fallback: algunos documentos usan "codigo" como identificador público
    if (!precio || !isTiendaActivo(precio)) {
      try {
        const byCodigo = await api.get<any>(`/precios?codigo=${encodeURIComponent(productId)}`);
        if (byCodigo && isTiendaActivo(byCodigo)) {
          precio = byCodigo;
        }
      } catch (e) {
        // no-op
      }
    }

    if (!precio || !isTiendaActivo(precio)) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json(mapPrecioToProduct(precio));
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
} 

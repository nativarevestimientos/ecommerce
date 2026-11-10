import { NextResponse } from 'next/server';
import { api } from '@/lib/api';
import { Product } from '@/types/product';
import { resolveProductPricing } from '@/lib/product-pricing';

// Evita que Next intente prerender estáticamente esta ruta
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

  const normalizeKg = (v: any): number | null => {
    if (v === null || v === undefined) return null;
    let n: number | null = null;
    if (typeof v === 'number') {
      n = v;
    } else if (typeof v === 'string') {
      const s = v.trim().replace(',', '.');
      const parsed = Number(s);
      n = Number.isFinite(parsed) ? parsed : null;
    }
    if (n === null || !Number.isFinite(n)) return null;
    let kg = n;
    if (kg > 100) {
      kg = kg / 1000;
    }
    return Math.round(kg * 1000) / 1000;
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
              v.imagenes ||
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

  const resolvedName =
    typeof p?.nombre === 'string' && p.nombre.trim().length > 0
      ? p.nombre
      : typeof p?.descripcion === 'string' && p.descripcion.trim().length > 0
      ? p.descripcion
      : 'Sin nombre';

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
    tipoMadera: p?.tipoMadera ?? p?.tipoMadera?.toString?.() ?? '',
    uso: p?.uso ?? '',
    stock: Number(p?.stockDisponible ?? p?.stock ?? 0),
    unidad,
    unidadMedida: unidad,
    unit: unidad,
    pack,
    minimoCompra,
    weightKg: normalizeKg(ext?.kg),
    discount: {
      amount: Math.max(0, Number(discountAmount) || 0),
      percentage: Math.max(0, Number(discountPercentage) || 0),
    },
    freeShipping: false,
    createdAt: new Date(),
    sales: 0,
    rating: 0,
    active: isTiendaActivo(item),
    specialOffer: (Number(discountAmount) || 0) > 0 || (Number(discountPercentage) || 0) > 0,
    newArrival: Boolean(p?.newArrival ?? false),
    featuredBrand: Boolean(p?.featuredBrand ?? false),
    blackFriday: Boolean(p?.blackFriday ?? pr?.blackFriday ?? item?.blackFriday ?? false),
    cyberMonday: Boolean(p?.cyberMonday ?? pr?.cyberMonday ?? item?.cyberMonday ?? false),
    promos: [],
    updatedAt: new Date().toISOString(),
    external: {
      largo: toNumOrNull(ext?.largo),
      alto: toNumOrNull(ext?.alto),
      espesor: toNumOrNull(ext?.espesor),
      kg: normalizeKg(ext?.kg),
      rendimiento: toNumOrNull(ext?.rendimiento),
    },
  } as Product;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const codigo = url.searchParams.get('codigo');
    const nombre = url.searchParams.get('nombre');
    const ids = url.searchParams.get('ids');
    const all = url.searchParams.get('all');
    const cantidad = url.searchParams.get('cantidad') ?? '1';
    const cepillado = url.searchParams.get('cepillado') ?? 'false';
    const redondear = url.searchParams.get('redondear') ?? 'true';

    // 1) Listado completo soportado por tu API (items[])
    if (all === '1' || all === 'true') {
      const data = await api.get<any>(`/precios?all=1`);
      const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
      const filtered = items.filter(isTiendaActivo).map(mapPrecioToProduct);
      return NextResponse.json(filtered);
    }

    // 2) Batch por ids
    if (ids) {
      const list = ids.split(',').map(s => s.trim()).filter(Boolean);
      if (list.length === 0) return NextResponse.json([], { status: 200 });
      const results = await Promise.all(
        list.map(async (oneId) => {
          let data: any | null = null;
          try {
            data = await api.get<any>(`/precios?id=${encodeURIComponent(oneId)}&cantidad=${cantidad}&cepillado=${cepillado}&redondear=${redondear}`);
          } catch {
            data = null;
          }
          if (!data || !isTiendaActivo(data)) {
            try {
              const byCodigo = await api.get<any>(`/precios?codigo=${encodeURIComponent(oneId)}&cantidad=${cantidad}&cepillado=${cepillado}&redondear=${redondear}`);
              if (byCodigo && isTiendaActivo(byCodigo)) data = byCodigo;
            } catch {
              // no-op
            }
          }
          return data && isTiendaActivo(data) ? mapPrecioToProduct(data) : null;
        })
      );
      return NextResponse.json(results.filter(Boolean));
    }

    // 3) Individual por id/codigo/nombre
    if (id || codigo || nombre) {
      const qs = new URLSearchParams();
      if (id) qs.set('id', id);
      if (codigo) qs.set('codigo', codigo);
      if (nombre) qs.set('nombre', nombre);
      qs.set('cantidad', cantidad);
      qs.set('cepillado', cepillado);
      qs.set('redondear', redondear);
      const data = await api.get<any>(`/precios?${qs.toString()}`);
      const items = Array.isArray(data) ? data : [data];
      const filtered = items.filter(isTiendaActivo).map(mapPrecioToProduct);
      return NextResponse.json(filtered);
    }

    // 4) Sin filtros: intenta all=1
    const data = await api.get<any>(`/precios?all=1`);
    const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
    const filtered = items.filter(isTiendaActivo).map(mapPrecioToProduct);
    return NextResponse.json(filtered);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
} 

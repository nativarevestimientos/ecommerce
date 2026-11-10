import { Product } from "@/types/product";
import { api } from "@/lib/api";
import { resolveProductPricing } from '@/lib/product-pricing';

function mapPrecioToProduct(item: any): Product {
  const p = item?.producto ?? item;
  const pr = item?.pricing ?? item;
  const ext = item?.external ?? p?.external ?? null;
  const toNumOrNull = (v: any): number | null => {
    if (v === null || v === undefined) return null;
    const n = typeof v === "number" ? v : Number(v);
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
    if (typeof v === "number") {
      n = v;
    } else if (typeof v === "string") {
      const s = v.trim().replace(",", ".");
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
  const rawImgs = Array.isArray(p?.imagenes)
    ? p.imagenes
    : Array.isArray(p?.images)
    ? p.images
    : [];
  const images: string[] = rawImgs.length > 0 ? rawImgs : (p?.srcUrl ? [p.srcUrl] : []);
  const pricing = resolveProductPricing(item);
  const { amount: discountAmount, percentage: discountPercentage } = pricing.discount;
  const resolvedName = (typeof p?.nombre === 'string' && p.nombre.trim().length > 0)
    ? p.nombre
    : ((typeof p?.descripcion === 'string' && p.descripcion.trim().length > 0) ? p.descripcion : 'Sin nombre');
  const normalizeUso = (value: any): string => {
    const raw = String(value ?? "").trim();
    if (!raw) return "";
    const lower = raw.toLowerCase();
    const hasExterior = lower.includes("exterior");
    const hasInterior = lower.includes("interior");
    if (hasExterior && hasInterior) return "Exterior/Interior";
    if (hasExterior) return "Exterior";
    if (hasInterior) return "Interior";
    return raw;
  };
  const uso = normalizeUso(p?.uso ?? p?.Uso ?? pr?.uso ?? pr?.Uso ?? p?.aplicacion ?? p?.application);

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
    images,
    srcUrl: images[0] || p?.srcUrl || '/placeholder.png',
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
    weightKg: normalizeKg(ext?.kg),
    discount: {
      amount: Math.max(0, Number(discountAmount) || 0),
      percentage: Math.max(0, Number(discountPercentage) || 0),
    },
    freeShipping: false,
    createdAt: new Date(),
    sales: 0,
    rating: 0,
    active: (p?.estadoTienda ?? item?.estadoTienda) === 'Activo',
    specialOffer: (Number(discountAmount) || 0) > 0 || (Number(discountPercentage) || 0) > 0,
    newArrival: Boolean(p?.newArrival ?? false),
    featuredBrand: Boolean(p?.featuredBrand ?? false),
    blackFriday: Boolean(p?.blackFriday ?? false),
    cyberMonday: Boolean(p?.cyberMonday ?? false),
    promos: [],
    updatedAt: new Date().toISOString(),
    uso,
    external: {
      largo: toNumOrNull(ext?.largo),
      alto: toNumOrNull(ext?.alto),
      espesor: toNumOrNull(ext?.espesor),
      kg: normalizeKg(ext?.kg),
      rendimiento: toNumOrNull(ext?.rendimiento),
    },
  } as Product;
}

export async function getProductById(productId: string): Promise<Product | null> {
  try {
    const precio = await api.get<any>(`/precios?id=${encodeURIComponent(productId)}`);
    return precio ? mapPrecioToProduct(precio) : null;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

export async function getAllProducts(): Promise<Product[]> {
  try {
    const data = await api.get<any>(`/precios?all=1`);
    const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
    return items.map(mapPrecioToProduct);
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

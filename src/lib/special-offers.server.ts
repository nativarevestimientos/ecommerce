import { unstable_cache } from 'next/cache';
import { api } from '@/lib/api';
import { resolveProductPricing } from '@/lib/product-pricing';

export type OfferPopupProduct = {
  id: string;
  name: string;
  price: number;
  finalPrice: number;
  image: string | null;
};

function isTiendaActivo(item: any): boolean {
  const product = item?.producto ?? item;
  return (product?.estadoTienda ?? item?.estadoTienda) === 'Activo';
}

function firstImage(value: any): string | null {
  if (!value) return null;

  if (Array.isArray(value)) {
    for (const entry of value) {
      const image = firstImage(entry);
      if (image) return image;
    }
    return null;
  }

  if (typeof value === 'object') {
    for (const key of ['url', 'src', 'image', 'imageUrl', 'imagen', 'imagenUrl', 'srcUrl', 'imagenes']) {
      const image = firstImage(value[key]);
      if (image) return image;
    }
    return null;
  }

  if (typeof value !== 'string') return null;

  const cleaned = value
    .trim()
    .replace(/`/g, '')
    .replace(/^"+|"+$/g, '')
    .replace(/^'+|'+$/g, '')
    .replace(/%7C/gi, '|');

  if (!cleaned) return null;

  const urls = cleaned.match(/https?:\/\/[^\s"|,]+/g);
  if (urls?.length) return urls[0].trim();

  return cleaned.split(/[|,]/g).map((part) => part.trim()).find(Boolean) ?? null;
}

function toOfferPopupProduct(item: any): OfferPopupProduct | null {
  if (!isTiendaActivo(item)) return null;

  const product = item?.producto ?? item;
  const pricing = resolveProductPricing(item);
  if (pricing.discount.amount <= 0 && pricing.discount.percentage <= 0) return null;

  const id = String(product?.id ?? product?.codigo ?? '').trim();
  if (!id) return null;

  const rawName = product?.nombre ?? product?.descripcion;
  const name = typeof rawName === 'string' && rawName.trim() ? rawName.trim() : 'Sin nombre';
  const image =
    firstImage(product?.imagenes) ??
    firstImage(product?.images) ??
    firstImage(item?.imagenes) ??
    firstImage(item?.images) ??
    firstImage(product?.atributos?.imagenes) ??
    firstImage(product?.attributes?.images) ??
    firstImage(product?.srcUrl);

  return {
    id,
    name,
    price: pricing.price,
    finalPrice: pricing.finalPrice,
    image,
  };
}

const getCachedOffers = unstable_cache(
  async (): Promise<OfferPopupProduct[]> => {
    const data = await api.get<any>('/precios?all=1');
    const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];

    return items
      .map(toOfferPopupProduct)
      .filter((offer: OfferPopupProduct | null): offer is OfferPopupProduct => offer !== null);
  },
  ['offer-popup-products-v1'],
  { revalidate: 300 },
);

export async function getRandomOfferPopupProduct(): Promise<OfferPopupProduct | null> {
  const offers = await getCachedOffers();
  if (offers.length === 0) return null;

  return offers[Math.floor(Math.random() * offers.length)];
}

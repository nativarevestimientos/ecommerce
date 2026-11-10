export interface Product {
  id: string;
  active: boolean;
  category: string;
  createdAt: Date;
  description: string;
  pack?: number | null;
  minimoCompra?: number | null;
  unidad?: string;
  unidadMedida?: string;
  unit?: string;
  /** Peso en kilogramos (opcional). Usado para cotización de envíos. */
  weightKg?: number | null;
  external?: {
    largo: number | null;
    alto: number | null;
    espesor: number | null;
    kg: number | null;
    rendimiento: number | null;
  };
  tipoMadera?: string;
  discount: {
    amount: number;
    percentage: number;
  };
  featuredBrand: boolean;
  blackFriday: boolean;
  cyberMonday: boolean;
  freeShipping: boolean;
  images: string[];
  name: string;
  newArrival: boolean;
  price: number;
  /** Authoritative final unit price returned by the pricing API. */
  finalPrice?: number;
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
  secondaryPriceText?: string;
  title: string;
  updatedAt: string;
  uso?: string;
} 

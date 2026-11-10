import { Product } from '@/types/product';
import { api } from '@/lib/api';

export async function getProducts(): Promise<Product[]> {
  const products = await api.get<Product[]>(`/products`);
  console.log("📦 Productos desde API externa:", products);
  return products;
}

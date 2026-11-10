import { api } from '@/lib/api';

export const fetchProducts = async () => {
  const data = await api.get<any>(`/precios?all=1`);
  const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
  return items;
};

import { api } from '@/services/api/client';
import type { Product } from '@/types/models';
import { normalizeProduct } from '@/utils/normalize';

export async function fetchProduct(id: string): Promise<Product> {
  const response = await api.get(`/api/products/${encodeURIComponent(id)}`);
  return normalizeProduct(response.data);
}

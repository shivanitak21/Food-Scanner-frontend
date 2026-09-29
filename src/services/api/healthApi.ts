import { api } from '@/services/api/client';

export async function fetchHealth(): Promise<{ status: string }> {
  const response = await api.get<{ status?: string }>('/health', { timeout: 8000 });
  const status = typeof response.data?.status === 'string' ? response.data.status : 'ok';
  return { status };
}

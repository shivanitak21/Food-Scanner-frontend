import { api } from '@/services/api/client';
import type { FamilyScan, ScanSummary } from '@/types/models';

export interface LabelDraft {
  productName: string;
  brand: string;
  ingredientsText: string;
  contains: string[];
  mayContain: string[];
  nutrition: Array<{ name: string; amount: string; unit?: string }>;
  sections: { ingredients: 'ready' | 'missing'; nutrition: 'ready' | 'missing'; allergens: 'ready' | 'missing' };
  verificationStatus: 'NEEDS_REVIEW';
}
import { normalizeFamilyScan, normalizeHistory } from '@/utils/normalize';

export async function scanBarcode(input: { barcode: string }): Promise<FamilyScan> {
  const response = await api.post('/api/scans/barcode', { barcode: input.barcode }, { timeout: 60000 });
  return normalizeFamilyScan(response.data, { scanType: 'barcode' });
}

export async function scanLabel(input: {
  uri: string;
  onProgress?: (ratio: number) => void;
}): Promise<FamilyScan> {
  const form = new FormData();
  form.append('image', {
    uri: input.uri,
    name: 'label.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);

  const response = await api.post('/api/scans/label', form, {
    timeout: 90000,
    onUploadProgress: (event) => {
      if (!input.onProgress) return;
      if (event.total && event.total > 0) {
        input.onProgress(Math.min(1, event.loaded / event.total));
        return;
      }
      input.onProgress(0);
    },
  });

  return normalizeFamilyScan(response.data, { scanType: 'label' });
}

export async function previewLabel(uris: string[]): Promise<LabelDraft> {
  const form = new FormData();
  uris.forEach((uri, index) => {
    form.append('images', {
      uri,
      name: `label-${index}.jpg`,
      type: 'image/jpeg',
    } as unknown as Blob);
  });
  const response = await api.post('/api/scans/label/preview', form, { timeout: 90000 });
  const record = response.data as LabelDraft;
  return {
    productName: record.productName ?? '',
    brand: record.brand ?? '',
    ingredientsText: record.ingredientsText ?? '',
    contains: record.contains ?? [],
    mayContain: record.mayContain ?? [],
    nutrition: record.nutrition ?? [],
    sections: record.sections ?? { ingredients: 'missing', nutrition: 'missing', allergens: 'missing' },
    verificationStatus: 'NEEDS_REVIEW',
  };
}

export async function confirmLabel(input: {
  productName: string;
  brand?: string;
  ingredientsText: string;
  contains: string[];
  mayContain: string[];
  nutrition: Array<{ name: string; amount: string; unit?: string }>;
}): Promise<FamilyScan> {
  const response = await api.post('/api/scans/label/confirm', input, { timeout: 60000 });
  return normalizeFamilyScan(response.data, { scanType: 'label' });
}

export async function fetchScanHistory(): Promise<ScanSummary[]> {
  const response = await api.get('/api/scans/history');
  return normalizeHistory(response.data);
}

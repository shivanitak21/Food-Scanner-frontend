import { api } from '@/services/api/client';
import type { FamilyScan, ScanSummary } from '@/types/models';

export interface LabelDraft {
  productName: string;
  brand: string;
  variant: string;
  category: string;
  claims: string[];
  ingredientsText: string;
  contains: string[];
  mayContain: string[];
  nutrition: Array<{ name: string; amount: string; unit?: string }>;
  sections: {
    package: 'ready' | 'missing';
    ingredients: 'ready' | 'missing';
    nutrition: 'ready' | 'missing';
    allergens: 'ready' | 'missing';
  };
  nextCapture: 'ingredients' | 'nutrition' | null;
  prompt: { title: string; message: string } | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'NEEDS_CONFIRMATION';
  verificationStatus: 'NEEDS_REVIEW';
}
import { normalizeFamilyScan, normalizeHistory } from '@/utils/normalize';

export async function scanBarcode(input: { barcode: string }): Promise<FamilyScan> {
  const response = await api.post('/api/scans/barcode', { barcode: input.barcode }, { timeout: 60000 });
  return normalizeFamilyScan(response.data, { scanType: 'barcode' });
}

function packageFile(uri: string, name: string): Blob {
  const normalized =
    uri.startsWith('file://') ||
    uri.startsWith('content://') ||
    uri.startsWith('ph://') ||
    uri.startsWith('assets-library:') ||
    uri.startsWith('http://') ||
    uri.startsWith('https://')
      ? uri
      : `file://${uri}`;
  return {
    uri: normalized,
    name,
    type: 'image/jpeg',
  } as unknown as Blob;
}

export async function scanLabel(input: {
  uri: string;
  onProgress?: (ratio: number) => void;
}): Promise<FamilyScan> {
  const form = new FormData();
  form.append('image', packageFile(input.uri, 'label.jpg'));

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
    form.append('images', packageFile(uri, `label-${index}.jpg`));
  });
  const response = await api.post('/api/scans/label/preview', form, { timeout: 90000 });
  const record = response.data as LabelDraft;
  return {
    productName: record.productName ?? '',
    brand: record.brand ?? '',
    variant: record.variant ?? '',
    category: record.category ?? '',
    claims: record.claims ?? [],
    ingredientsText: record.ingredientsText ?? '',
    contains: record.contains ?? [],
    mayContain: record.mayContain ?? [],
    nutrition: record.nutrition ?? [],
    sections: {
      package: record.sections?.package ?? (record.productName ? 'ready' : 'missing'),
      ingredients: record.sections?.ingredients ?? 'missing',
      nutrition: record.sections?.nutrition ?? 'missing',
      allergens: record.sections?.allergens ?? 'missing',
    },
    nextCapture: record.nextCapture ?? null,
    prompt: record.prompt ?? null,
    confidence: record.confidence ?? 'NEEDS_CONFIRMATION',
    verificationStatus: 'NEEDS_REVIEW',
  };
}

export async function confirmLabel(input: {
  productName: string;
  brand?: string;
  variant?: string;
  category?: string;
  claims?: string[];
  barcode?: string;
  ingredientsText: string;
  contains: string[];
  mayContain: string[];
  nutrition: Array<{ name: string; amount: string; unit?: string }>;
  imageUri?: string;
}): Promise<FamilyScan> {
  const form = new FormData();
  form.append('productName', input.productName);
  if (input.brand) form.append('brand', input.brand);
  if (input.variant) form.append('variant', input.variant);
  if (input.category) form.append('category', input.category);
  if (input.barcode) form.append('barcode', input.barcode);
  form.append('ingredientsText', input.ingredientsText);
  form.append('claims', JSON.stringify(input.claims ?? []));
  form.append('contains', JSON.stringify(input.contains));
  form.append('mayContain', JSON.stringify(input.mayContain));
  form.append('nutrition', JSON.stringify(input.nutrition));
  if (input.imageUri) {
    form.append('image', packageFile(input.imageUri, 'package.jpg'));
  }
  const response = await api.post('/api/scans/label/confirm', form, { timeout: 60000 });
  return normalizeFamilyScan(response.data, { scanType: 'label' });
}

export async function fetchScanHistory(): Promise<ScanSummary[]> {
  const response = await api.get('/api/scans/history');
  return normalizeHistory(response.data);
}

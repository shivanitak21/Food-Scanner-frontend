const EVENTS = new Set([
  'camera_started',
  'barcode_detected',
  'barcode_lookup_started',
  'barcode_lookup_success',
  'barcode_lookup_not_found',
  'barcode_lookup_failed',
  'ocr_started',
  'ocr_success',
  'ocr_low_confidence',
  'analysis_started',
  'analysis_success',
  'analysis_failed',
  'document_detected',
  'capture_taken',
  'image_quality_failed',
]);

export function scanEvent(name: string): void {
  if (!__DEV__ || !EVENTS.has(name)) return;
  console.info(`[scan] ${name}`);
}

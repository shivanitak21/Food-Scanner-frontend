import type { FamilyScan, ScanSummary } from '@/types/models';

function token(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function ingredientNames(scan: FamilyScan): string[] {
  const named = scan.product.ingredients.map((item) => item.name.trim()).filter(Boolean);
  if (named.length > 0) return named;
  return (scan.product.ingredientsText ?? '')
    .split(/,|\n|•/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function sameProduct(left: FamilyScan, right: FamilyScan): boolean {
  if (left.product.barcode && right.product.barcode) return left.product.barcode === right.product.barcode;
  const name = token(left.product.name);
  return name.length > 2 && name === token(right.product.name);
}

export function previousScan(current: FamilyScan, history: ScanSummary[]): ScanSummary | null {
  return (
    history.find((item) => item.family.id !== current.id && sameProduct(item.family, current)) ?? null
  );
}

export function ingredientChange(current: FamilyScan, earlier: FamilyScan): { added: string[]; removed: string[] } {
  const now = new Set(ingredientNames(current).map(token));
  const then = new Set(ingredientNames(earlier).map(token));
  return {
    added: ingredientNames(current).filter((name) => !then.has(token(name))).slice(0, 3),
    removed: ingredientNames(earlier).filter((name) => !now.has(token(name))).slice(0, 3),
  };
}

export function memoryLine(current: FamilyScan, earlier: ScanSummary, when: string): string {
  const change = ingredientChange(current, earlier.family);
  if (change.added.length === 0 && change.removed.length === 0) {
    return `Same ingredients as the scan from ${when}.`;
  }
  const parts = [
    change.added.length > 0 ? `now lists ${change.added.join(', ')}` : null,
    change.removed.length > 0 ? `no longer lists ${change.removed.join(', ')}` : null,
  ].filter(Boolean);
  return `Compared with ${when}: ${parts.join('; ')}.`;
}

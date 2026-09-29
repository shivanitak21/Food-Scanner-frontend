import type Ionicons from '@expo/vector-icons/Ionicons';

import { STATUS_FALLBACK_LABEL } from '@/constants/copy';
import type { AnalysisResult, AnalysisStatus, Finding, NutritionItem, ScanSummary } from '@/types/models';

type IconName = keyof typeof Ionicons.glyphMap;

export function clip(text: string, max = 96): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= max) return cleaned;
  const sliced = cleaned.slice(0, max);
  const lastSpace = sliced.lastIndexOf(' ');
  return `${(lastSpace > 40 ? sliced.slice(0, lastSpace) : sliced).trim()}…`;
}

export function statusLabel(status: AnalysisStatus): string {
  return STATUS_FALLBACK_LABEL[status];
}

export function shortenConcern(title: string): string {
  const value = title.toLowerCase();
  if (/saturated fat/.test(value)) return 'Saturated fat';
  if (/sodium|salt/.test(value)) return 'Sodium';
  if (/added sugar|sugar/.test(value)) return 'Added sugar';
  if (/caffeine/.test(value)) return 'Caffeine';
  if (/sweetener/.test(value)) return 'Artificial sweetener';
  if (/honey/.test(value)) return 'Honey';
  if (/gluten/.test(value)) return 'Gluten';
  return title.replace(/[“”"]/g, '').trim();
}

export function insightCopy(finding: Finding): { title: string; measure: string | null; reason: string } {
  const title = finding.nutrient || shortenConcern(finding.title);
  const measure = finding.value
    ? `${finding.value}${finding.unit ? ` ${finding.unit}` : ''}`
    : findingMeasure(finding);
  const reason =
    finding.shortReason ||
    (finding.severity === 'info' ? 'Noted from the available product data.' : 'Relevant to this profile.');
  return { title, measure, reason };
}

export function ingredientCategory(name: string, details?: string): string {
  if (details && !/detected|inferred|nutrition_label/i.test(details)) return details;
  const value = name.toLowerCase();
  if (/butter|milk|cream|cheese|ghee|whey|dairy/.test(value)) return 'Dairy';
  if (/salt|sodium/.test(value)) return 'Salt';
  if (/sugar|honey|syrup/.test(value)) return 'Sweetener';
  if (/colour|color|annatto/.test(value)) return 'Colour';
  if (/oil|fat/.test(value)) return 'Fat';
  if (/water/.test(value)) return 'Water';
  return 'Ingredient';
}

export function nutrientRatio(name: string, amount: number): number {
  const value = name.toLowerCase();
  const cap = /saturat/.test(value)
    ? 20
    : /sodium/.test(value)
      ? 600
      : /sugar/.test(value)
        ? 25
        : /protein/.test(value)
          ? 20
          : /carb/.test(value)
            ? 40
            : /fat/.test(value)
              ? 30
              : 20;
  if (!Number.isFinite(amount) || amount <= 0) return 0.04;
  return Math.max(0.06, Math.min(1, amount / cap));
}

export function parseAmount(item: NutritionItem): number | null {
  const match = `${item.amount} ${item.unit ?? ''}`.match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return null;
  const value = Number(match[1].replace(',', '.'));
  return Number.isFinite(value) ? value : null;
}

export function collectFindings(scan: AnalysisResult): Finding[] {
  const seen = new Set<string>();
  const items = [...scan.allergens, ...scan.nutritionConcerns, ...scan.concerns, ...scan.relevantIngredients];
  return items.filter((item) => {
    const key = item.id || item.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function importantFindings(scan: AnalysisResult): Finding[] {
  const items = collectFindings(scan);
  const flagged = items.filter((item) => item.severity !== 'info');
  return flagged.length > 0 ? flagged : items;
}

export function insightHeadline(scan: AnalysisResult): string {
  const count = importantFindings(scan).filter((item) => item.severity !== 'info').length;
  if (count === 0) return 'Nothing flagged';
  if (scan.status === 'avoid') return count === 1 ? '1 thing to check' : `${count} things to check`;
  return count === 1 ? '1 thing to review' : `${count} things to review`;
}

export function findingMeasure(finding: Finding): string | null {
  const source = `${finding.title} ${finding.explanation}`;
  const match = source.match(/(\d+(?:[.,]\d+)?)\s*(kcal|kj|g|mg|mcg|µg|%|ml)\b/i);
  if (!match) return null;
  return `${match[1]} ${match[2]}`;
}

export function findingLine(finding: Finding): string {
  const text = finding.explanation.trim();
  const same = text.toLowerCase() === finding.title.trim().toLowerCase();
  return clip(same ? (finding.evidence ?? text) : text, 88);
}

export function scanInsight(scan: ScanSummary): string {
  const concern = scan.family.familySummary.find((member) => member.status !== 'suitable');
  return concern?.headline ?? 'Looks okay';
}

export function nutrientIcon(name: string): IconName {
  const value = name.toLowerCase();
  if (/calorie|energy|kcal/.test(value)) return 'flame-outline';
  if (/sugar/.test(value)) return 'cube-outline';
  if (/protein/.test(value)) return 'barbell-outline';
  if (/carb/.test(value)) return 'leaf-outline';
  if (/salt|sodium/.test(value)) return 'ellipse-outline';
  if (/fat|saturat/.test(value)) return 'water-outline';
  if (/caffeine/.test(value)) return 'cafe-outline';
  return 'nutrition-outline';
}

export function ingredientIcon(name: string): IconName {
  const value = name.toLowerCase();
  if (/butter|milk|cream|cheese|ghee|whey/.test(value)) return 'water-outline';
  if (/salt|sodium/.test(value)) return 'ellipse-outline';
  if (/sugar|honey|syrup/.test(value)) return 'cube-outline';
  if (/oil|fat/.test(value)) return 'beaker-outline';
  if (/colour|color|annatto|dye/.test(value)) return 'color-palette-outline';
  if (/spice|herb|leaf|turmeric|mint/.test(value)) return 'leaf-outline';
  if (/nut|almond|peanut/.test(value)) return 'ellipse-outline';
  if (/egg/.test(value)) return 'egg-outline';
  if (/fish|shrimp/.test(value)) return 'fish-outline';
  return 'nutrition-outline';
}

export function formatAmount(item: NutritionItem): string {
  const unit = item.unit && !item.amount.toLowerCase().includes(item.unit.toLowerCase()) ? ` ${item.unit}` : '';
  return `${item.amount}${unit}`;
}

export function isCalorie(item: NutritionItem): boolean {
  return /calorie|energy|kcal/i.test(item.name);
}

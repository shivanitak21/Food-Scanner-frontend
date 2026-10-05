import { DISCLAIMER, FIT_LABEL, STATUS_FALLBACK_LABEL, STATUS_FALLBACK_SUMMARY } from '@/constants/copy';
import type {
  AgeGroup,
  AnalysisResult,
  AnalysisStatus,
  FamilyMemberSummary,
  FamilyScan,
  FitStatus,
  AuthSession,
  DietPreference,
  EvidenceItem,
  Finding,
  HealthInterpretation,
  FindingCategory,
  FindingSeverity,
  IngredientItem,
  LifeStage,
  NutritionItem,
  Product,
  Profile,
  ProfileRole,
  ScanSummary,
  User,
} from '@/types/models';
import { API_URL } from '@/constants/config';
import { humanizeKey } from '@/utils/format';

const ROLES: ProfileRole[] = ['self', 'adult', 'child', 'baby', 'other'];
const AGE_GROUPS: AgeGroup[] = ['baby', 'child', 'teen', 'adult', 'older_adult'];
const SEVERITIES: FindingSeverity[] = ['info', 'caution', 'avoid'];

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

export function unwrapData(value: unknown): unknown {
  const record = asRecord(value);
  if (!record || !('data' in record)) return value;
  const hasSession = 'token' in record || 'access_token' in record || 'accessToken' in record;
  const hasIdentity = 'id' in record || 'email' in record || 'status' in record;
  if (!hasSession && !hasIdentity && record.data && typeof record.data === 'object') {
    return record.data;
  }
  return value;
}

function pickString(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return undefined;
}

function pickNumber(record: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) return Number(value);
  }
  return null;
}

function pickBool(record: Record<string, unknown>, keys: string[]): boolean | undefined {
  for (const key of keys) {
    if (typeof record[key] === 'boolean') return record[key] as boolean;
  }
  return undefined;
}

function pickArray(record: Record<string, unknown>, keys: string[]): unknown[] {
  for (const key of keys) {
    if (Array.isArray(record[key])) return record[key] as unknown[];
  }
  return [];
}

function stringList(value: unknown): string[] {
  if (typeof value === 'string') {
    return value
      .split(/,|\n/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      const record = asRecord(item);
      if (!record) return '';
      return pickString(record, ['name', 'label', 'value', 'title']) ?? '';
    })
    .filter((item) => item.length > 0);
}

function normalizeRole(value: unknown): ProfileRole {
  const normalized = String(value ?? '').toLowerCase();
  if (normalized === 'you' || normalized === 'me' || normalized === 'primary') return 'self';
  if (ROLES.includes(normalized as ProfileRole)) return normalized as ProfileRole;
  return 'other';
}

function normalizeAgeGroup(value: unknown): AgeGroup | null {
  const normalized = String(value ?? '')
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  if (normalized === 'older' || normalized === 'senior') return 'older_adult';
  if (AGE_GROUPS.includes(normalized as AgeGroup)) return normalized as AgeGroup;
  return null;
}

function normalizeDiet(record: Record<string, unknown>): DietPreference {
  const explicit = String(pickString(record, ['diet', 'dietPreference', 'diet_preference']) ?? '').toLowerCase();
  if (explicit === 'vegan' || pickBool(record, ['isVegan', 'is_vegan', 'vegan']) === true) return 'vegan';
  if (explicit === 'vegetarian' || pickBool(record, ['isVegetarian', 'is_vegetarian', 'vegetarian']) === true) {
    return 'vegetarian';
  }
  return 'none';
}

const LIFE_STAGES: LifeStage[] = ['me', 'adult', 'child', 'teen', 'baby', 'pregnancy', 'breastfeeding', 'senior', 'other'];
const FITS: FitStatus[] = ['GOOD_FIT', 'REVIEW', 'DOES_NOT_FIT', 'INSUFFICIENT_INFORMATION'];

export function normalizeFit(value: unknown, status: AnalysisStatus): FitStatus {
  const text = String(value ?? '').toUpperCase();
  if (FITS.includes(text as FitStatus)) return text as FitStatus;
  if (status === 'avoid') return 'DOES_NOT_FIT';
  if (status === 'review') return 'REVIEW';
  return 'GOOD_FIT';
}

export function normalizeStatus(value: unknown): AnalysisStatus | null {
  if (typeof value !== 'string') return null;
  const normalized = value.toLowerCase().replace(/[\s-]+/g, '_');
  if (['suitable', 'looks_suitable', 'ok', 'safe', 'allowed', 'pass'].includes(normalized)) return 'suitable';
  if (['avoid', 'not_suitable', 'unsuitable', 'do_not_use', 'not_recommended', 'fail'].includes(normalized)) {
    return 'avoid';
  }
  if (['review', 'caution', 'warning', 'check', 'needs_review'].includes(normalized)) return 'review';
  return null;
}

function normalizeSeverity(value: unknown): FindingSeverity | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.toLowerCase();
  if (SEVERITIES.includes(normalized as FindingSeverity)) return normalized as FindingSeverity;
  if (normalized === 'warning' || normalized === 'medium') return 'caution';
  if (normalized === 'high' || normalized === 'critical') return 'avoid';
  if (normalized === 'low') return 'info';
  return undefined;
}

function normalizeFinding(value: unknown, index: number, category: FindingCategory): Finding | null {
  if (typeof value === 'string') {
    const text = value.trim();
    if (!text) return null;
    const parts = text.split(/\s+[—–]\s+|\s+-\s+/);
    const title = parts[0]?.trim() || text;
    const explanation = parts.length > 1 ? parts.slice(1).join(' — ').trim() : text;
    return { id: `${category}-${index}`, title, explanation, category };
  }

  const record = asRecord(value);
  if (!record) return null;
  const title =
    pickString(record, ['title', 'name', 'label', 'heading', 'ingredient', 'ingredientName', 'ingredient_name']) ??
    pickString(record, ['explanation', 'message', 'detail', 'reason', 'summary', 'text', 'why']);
  if (!title) return null;
  const explanation =
    pickString(record, ['explanation', 'message', 'detail', 'reason', 'summary', 'why', 'description', 'text']) ?? title;

  return {
    id: pickString(record, ['id']) ?? `${category}-${index}`,
    title,
    explanation,
    category,
    severity: normalizeSeverity(pickString(record, ['severity', 'level'])),
    ingredientName: pickString(record, ['ingredient', 'ingredientName', 'ingredient_name']),
    nutrient: pickString(record, ['nutrient']),
    value: pickString(record, ['value']),
    unit: pickString(record, ['unit']),
    shortReason: pickString(record, ['shortReason', 'short_reason']),
    insightType: pickString(record, ['type', 'insightType', 'insight_type']),
    evidence: pickString(record, ['evidence', 'source', 'basis']),
  };
}

function findings(record: Record<string, unknown>, keys: string[], category: FindingCategory): Finding[] {
  return pickArray(record, keys)
    .map((item, index) => normalizeFinding(item, index, category))
    .filter((item): item is Finding => item !== null);
}

function normalizeIngredient(value: unknown, index: number): IngredientItem | null {
  if (typeof value === 'string') {
    const name = value.trim();
    if (!name) return null;
    return { id: `ingredient-${index}`, name, flagged: false };
  }
  const record = asRecord(value);
  if (!record) return null;
  const name = pickString(record, ['name', 'ingredient', 'text', 'label']);
  if (!name) return null;
  return {
    id: pickString(record, ['id']) ?? `ingredient-${index}`,
    name,
    flagged: pickBool(record, ['flagged', 'isFlagged', 'is_flagged']) ?? false,
    reason: pickString(record, ['reason', 'explanation', 'why', 'message']),
    details: pickString(record, ['details', 'detail', 'description']),
  };
}

function normalizeNutritionItem(value: unknown, index: number, fallbackName?: string): NutritionItem | null {
  if (typeof value === 'string' || typeof value === 'number') {
    if (!fallbackName) return null;
    return { id: `nutrient-${index}`, name: humanizeKey(fallbackName), amount: String(value) };
  }
  const record = asRecord(value);
  if (!record) return null;
  const name = pickString(record, ['name', 'nutrient', 'label', 'title']) ?? (fallbackName ? humanizeKey(fallbackName) : undefined);
  const amount = pickString(record, ['amount', 'value', 'quantity']);
  if (!name || !amount) return null;
  const daily = pickNumber(record, ['dailyValuePercent', 'daily_value_percent', 'dailyValue', 'dv']);
  return {
    id: pickString(record, ['id']) ?? `nutrient-${index}`,
    name,
    amount,
    unit: pickString(record, ['unit']),
    dailyValuePercent: daily ?? undefined,
    note: pickString(record, ['note', 'concern', 'comment']),
  };
}

function normalizeNutrition(value: unknown): NutritionItem[] {
  if (Array.isArray(value)) {
    return value
      .map((item, index) => normalizeNutritionItem(item, index))
      .filter((item): item is NutritionItem => item !== null);
  }
  const record = asRecord(value);
  if (!record) return [];
  return Object.entries(record)
    .map(([key, entry], index) => normalizeNutritionItem(entry, index, key))
    .filter((item): item is NutritionItem => item !== null);
}

function normalizeEvidence(value: unknown, index: number): EvidenceItem | null {
  if (typeof value === 'string') {
    const title = value.trim();
    if (!title) return null;
    return { id: `evidence-${index}`, title };
  }
  const record = asRecord(value);
  if (!record) return null;
  const title = pickString(record, ['title', 'name', 'source', 'label']) ?? pickString(record, ['detail', 'description', 'text']);
  if (!title) return null;
  return {
    id: pickString(record, ['id']) ?? `evidence-${index}`,
    title,
    detail: pickString(record, ['detail', 'description', 'text', 'summary']),
    source: pickString(record, ['source', 'publisher', 'origin']),
    url: pickString(record, ['url', 'href', 'link']),
  };
}

export function normalizeProduct(value: unknown, fallbackName?: string): Product {
  const unwrapped = unwrapData(value);
  const outer = asRecord(unwrapped) ?? {};
  const record = asRecord(outer.product) ?? outer;
  let ingredients = pickArray(record, ['ingredients', 'ingredientList', 'ingredient_list'])
    .map((item, index) => normalizeIngredient(item, index))
    .filter((item): item is IngredientItem => item !== null);

  const ingredientsText = pickString(record, ['ingredientsText', 'ingredients_text', 'ingredientText']);
  if (ingredients.length === 0 && ingredientsText) {
    ingredients = ingredientsText
      .split(/,|\n|·/)
      .map((part) => part.trim())
      .filter(Boolean)
      .map((name, index) => ({ id: `ingredient-${index}`, name, flagged: false }));
  }

  const nutritionSource = record.nutrition ?? record.nutritionFacts ?? record.nutrition_facts ?? record.nutrients;

  return {
    id: pickString(record, ['id', 'productId', 'product_id']) ?? '',
    name: pickString(record, ['name', 'title', 'productName', 'product_name']) ?? fallbackName ?? 'Scanned product',
    brand: pickString(record, ['brand', 'brandName', 'brand_name', 'manufacturer']),
    barcode: pickString(record, ['barcode', 'code', 'upc', 'ean']),
    imageUrl: resolveImageUrl(pickString(record, ['imageUrl', 'image_url', 'image', 'photoUrl', 'photo_url'])),
    ingredientsText,
    ingredients,
    nutrition: normalizeNutrition(nutritionSource),
  };
}

function resolveImageUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (value.startsWith('/') && API_URL) return `${API_URL}${value}`;
  return value;
}

function normalizeScanType(value: unknown, fallback: 'barcode' | 'label'): 'barcode' | 'label' {
  const normalized = String(value ?? '').toLowerCase();
  if (normalized.includes('label') || normalized.includes('ocr') || normalized.includes('photo')) return 'label';
  if (normalized.includes('barcode') || normalized.includes('code')) return 'barcode';
  return fallback;
}

export function normalizeAnalysis(
  value: unknown,
  hint?: { scanType?: 'barcode' | 'label'; profileId?: string },
): AnalysisResult {
  const unwrapped = unwrapData(value);
  const outer = asRecord(unwrapped) ?? {};
  const record = asRecord(outer.analysis) ?? asRecord(outer.result) ?? asRecord(outer.scan) ?? outer;
  const recognized = normalizeStatus(pickString(record, ['status', 'overallStatus', 'overall_status', 'result']));
  const status: AnalysisStatus = recognized ?? 'review';
  const product = normalizeProduct(
    record.product ?? outer.product ?? record,
    pickString(record, ['productName', 'product_name']),
  );
  const ingredients = findings(record, ['relevantIngredients', 'relevant_ingredients'], 'ingredient');
  const ingredientItems =
    product.ingredients.length > 0
      ? product.ingredients
      : pickArray(record, ['ingredients', 'ingredientList', 'ingredient_list'])
          .map((item, index) => normalizeIngredient(item, index))
          .filter((item): item is IngredientItem => item !== null);

  const nutrition =
    product.nutrition.length > 0
      ? product.nutrition
      : normalizeNutrition(record.nutrition ?? record.nutritionFacts ?? record.nutrition_facts);

  return {
    id: pickString(record, ['id', 'scanId', 'scan_id']) ?? '',
    createdAt: pickString(record, ['createdAt', 'created_at', 'scannedAt', 'scanned_at']) ?? '',
    scanType: normalizeScanType(pickString(record, ['scanType', 'scan_type', 'type']), hint?.scanType ?? 'barcode'),
    profileId: pickString(record, ['profileId', 'profile_id']) ?? hint?.profileId,
    profileName: pickString(record, ['profileName', 'profile_name']),
    status,
    statusLabel: pickString(record, ['statusLabel', 'status_label', 'statusText', 'status_text']) ?? STATUS_FALLBACK_LABEL[status],
    summary:
      pickString(record, ['summary', 'explanation', 'profileExplanation', 'profile_explanation', 'message']) ??
      (recognized ? '' : STATUS_FALLBACK_SUMMARY.review),
    disclaimer: pickString(record, ['disclaimer', 'notice']) ?? DISCLAIMER,
    product,
    concerns: findings(record, ['concerns', 'importantConcerns', 'important_concerns'], 'other'),
    allergens: findings(record, ['allergens', 'detectedAllergens', 'detected_allergens'], 'allergen'),
    nutritionConcerns: findings(record, ['nutritionConcerns', 'nutrition_concerns'], 'nutrition'),
    relevantIngredients: ingredients,
    ingredients: ingredientItems,
    nutrition,
    evidence: pickArray(record, ['evidence', 'sources', 'references'])
      .map((item, index) => normalizeEvidence(item, index))
      .filter((item): item is EvidenceItem => item !== null),
    statusRecognized: recognized !== null,
  };
}

function memberFromAnalysis(analysis: AnalysisResult): FamilyMemberSummary {
  const fit = normalizeFit(undefined, analysis.status);
  return {
    profileId: analysis.profileId ?? '',
    profileName: analysis.profileName ?? 'Profile',
    status: analysis.status,
    fit,
    statusLabel: FIT_LABEL[fit],
    headline: analysis.summary || FIT_LABEL[fit],
  };
}

function normalizeMember(value: unknown, fallback?: AnalysisResult): FamilyMemberSummary | null {
  const record = asRecord(value);
  if (!record) return fallback ? memberFromAnalysis(fallback) : null;
  const status = normalizeStatus(pickString(record, ['status'])) ?? fallback?.status ?? 'review';
  const fit = normalizeFit(pickString(record, ['fit']), status);
  return {
    profileId: pickString(record, ['profileId', 'profile_id']) ?? fallback?.profileId ?? '',
    profileName: pickString(record, ['profileName', 'profile_name', 'name']) ?? fallback?.profileName ?? 'Profile',
    status,
    fit,
    statusLabel: pickString(record, ['statusLabel', 'status_label']) ?? FIT_LABEL[fit],
    headline: pickString(record, ['headline', 'topConcern', 'top_concern']) ?? FIT_LABEL[fit],
  };
}

export function normalizeFamilyScan(value: unknown, hint?: { scanType?: 'barcode' | 'label' }): FamilyScan {
  const unwrapped = unwrapData(value);
  const record = asRecord(unwrapped) ?? {};
  const analyses = pickArray(record, ['profileAnalyses', 'profile_analyses', 'profiles']);
  const isFamily = record.scope === 'family' || analyses.length > 0;

  if (!isFamily) {
    return wrapSingleAnalysis(normalizeAnalysis(value, hint));
  }

  const product = normalizeProduct(record.product, pickString(record, ['productName', 'product_name']));
  const scanType = normalizeScanType(pickString(record, ['scanType', 'scan_type', 'type']), hint?.scanType ?? 'barcode');
  const createdAt = pickString(record, ['createdAt', 'created_at']) ?? '';
  const id = pickString(record, ['id', 'scanId', 'scan_id']) ?? '';
  const profiles = analyses.map((item, index) => {
    const analysis = normalizeAnalysis(item, { scanType });
    return {
      ...analysis,
      id: analysis.id || `${id || 'scan'}-${index}`,
      createdAt: analysis.createdAt || createdAt,
      scanType,
      product: analysis.product.name && analysis.product.name !== 'Scanned product' ? analysis.product : product,
    };
  });
  const summary = pickArray(record, ['familySummary', 'family_summary'])
    .map((item, index) => normalizeMember(item, profiles[index]))
    .filter((item): item is FamilyMemberSummary => item !== null);

  return {
    id,
    createdAt,
    scanType,
    disclaimer: pickString(record, ['disclaimer', 'notice']) ?? profiles[0]?.disclaimer ?? DISCLAIMER,
    product: product.name ? product : (profiles[0]?.product ?? product),
    familySummary: summary.length > 0 ? summary : profiles.map(memberFromAnalysis),
    profiles,
    missingInformation: stringList(record.missingInformation ?? record.missing_information),
  };
}

function wrapSingleAnalysis(analysis: AnalysisResult): FamilyScan {
  return {
    id: analysis.id,
    createdAt: analysis.createdAt,
    scanType: analysis.scanType,
    disclaimer: analysis.disclaimer,
    product: analysis.product,
    familySummary: [memberFromAnalysis(analysis)],
    profiles: [analysis],
    missingInformation: [],
  };
}

export function normalizeHistory(value: unknown): ScanSummary[] {
  const unwrapped = unwrapData(value);
  const record = asRecord(unwrapped);
  const list = Array.isArray(unwrapped)
    ? unwrapped
    : record
      ? pickArray(record, ['items', 'scans', 'history', 'results'])
      : [];

  return list.map((item, index) => {
    const family = normalizeFamilyScan(item);
    return {
      id: family.id || `scan-${index}`,
      createdAt: family.createdAt,
      scanType: family.scanType,
      productName: family.product.name,
      productBrand: family.product.brand,
      imageUrl: family.product.imageUrl,
      profileCount: family.familySummary.length,
      reviewCount: family.familySummary.filter((member) => member.fit === 'REVIEW').length,
      okayCount: family.familySummary.filter((member) => member.fit === 'GOOD_FIT').length,
      importantCount: family.familySummary.filter((member) => member.fit === 'DOES_NOT_FIT').length,
      insufficientCount: family.familySummary.filter((member) => member.fit === 'INSUFFICIENT_INFORMATION').length,
      family,
    };
  });
}

export function normalizeUser(value: unknown): User {
  const unwrapped = unwrapData(value);
  const record = asRecord(unwrapped) ?? {};
  const user = asRecord(record.user) ?? record;
  return {
    id: pickString(user, ['id', 'userId', 'user_id']) ?? '',
    name: pickString(user, ['name', 'fullName', 'full_name']) ?? '',
    email: pickString(user, ['email']) ?? '',
  };
}

export function normalizeAuth(value: unknown): AuthSession {
  const record = asRecord(value) ?? {};
  const token = pickString(record, ['token', 'accessToken', 'access_token', 'jwt']);
  if (!token) {
    throw new Error('The server did not return a session token.');
  }
  return { token, user: normalizeUser(record.user ?? record) };
}

export function normalizeProfile(value: unknown, index = 0): Profile | null {
  const record = asRecord(unwrapData(value));
  if (!record) return null;
  const profile = asRecord(record.profile) ?? record;
  const name = pickString(profile, ['name', 'displayName', 'display_name']);
  if (!name) return null;
  const role = normalizeRole(pickString(profile, ['role', 'relationship', 'type']));
  return {
    id: pickString(profile, ['id', 'profileId', 'profile_id']) ?? `profile-${index}`,
    name,
    role,
    ageGroup: normalizeAgeGroup(pickString(profile, ['ageGroup', 'age_group'])),
    age: pickNumber(profile, ['age']),
    diet: normalizeDiet(profile),
    dietaryPreferences: stringList(profile.dietaryPreferences ?? profile.dietary_preferences ?? profile.preferences),
    allergies: stringList(profile.allergies),
    limits: stringList(profile.limits ?? profile.limitIngredients ?? profile.limit_ingredients ?? profile.restrictions),
    goals: stringList(profile.goals).slice(0, 3),
    lifeStage: LIFE_STAGES.find((stage) => stage === pickString(profile, ['lifeStage', 'life_stage'])) ?? null,
    notes: pickString(profile, ['notes', 'note']) ?? null,
    isPrimary: pickBool(profile, ['isPrimary', 'is_primary']) ?? role === 'self',
    healthContext: normalizeHealth(profile.healthContext ?? profile.health_context),
  };
}

function normalizeHealth(value: unknown): Profile['healthContext'] {
  const record = asRecord(value);
  if (!record) return undefined;
  const biomarkers = pickArray(record, ['biomarkers'])
    .map((item) => {
      const row = asRecord(item);
      if (!row) return null;
      const name = pickString(row, ['name']);
      if (!name) return null;
      const rawInterpretation = pickString(row, ['interpretation']);
      const interpretation: HealthInterpretation | null =
        rawInterpretation === 'elevated' || rawInterpretation === 'low' || rawInterpretation === 'normal' || rawInterpretation === 'borderline'
          ? rawInterpretation
          : null;
      return {
        name,
        value: pickNumber(row, ['value']),
        unit: pickString(row, ['unit']) ?? null,
        interpretation,
        date: pickString(row, ['date']) ?? null,
        confirmedByUser: pickBool(row, ['confirmedByUser', 'confirmed_by_user']) ?? false,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
  const dietaryRecommendations = pickArray(record, ['dietaryRecommendations', 'dietary_recommendations'])
    .map((item) => {
      const row = asRecord(item);
      if (!row) return null;
      const recommendation = pickString(row, ['recommendation']);
      if (!recommendation) return null;
      return {
        recommendation,
        source: pickString(row, ['source']) ?? null,
        confirmedByUser: pickBool(row, ['confirmedByUser', 'confirmed_by_user']) ?? false,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
  return {
    enabled: pickBool(record, ['enabled']) ?? false,
    paused: pickBool(record, ['paused']) ?? false,
    biomarkers,
    dietaryRecommendations,
    reportCount: pickNumber(record, ['reportCount', 'report_count']) ?? 0,
  };
}

export function normalizeProfiles(value: unknown): Profile[] {
  const unwrapped = unwrapData(value);
  const record = asRecord(unwrapped);
  const list = Array.isArray(unwrapped)
    ? unwrapped
    : record
      ? pickArray(record, ['profiles', 'items', 'results'])
      : [];
  return list
    .map((item, index) => normalizeProfile(item, index))
    .filter((item): item is Profile => item !== null);
}

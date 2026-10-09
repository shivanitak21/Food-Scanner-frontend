export type AnalysisStatus = 'suitable' | 'review' | 'avoid';

export type FitStatus = 'GOOD_FIT' | 'REVIEW' | 'DOES_NOT_FIT' | 'INSUFFICIENT_INFORMATION';

export type ProfileRole = 'self' | 'adult' | 'child' | 'baby' | 'other';

export type LifeStage = 'me' | 'adult' | 'child' | 'teen' | 'baby' | 'pregnancy' | 'breastfeeding' | 'senior' | 'other';

export type AgeGroup = 'baby' | 'child' | 'teen' | 'adult' | 'older_adult';

export type DietPreference = 'none' | 'vegetarian' | 'vegan';

export type FindingCategory = 'allergen' | 'nutrition' | 'ingredient' | 'preference' | 'other';

export type FindingSeverity = 'info' | 'caution' | 'avoid';

export interface User {
  id: string;
  name: string;
  email: string;
}

export type HealthInterpretation = 'elevated' | 'low' | 'normal' | 'borderline';

export interface HealthBiomarker {
  name: string;
  value: number | null;
  unit: string | null;
  interpretation: HealthInterpretation | null;
  date: string | null;
  confirmedByUser: boolean;
}

export interface HealthRecommendation {
  recommendation: string;
  source: string | null;
  confirmedByUser: boolean;
}

export interface HealthContext {
  enabled: boolean;
  paused: boolean;
  biomarkers: HealthBiomarker[];
  dietaryRecommendations: HealthRecommendation[];
  reportCount: number;
}

export interface Profile {
  id: string;
  name: string;
  role: ProfileRole;
  ageGroup: AgeGroup | null;
  age: number | null;
  dateOfBirth: string | null;
  diet: DietPreference;
  dietaryPreferences: string[];
  allergies: string[];
  limits: string[];
  goals: string[];
  lifeStage: LifeStage | null;
  notes: string | null;
  isPrimary: boolean;
  healthContext?: HealthContext;
}

export interface ProfileInput {
  name: string;
  role: ProfileRole;
  ageGroup: AgeGroup | null;
  age: number | null;
  dateOfBirth: string | null;
  diet: DietPreference;
  dietaryPreferences: string[];
  allergies: string[];
  limits: string[];
  goals: string[];
  lifeStage: LifeStage | null;
  notes: string | null;
  isPrimary: boolean;
}

export interface Finding {
  id: string;
  title: string;
  explanation: string;
  category: FindingCategory;
  severity?: FindingSeverity;
  ingredientName?: string;
  nutrient?: string;
  value?: string;
  unit?: string;
  shortReason?: string;
  insightType?: string;
  evidence?: string;
}

export interface FamilyMemberSummary {
  profileId: string;
  profileName: string;
  status: AnalysisStatus;
  fit: FitStatus;
  statusLabel: string;
  headline: string;
}

export interface FamilyScan {
  id: string;
  createdAt: string;
  scanType: 'barcode' | 'label';
  disclaimer: string;
  product: Product;
  familySummary: FamilyMemberSummary[];
  profiles: AnalysisResult[];
  missingInformation?: string[];
}

export interface IngredientItem {
  id: string;
  name: string;
  flagged: boolean;
  reason?: string;
  details?: string;
}

export interface NutritionItem {
  id: string;
  name: string;
  amount: string;
  unit?: string;
  dailyValuePercent?: number;
  note?: string;
}

export interface EvidenceItem {
  id: string;
  title: string;
  detail?: string;
  source?: string;
  url?: string;
}

export interface Product {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  imageUrl?: string;
  ingredientsText?: string;
  ingredients: IngredientItem[];
  nutrition: NutritionItem[];
}

export interface AnalysisResult {
  id: string;
  createdAt: string;
  scanType: 'barcode' | 'label';
  profileId?: string;
  profileName?: string;
  status: AnalysisStatus;
  statusLabel: string;
  summary: string;
  disclaimer: string;
  product: Product;
  concerns: Finding[];
  allergens: Finding[];
  nutritionConcerns: Finding[];
  relevantIngredients: Finding[];
  ingredients: IngredientItem[];
  nutrition: NutritionItem[];
  evidence: EvidenceItem[];
  statusRecognized: boolean;
}

export interface ScanSummary {
  id: string;
  createdAt: string;
  scanType: 'barcode' | 'label';
  productName: string;
  productBrand?: string;
  imageUrl?: string;
  profileCount: number;
  reviewCount: number;
  okayCount: number;
  importantCount: number;
  insufficientCount: number;
  family: FamilyScan;
}

export interface AuthSession {
  token: string;
  user: User;
}

export type QuickOverall = 'good' | 'review' | 'limit' | 'insufficient';

export type HealthConsideration = 'diabetes' | 'high_blood_pressure' | 'high_cholesterol' | 'other';

export interface QuickContext {
  age: number | null;
  dateOfBirth: string | null;
  diet: DietPreference;
  dietaryPreferences: string[];
  allergies: string[];
  healthConditions: HealthConsideration[];
  goals: string[];
  thingsToWatch: string[];
  eating: string[];
  hasContext: boolean;
}

export interface ProfileSeed {
  dateOfBirth: string | null;
  age: number | null;
  diet: DietPreference;
  dietaryPreferences: string[];
  allergies: string[];
  limits: string[];
  goals: string[];
  notes: string | null;
  lifeStage: LifeStage | null;
  eating: string[];
}

export interface QuickHighlight {
  id: string;
  name: string;
  amount: string | null;
  unit: string;
  basis: string | null;
  level: 'low' | 'moderate' | 'high' | 'unknown';
  levelLabel: string;
  bar: number;
  tone: 'positive' | 'attention' | 'concern' | 'neutral';
  emphasized: boolean;
}

export interface QuickCaution {
  id: string;
  title: string;
  detail: string;
}

export interface QuickScan {
  scope: 'quick';
  id: string;
  productId: string;
  createdAt: string;
  scanType: 'barcode' | 'label';
  disclaimer: string;
  product: Product;
  overall: QuickOverall;
  overallLabel: string;
  overallDetail: string;
  highlights: QuickHighlight[];
  whatToKnow: string[];
  notableIngredients: Array<{ name: string; note: string }>;
  whoMayWantToCheck: string[];
  whoEmpty: string;
  contextNotes: string[];
  professionalNote: string | null;
  cautions: QuickCaution[];
  ingredients: IngredientItem[];
  context: QuickContext;
  profileDraft: ProfileSeed;
}

export interface QuickContextInput {
  age?: number | null;
  dateOfBirth?: string | null;
  diet?: DietPreference;
  dietaryPreferences?: string[];
  allergies?: string[];
  healthConditions?: HealthConsideration[];
  goals?: string[];
  thingsToWatch?: string[];
  eating?: string[];
}

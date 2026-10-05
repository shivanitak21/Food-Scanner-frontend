import type { AgeGroup, DietPreference, LifeStage, ProfileRole } from '@/types/models';

export const ROLE_OPTIONS: { value: ProfileRole; label: string; description: string }[] = [
  { value: 'self', label: 'You', description: 'Your own food profile' },
  { value: 'adult', label: 'Adult', description: 'Another adult in the household' },
  { value: 'child', label: 'Child', description: 'A child you shop or cook for' },
  { value: 'baby', label: 'Baby', description: 'An infant profile' },
  { value: 'other', label: 'Other', description: 'Anyone else you want to track' },
];

export const AGE_GROUP_OPTIONS: { value: AgeGroup; label: string }[] = [
  { value: 'baby', label: 'Baby' },
  { value: 'child', label: 'Child' },
  { value: 'teen', label: 'Teen' },
  { value: 'adult', label: 'Adult' },
  { value: 'older_adult', label: 'Older adult' },
];

export const DIET_OPTIONS: { value: DietPreference; label: string }[] = [
  { value: 'none', label: 'No specific diet' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
];

export const ALLERGY_OPTIONS = [
  'Milk',
  'Peanuts',
  'Tree nuts',
  'Eggs',
  'Soy',
  'Wheat',
  'Gluten',
  'Sesame',
  'Fish',
  'Shellfish',
];

export const ALLERGY_LABELS: Record<string, string> = {
  Milk: 'Milk / Dairy',
  Peanuts: 'Peanut',
  Eggs: 'Egg',
};

export const LIMIT_OPTIONS = [
  'Added sugar',
  'Sodium',
  'Saturated fat',
  'Caffeine',
  'Artificial sweeteners',
];

export const LIMIT_LABELS: Record<string, string> = {
  Sodium: 'Sodium / salt',
};

export const EATING_OPTIONS: { id: string; label: string; diet?: DietPreference; preference?: string }[] = [
  { id: 'vegetarian', label: 'Vegetarian', diet: 'vegetarian' },
  { id: 'vegan', label: 'Vegan', diet: 'vegan' },
  { id: 'eggetarian', label: 'Eggetarian', preference: 'Eggetarian' },
  { id: 'non-vegetarian', label: 'Non-vegetarian' },
  { id: 'jain', label: 'Jain', preference: 'Jain' },
  { id: 'halal', label: 'Halal', preference: 'Halal' },
  { id: 'kosher', label: 'Kosher', preference: 'Kosher' },
  { id: 'gluten-free', label: 'Gluten-free', preference: 'Gluten-free' },
  { id: 'dairy-free', label: 'Dairy-free', preference: 'Dairy-free' },
  { id: 'low-lactose', label: 'Low lactose', preference: 'Low lactose' },
];

export const GOAL_OPTIONS = [
  'Eat healthier',
  'Avoid allergens',
  'Manage sugar',
  'Watch salt',
  'Watch saturated fat',
  'Increase protein',
  'Increase fiber',
  'Find family-friendly foods',
  'Understand ingredients',
  'Shop faster',
  'Find better alternatives',
];

export const WHO_OPTIONS: {
  id: LifeStage;
  label: string;
  role: ProfileRole;
  ageGroup: AgeGroup | null;
}[] = [
  { id: 'me', label: 'Me', role: 'self', ageGroup: 'adult' },
  { id: 'adult', label: 'Adult', role: 'adult', ageGroup: 'adult' },
  { id: 'child', label: 'Child', role: 'child', ageGroup: 'child' },
  { id: 'teen', label: 'Teen', role: 'adult', ageGroup: 'teen' },
  { id: 'baby', label: 'Baby', role: 'baby', ageGroup: 'baby' },
  { id: 'pregnancy', label: 'Pregnancy', role: 'adult', ageGroup: 'adult' },
  { id: 'breastfeeding', label: 'Breastfeeding', role: 'adult', ageGroup: 'adult' },
  { id: 'senior', label: 'Senior', role: 'adult', ageGroup: 'older_adult' },
  { id: 'other', label: 'Other', role: 'other', ageGroup: null },
];

export const PREFERENCE_OPTIONS = [
  'Gluten-free',
  'Low sodium',
  'Low sugar',
  'Halal',
  'Kosher',
  'Organic preferred',
  'Nut-free',
];

export function roleLabel(role: ProfileRole): string {
  return ROLE_OPTIONS.find((option) => option.value === role)?.label ?? 'Profile';
}

export function ageGroupLabel(ageGroup: AgeGroup | null): string | null {
  if (!ageGroup) return null;
  return AGE_GROUP_OPTIONS.find((option) => option.value === ageGroup)?.label ?? null;
}

export function dietLabel(diet: DietPreference): string {
  return DIET_OPTIONS.find((option) => option.value === diet)?.label ?? 'No specific diet';
}

export function lifeStageLabel(stage: LifeStage | null): string | null {
  if (!stage) return null;
  return WHO_OPTIONS.find((option) => option.id === stage)?.label ?? null;
}

export function allergyLabel(value: string): string {
  return ALLERGY_LABELS[value] ?? value;
}

export function limitLabel(value: string): string {
  return LIMIT_LABELS[value] ?? value;
}

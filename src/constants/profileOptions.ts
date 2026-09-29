import type { AgeGroup, DietPreference, ProfileRole } from '@/types/models';

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
  'Eggs',
  'Peanuts',
  'Tree nuts',
  'Soy',
  'Wheat',
  'Fish',
  'Shellfish',
  'Sesame',
];

export const LIMIT_OPTIONS = [
  'Added sugar',
  'Sodium',
  'Saturated fat',
  'Caffeine',
  'Artificial sweeteners',
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

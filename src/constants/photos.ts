import type { ImageSource } from 'expo-image';

import type { AgeGroup, LifeStage, ProfileRole, ProfileSex } from '@/types/models';

export type PhotoSource = ImageSource | number;

export const foodPhotos = {
  hero: require('../../assets/images/grocery-hero.jpg'),
  scan: require('../../assets/images/breakfast-scan.jpg'),
  bowl: require('../../assets/images/salmon-bowl.jpg'),
  plate: require('../../assets/images/greens-plate.jpg'),
  cereal: require('../../assets/images/grocery-cereal.jpg'),
  dairy: require('../../assets/images/grocery-dairy.jpg'),
  pantry: require('../../assets/images/grocery-pantry.jpg'),
  snacks: require('../../assets/images/grocery-snacks.jpg'),
} as const;

const groceryPhotos: PhotoSource[] = [foodPhotos.cereal, foodPhotos.dairy, foodPhotos.pantry, foodPhotos.snacks];

const groceryHints: { pattern: RegExp; photo: PhotoSource }[] = [
  { pattern: /milk|yog|curd|cheese|dairy|butter|cream|paneer|lassi/i, photo: foodPhotos.dairy },
  { pattern: /cereal|oat|granola|muesli|flake|corn|bran|wheat|bread/i, photo: foodPhotos.cereal },
  { pattern: /jam|honey|spread|peanut|nut|sauce|jar|ketchup|pickle|syrup/i, photo: foodPhotos.pantry },
  { pattern: /chip|crisp|cracker|bar|biscuit|cookie|snack|namkeen|wafer|chocolate/i, photo: foodPhotos.snacks },
];

function hash(value: string): number {
  let total = 0;
  for (let index = 0; index < value.length; index += 1) total = (total * 31 + value.charCodeAt(index)) | 0;
  return Math.abs(total);
}

export function productPhoto(name: string, imageUrl?: string | null): PhotoSource {
  if (imageUrl) return { uri: imageUrl };
  const hint = groceryHints.find((item) => item.pattern.test(name));
  return hint?.photo ?? groceryPhotos[hash(name) % groceryPhotos.length];
}

export const avatarPhotos = {
  baby: require('../../assets/images/avatars/baby.jpg'),
  girl: require('../../assets/images/avatars/child-girl.jpg'),
  boy: require('../../assets/images/avatars/child.jpg'),
  teenGirl: require('../../assets/images/avatars/teen-girl.jpg'),
  teenBoy: require('../../assets/images/avatars/teen.jpg'),
  woman: require('../../assets/images/avatars/adult-a.jpg'),
  man: require('../../assets/images/avatars/adult-b.jpg'),
  grandma: require('../../assets/images/avatars/senior.jpg'),
  grandpa: require('../../assets/images/avatars/senior-man.jpg'),
  pregnancy: require('../../assets/images/avatars/pregnancy.jpg'),
} as const;

export type AvatarPerson = {
  name?: string | null;
  role?: ProfileRole | null;
  ageGroup?: AgeGroup | null;
  lifeStage?: LifeStage | null;
  age?: number | null;
  sex?: ProfileSex | null;
};

type Stage = 'baby' | 'child' | 'teen' | 'adult' | 'senior' | 'pregnancy';

const BY_SEX: Record<Exclude<Stage, 'baby' | 'pregnancy'>, Record<ProfileSex, PhotoSource>> = {
  child: { female: avatarPhotos.girl, male: avatarPhotos.boy },
  teen: { female: avatarPhotos.teenGirl, male: avatarPhotos.teenBoy },
  adult: { female: avatarPhotos.woman, male: avatarPhotos.man },
  senior: { female: avatarPhotos.grandma, male: avatarPhotos.grandpa },
};

function stageFor(person: AvatarPerson): Stage {
  switch (person.lifeStage) {
    case 'baby':
      return 'baby';
    case 'child':
      return 'child';
    case 'teen':
      return 'teen';
    case 'senior':
      return 'senior';
    case 'pregnancy':
      return 'pregnancy';
    case 'breastfeeding':
      return 'adult';
    default:
      break;
  }
  if (person.ageGroup === 'baby' || person.ageGroup === 'child' || person.ageGroup === 'teen') return person.ageGroup;
  if (person.ageGroup === 'older_adult') return 'senior';
  if (typeof person.age === 'number') {
    if (person.age < 3) return 'baby';
    if (person.age < 13) return 'child';
    if (person.age < 18) return 'teen';
    if (person.age >= 60) return 'senior';
    return 'adult';
  }
  if (person.role === 'baby') return 'baby';
  if (person.role === 'child') return 'child';
  return 'adult';
}

function sexFor(person: AvatarPerson): ProfileSex {
  if (person.sex) return person.sex;
  if (person.lifeStage === 'pregnancy' || person.lifeStage === 'breastfeeding') return 'female';
  return hash(person.name ?? '') % 2 === 0 ? 'female' : 'male';
}

export function avatarFor(person: AvatarPerson): PhotoSource {
  const stage = stageFor(person);
  if (stage === 'baby' || stage === 'pregnancy') return avatarPhotos[stage];
  return BY_SEX[stage][sexFor(person)];
}

export function avatarForStage(stage: LifeStage, sex?: ProfileSex | null): PhotoSource {
  if (stage === 'baby' || stage === 'pregnancy') return avatarPhotos[stage];
  const group = stage === 'child' || stage === 'teen' || stage === 'senior' ? stage : 'adult';
  const fallback: ProfileSex = stage === 'adult' || stage === 'other' ? 'male' : 'female';
  return BY_SEX[group][sex ?? fallback];
}

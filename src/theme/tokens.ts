import type { TextStyle } from 'react-native';

type FontFace = Pick<TextStyle, 'fontFamily'>;

export const fonts = {
  editorial: { fontFamily: 'PlusJakartaSans_600SemiBold' } satisfies FontFace,
  editorialItalic: { fontFamily: 'PlusJakartaSans_500Medium' } satisfies FontFace,
  body: { fontFamily: 'PlusJakartaSans_400Regular' } satisfies FontFace,
  bodyMedium: { fontFamily: 'PlusJakartaSans_500Medium' } satisfies FontFace,
  bodySemibold: { fontFamily: 'PlusJakartaSans_600SemiBold' } satisfies FontFace,
  bodyBold: { fontFamily: 'PlusJakartaSans_700Bold' } satisfies FontFace,
};

export const iconSize = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

export const radius = {
  sm: 14,
  md: 20,
  lg: 28,
  xl: 36,
  pill: 999,
} as const;

export type ColorTokens = {
  background: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  primary: string;
  primaryStart: string;
  primaryEnd: string;
  primaryPressed: string;
  onPrimary: string;
  washStart: string;
  washMid: string;
  washWarm: string;
  glassFill: string;
  glassStrong: string;
  glassBorder: string;
  glassHighlight: string;
  primarySoft: string;
  honey: string;
  honeySoft: string;
  suitable: string;
  suitableSoft: string;
  review: string;
  reviewSoft: string;
  avoid: string;
  avoidSoft: string;
  info: string;
  infoSoft: string;
  danger: string;
  accent: string;
  accentSoft: string;
  shadow: string;
  overlay: string;
  inverse: string;
  heroStart: string;
  heroEnd: string;
  tabBar: string;
  sage: string;
  cream: string;
  ink: string;
};

export const lightColors: ColorTokens = {
  background: '#F9F6FD',
  surface: '#FFFFFF',
  surfaceMuted: '#EFE8F8',
  text: '#241B38',
  textSecondary: '#6E6484',
  textTertiary: '#9A90AE',
  border: '#E6DEF2',
  primary: '#FF6A2C',
  primaryStart: '#FF9A5C',
  primaryEnd: '#FF5722',
  primaryPressed: '#E45718',
  washStart: '#E4D7FB',
  washMid: '#F8DDEC',
  washWarm: '#FDEBD9',
  glassFill: 'rgba(255, 255, 255, 0.62)',
  glassStrong: 'rgba(255, 255, 255, 0.84)',
  glassBorder: 'rgba(255, 255, 255, 0.9)',
  glassHighlight: 'rgba(255, 255, 255, 0.7)',
  onPrimary: '#FFFFFF',
  primarySoft: '#FFE8DC',
  honey: '#FFB020',
  honeySoft: '#FFF3DC',
  suitable: '#1FA971',
  suitableSoft: '#E5F8EF',
  review: '#E59A12',
  reviewSoft: '#FFF4DE',
  avoid: '#E85D5D',
  avoidSoft: '#FDECEC',
  info: '#6C5CE7',
  infoSoft: '#EEE9FF',
  danger: '#E85D5D',
  accent: '#7C6BF2',
  accentSoft: '#E7E0FA',
  shadow: 'rgba(72, 48, 120, 0.10)',
  overlay: 'rgba(28, 20, 48, 0.45)',
  inverse: '#241B38',
  heroStart: '#6C5CE7',
  heroEnd: '#B7A6FF',
  tabBar: '#FFFFFF',
  sage: '#C9BFE0',
  cream: '#F7F3FC',
  ink: '#2A2144',
};

export const darkColors: ColorTokens = {
  background: '#14111C',
  surface: '#211C2E',
  surfaceMuted: '#2C2640',
  text: '#F6F2FC',
  textSecondary: '#C4BCD4',
  textTertiary: '#8E86A3',
  border: '#3A3350',
  primary: '#FF7A45',
  primaryStart: '#FFB07A',
  primaryEnd: '#FF6430',
  primaryPressed: '#FF9568',
  washStart: '#2C2450',
  washMid: '#2A1C32',
  washWarm: '#241C22',
  glassFill: 'rgba(40, 34, 58, 0.62)',
  glassStrong: 'rgba(40, 34, 58, 0.86)',
  glassBorder: 'rgba(255, 255, 255, 0.12)',
  glassHighlight: 'rgba(255, 255, 255, 0.08)',
  onPrimary: '#1A1020',
  primarySoft: '#3D261C',
  honey: '#FFB340',
  honeySoft: '#3A2C16',
  suitable: '#3DDC97',
  suitableSoft: '#163528',
  review: '#FFB340',
  reviewSoft: '#3A2C16',
  avoid: '#FF8A80',
  avoidSoft: '#3D2224',
  info: '#B4A6FF',
  infoSoft: '#2A2444',
  danger: '#FF8A80',
  accent: '#A99BFF',
  accentSoft: '#2A2444',
  shadow: 'rgba(0, 0, 0, 0.35)',
  overlay: 'rgba(0, 0, 0, 0.62)',
  inverse: '#F6F2FC',
  heroStart: '#4C3D96',
  heroEnd: '#7C6BF2',
  tabBar: '#1A1624',
  sage: '#6E6588',
  cream: '#2C2640',
  ink: '#F6F2FC',
};

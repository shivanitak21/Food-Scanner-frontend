import { Platform, type TextStyle } from 'react-native';

type FontFace = Pick<TextStyle, 'fontFamily' | 'fontWeight'>;

function system(weight: TextStyle['fontWeight']): FontFace {
  if (Platform.OS !== 'android') return { fontWeight: weight };

  const fontFamily =
    weight === '100' || weight === '200'
      ? 'sans-serif-thin'
      : weight === '300'
        ? 'sans-serif-light'
        : weight === '500' || weight === '600'
          ? 'sans-serif-medium'
          : 'sans-serif';

  return { fontFamily };
}

export const fonts = {
  editorial: system('400'),
  editorialItalic: system('400'),
  body: system('400'),
  bodyMedium: system('500'),
  bodySemibold: system('500'),
  bodyBold: system('500'),
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
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
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
  primaryPressed: string;
  onPrimary: string;
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
  background: '#F5F5F7',
  surface: '#FFFFFF',
  surfaceMuted: '#F2F2F7',
  text: '#1D1D1F',
  textSecondary: '#6E6E73',
  textTertiary: '#8E8E93',
  border: '#E5E5EA',
  primary: '#007AFF',
  primaryPressed: '#0066D6',
  onPrimary: '#FFFFFF',
  primarySoft: '#E8F2FF',
  honey: '#FF9500',
  honeySoft: '#FFF4E5',
  suitable: '#007AFF',
  suitableSoft: '#E8F2FF',
  review: '#FF9500',
  reviewSoft: '#FFF4E5',
  avoid: '#FF3B30',
  avoidSoft: '#FFEBEA',
  info: '#007AFF',
  infoSoft: '#E8F2FF',
  danger: '#FF3B30',
  accent: '#AF52DE',
  accentSoft: '#F6E9FB',
  shadow: 'rgba(0, 0, 0, 0.06)',
  overlay: 'rgba(0, 0, 0, 0.4)',
  inverse: '#1D1D1F',
  heroStart: '#1D1D1F',
  heroEnd: '#3A3A3C',
  tabBar: '#F5F5F7',
  sage: '#D1D1D6',
  cream: '#F2F2F7',
  ink: '#1D1D1F',
};

export const darkColors: ColorTokens = {
  background: '#1C1C1E',
  surface: '#2C2C2E',
  surfaceMuted: '#3A3A3C',
  text: '#F5F5F7',
  textSecondary: '#AEAEB2',
  textTertiary: '#8E8E93',
  border: '#3A3A3C',
  primary: '#0A84FF',
  primaryPressed: '#409CFF',
  onPrimary: '#FFFFFF',
  primarySoft: '#1C334D',
  honey: '#FF9F0A',
  honeySoft: '#3D2E14',
  suitable: '#0A84FF',
  suitableSoft: '#1C334D',
  review: '#FF9F0A',
  reviewSoft: '#3D2E14',
  avoid: '#FF453A',
  avoidSoft: '#3D1E1C',
  info: '#64D2FF',
  infoSoft: '#1A333D',
  danger: '#FF453A',
  accent: '#BF5AF2',
  accentSoft: '#3A2444',
  shadow: 'rgba(0, 0, 0, 0.4)',
  overlay: 'rgba(0, 0, 0, 0.62)',
  inverse: '#F5F5F7',
  heroStart: '#2C2C2E',
  heroEnd: '#48484A',
  tabBar: '#1C1C1E',
  sage: '#636366',
  cream: '#3A3A3C',
  ink: '#F5F5F7',
};

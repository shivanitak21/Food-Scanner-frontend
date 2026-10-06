import { Platform, type TextStyle } from 'react-native';

type FontFace = Pick<TextStyle, 'fontFamily' | 'fontWeight'>;

const jakarta = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
} as const;

function face(weight: TextStyle['fontWeight'], androidFamily: string): FontFace {
  if (Platform.OS === 'ios') return { fontWeight: weight };
  return { fontFamily: androidFamily, fontWeight: 'normal' };
}

export const fonts = {
  display: face('700', jakarta.bold),
  displayItalic: face('600', jakarta.semibold),
  body: face('400', jakarta.regular),
  bodyMedium: face('500', jakarta.medium),
  bodySemibold: face('600', jakarta.semibold),
  bodyBold: face('700', jakarta.bold),
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
  background: '#F7F5F0',
  surface: '#FFFcf8',
  surfaceMuted: '#EEE8DC',
  text: '#171713',
  textSecondary: '#5C584F',
  textTertiary: '#8A8478',
  border: '#E6E0D4',
  primary: '#285A43',
  primaryPressed: '#1E4634',
  onPrimary: '#F7F5F0',
  primarySoft: '#E5F3EB',
  honey: '#A67C45',
  honeySoft: '#F6EFE3',
  suitable: '#285A43',
  suitableSoft: '#E5F3EB',
  review: '#A67C45',
  reviewSoft: '#F6EFE3',
  avoid: '#9C4A42',
  avoidSoft: '#F8EBE8',
  info: '#3D5C74',
  infoSoft: '#E8F0F6',
  danger: '#9C4A42',
  shadow: 'rgba(23, 23, 19, 0.06)',
  overlay: 'rgba(23, 23, 19, 0.42)',
  inverse: '#171713',
  heroStart: '#F7F5F0',
  heroEnd: '#E7F3EC',
  tabBar: '#F7F5F0',
  sage: '#A9D8BF',
  cream: '#EEE8DC',
  ink: '#171713',
};

export const darkColors: ColorTokens = {
  background: '#161311',
  surface: '#221E1A',
  surfaceMuted: '#2C2722',
  text: '#F6F1E8',
  textSecondary: '#C4B8AA',
  textTertiary: '#8E8376',
  border: '#3A332C',
  primary: '#9ED4B6',
  primaryPressed: '#C5E6D4',
  onPrimary: '#102117',
  primarySoft: '#24352C',
  honey: '#E2B15A',
  honeySoft: '#3A2E1C',
  suitable: '#9ED4B6',
  suitableSoft: '#24352C',
  review: '#E2B15A',
  reviewSoft: '#3A2E1C',
  avoid: '#F0A097',
  avoidSoft: '#3A2422',
  info: '#B7D0E4',
  infoSoft: '#243038',
  danger: '#F0A097',
  shadow: 'rgba(0, 0, 0, 0.32)',
  overlay: 'rgba(0, 0, 0, 0.62)',
  inverse: '#F6F1E8',
  heroStart: '#24352C',
  heroEnd: '#1C2822',
  tabBar: '#221E1A',
  sage: '#6E9A84',
  cream: '#2C2722',
  ink: '#F6F1E8',
};

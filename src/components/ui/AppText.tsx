import { Text, type TextProps, type TextStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

type Variant = 'editorial' | 'display' | 'title' | 'headline' | 'body' | 'bodyMedium' | 'label' | 'caption' | 'numeric';

const variantStyle: Record<Variant, TextStyle> = {
  editorial: { fontSize: 30, lineHeight: 36, letterSpacing: -1 },
  display: { fontSize: 30, lineHeight: 36, letterSpacing: -0.9 },
  title: { fontSize: 21, lineHeight: 27, letterSpacing: -0.5 },
  headline: { fontSize: 16, lineHeight: 22, letterSpacing: -0.25 },
  body: { fontSize: 15, lineHeight: 22, letterSpacing: -0.1 },
  bodyMedium: { fontSize: 15, lineHeight: 22, letterSpacing: -0.15 },
  label: { fontSize: 12, lineHeight: 16, letterSpacing: 0.3 },
  caption: { fontSize: 13, lineHeight: 18, letterSpacing: -0.05 },
  numeric: { fontSize: 34, lineHeight: 38, letterSpacing: -1.4, fontVariant: ['tabular-nums'] },
};

type Props = TextProps & {
  variant?: Variant;
  color?: string;
};

export function AppText({ variant = 'body', color, style, ...props }: Props) {
  const { colors, fonts } = useTheme();
  const face =
    variant === 'editorial' || variant === 'display' || variant === 'numeric'
      ? fonts.bodyBold
      : variant === 'title' || variant === 'headline' || variant === 'label'
        ? fonts.bodySemibold
        : variant === 'bodyMedium'
          ? fonts.bodyMedium
          : fonts.body;

  return (
    <Text
      maxFontSizeMultiplier={1.4}
      style={[{ color: color ?? colors.text }, face, variantStyle[variant], style]}
      {...props}
    />
  );
}

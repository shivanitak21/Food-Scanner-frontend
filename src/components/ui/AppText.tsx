import { Text, type TextProps, type TextStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

type Variant = 'display' | 'title' | 'headline' | 'body' | 'bodyMedium' | 'label' | 'caption' | 'numeric';

const variantStyle: Record<Variant, TextStyle> = {
  display: { fontSize: 40, lineHeight: 46, letterSpacing: -0.8 },
  title: { fontSize: 32, lineHeight: 38, letterSpacing: -0.5 },
  headline: { fontSize: 18, lineHeight: 24, letterSpacing: -0.2 },
  body: { fontSize: 16, lineHeight: 24 },
  bodyMedium: { fontSize: 15, lineHeight: 22 },
  label: { fontSize: 12, lineHeight: 16, letterSpacing: 0.6, textTransform: 'uppercase' },
  caption: { fontSize: 13, lineHeight: 18 },
  numeric: { fontSize: 28, lineHeight: 32, letterSpacing: -0.6 },
};

type Props = TextProps & {
  variant?: Variant;
  color?: string;
};

export function AppText({ variant = 'body', color, style, ...props }: Props) {
  const { colors, fonts } = useTheme();
  const fontFamily =
    variant === 'display' || variant === 'title'
      ? fonts.display
      : variant === 'numeric' || variant === 'headline' || variant === 'label'
        ? fonts.bodySemibold
        : variant === 'bodyMedium'
          ? fonts.bodyMedium
          : fonts.body;

  return (
    <Text
      maxFontSizeMultiplier={1.4}
      style={[{ color: color ?? colors.text, fontFamily }, variantStyle[variant], style]}
      {...props}
    />
  );
}

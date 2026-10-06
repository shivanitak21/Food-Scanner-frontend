import { Text, type TextProps, type TextStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

type Variant = 'display' | 'title' | 'headline' | 'body' | 'bodyMedium' | 'label' | 'caption' | 'numeric';

const variantStyle: Record<Variant, TextStyle> = {
  display: { fontSize: 36, lineHeight: 42, letterSpacing: -0.4 },
  title: { fontSize: 28, lineHeight: 34, letterSpacing: -0.3 },
  headline: { fontSize: 17, lineHeight: 22, letterSpacing: -0.2 },
  body: { fontSize: 16, lineHeight: 22 },
  bodyMedium: { fontSize: 16, lineHeight: 22 },
  label: { fontSize: 12, lineHeight: 16, letterSpacing: 0.4, textTransform: 'uppercase' },
  caption: { fontSize: 13, lineHeight: 18 },
  numeric: { fontSize: 28, lineHeight: 34, letterSpacing: -0.5 },
};

type Props = TextProps & {
  variant?: Variant;
  color?: string;
};

export function AppText({ variant = 'body', color, style, ...props }: Props) {
  const { colors, fonts } = useTheme();
  const face =
    variant === 'display' || variant === 'title' || variant === 'numeric'
      ? fonts.display
      : variant === 'headline' || variant === 'label'
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

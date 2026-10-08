import { Text, type TextProps, type TextStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

type Variant = 'editorial' | 'display' | 'title' | 'headline' | 'body' | 'bodyMedium' | 'label' | 'caption' | 'numeric';

const variantStyle: Record<Variant, TextStyle> = {
  editorial: { fontSize: 34, lineHeight: 41, letterSpacing: -0.8 },
  display: { fontSize: 34, lineHeight: 41, letterSpacing: -0.6 },
  title: { fontSize: 28, lineHeight: 34, letterSpacing: -0.5 },
  headline: { fontSize: 17, lineHeight: 22, letterSpacing: -0.3 },
  body: { fontSize: 17, lineHeight: 22, letterSpacing: -0.2 },
  bodyMedium: { fontSize: 17, lineHeight: 22, letterSpacing: -0.2 },
  label: { fontSize: 13, lineHeight: 18, letterSpacing: -0.05 },
  caption: { fontSize: 13, lineHeight: 18, letterSpacing: -0.05 },
  numeric: { fontSize: 28, lineHeight: 34, letterSpacing: -0.4 },
};

type Props = TextProps & {
  variant?: Variant;
  color?: string;
};

export function AppText({ variant = 'body', color, style, ...props }: Props) {
  const { colors, fonts } = useTheme();
  const face =
    variant === 'editorial' || variant === 'display' || variant === 'title'
      ? fonts.editorial
      : variant === 'numeric' || variant === 'headline' || variant === 'label' || variant === 'bodyMedium'
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

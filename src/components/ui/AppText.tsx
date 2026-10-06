import { Text, type TextProps, type TextStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

type Variant = 'editorial' | 'display' | 'title' | 'headline' | 'body' | 'bodyMedium' | 'label' | 'caption' | 'numeric';

const variantStyle: Record<Variant, TextStyle> = {
  editorial: { fontSize: 36, lineHeight: 42 },
  display: { fontSize: 34, lineHeight: 41, letterSpacing: 0.4 },
  title: { fontSize: 28, lineHeight: 34, letterSpacing: 0.36 },
  headline: { fontSize: 17, lineHeight: 22, letterSpacing: -0.41 },
  body: { fontSize: 17, lineHeight: 22, letterSpacing: -0.41 },
  bodyMedium: { fontSize: 17, lineHeight: 22, letterSpacing: -0.41 },
  label: { fontSize: 13, lineHeight: 18, letterSpacing: 0.6, textTransform: 'uppercase' },
  caption: { fontSize: 13, lineHeight: 18, letterSpacing: -0.08 },
  numeric: { fontSize: 28, lineHeight: 34, letterSpacing: 0.36 },
};

type Props = TextProps & {
  variant?: Variant;
  color?: string;
};

export function AppText({ variant = 'body', color, style, ...props }: Props) {
  const { colors, fonts } = useTheme();
  const face =
    variant === 'editorial'
      ? fonts.editorial
      : variant === 'display' || variant === 'title' || variant === 'numeric'
        ? fonts.bodyBold
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

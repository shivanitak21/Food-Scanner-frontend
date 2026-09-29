import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

export function NutrientBar({
  value,
  tone = 'neutral',
}: {
  value: number;
  tone?: 'positive' | 'attention' | 'concern' | 'neutral';
}) {
  const { colors, radius } = useTheme();
  const fill = Math.max(6, Math.min(100, value));
  const color =
    tone === 'concern' ? colors.avoid : tone === 'attention' ? colors.review : tone === 'positive' ? colors.suitable : colors.primary;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(fill) }}
      style={[styles.track, { backgroundColor: colors.surfaceMuted, borderRadius: radius.pill }]}
    >
      <View style={[styles.fill, { width: `${fill}%`, backgroundColor: color, borderRadius: radius.pill }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    height: '100%',
  },
});

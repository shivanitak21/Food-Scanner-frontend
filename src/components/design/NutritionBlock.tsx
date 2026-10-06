import { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions, type TextStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { AppText } from '@/components/ui/AppText';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useTheme } from '@/theme/ThemeProvider';
import type { NutritionItem } from '@/types/models';
import { formatAmount, nutrientRatio, orderNutrition, parseAmount } from '@/utils/presentation';

export function NutritionBlock({ items, focus = [] }: { items: NutritionItem[]; focus?: string[] }) {
  const { colors, fonts } = useTheme();
  const { width } = useWindowDimensions();
  const ordered = orderNutrition(items, focus).slice(0, 8);
  const compact = width < 360;
  if (items.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <AppText variant="label" color={colors.textTertiary}>
        Nutrition
      </AppText>
      <View style={styles.grid}>
        {ordered.map((item) => (
          <Metric key={item.id} item={item} compact={compact} valueFont={fonts.bodyBold} />
        ))}
      </View>
    </View>
  );
}

function Metric({
  item,
  compact,
  valueFont,
}: {
  item: NutritionItem;
  compact: boolean;
  valueFont: TextStyle;
}) {
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();
  const amount = parseAmount(item) ?? 0;
  const ratio = nutrientRatio(item.name, amount);
  const progress = useSharedValue(reduceMotion ? ratio : 0);
  const watched = /saturat|sodium|sugar|protein|fiber|fibre/i.test(item.name);

  useEffect(() => {
    progress.value = withTiming(ratio, { duration: reduceMotion ? 0 : 700 });
  }, [progress, ratio, reduceMotion]);

  const bar = useAnimatedStyle(() => ({ width: `${Math.round(progress.value * 100)}%` }));

  return (
    <View style={[styles.metric, compact && styles.metricFull]}>
      <AppText variant="caption" color={colors.textSecondary}>
        {item.name}
      </AppText>
      <AppText variant="title" style={[styles.value, valueFont]}>
        {formatAmount(item)}
      </AppText>
      <View style={[styles.track, { backgroundColor: colors.cream }]}>
        <Animated.View style={[styles.fill, { backgroundColor: watched ? colors.primary : colors.sage }, bar]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  metric: { width: '47%', flexGrow: 1, gap: 6, minWidth: 140 },
  metricFull: { width: '100%' },
  value: { fontSize: 26, lineHeight: 32 },
  track: { height: 4, borderRadius: 2, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2 },
});

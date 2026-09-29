import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { AppText } from '@/components/ui/AppText';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useTheme } from '@/theme/ThemeProvider';
import type { NutritionItem } from '@/types/models';
import { formatAmount, isCalorie, nutrientRatio, parseAmount } from '@/utils/presentation';

export function NutritionBlock({ items }: { items: NutritionItem[] }) {
  const { colors } = useTheme();
  const energy = items.find(isCalorie);
  const rest = items.filter((item) => !isCalorie(item)).slice(0, 6);
  if (items.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <AppText variant="label" color={colors.textTertiary}>
        Nutrition
      </AppText>
      {energy ? (
        <View>
          <AppText variant="numeric">{formatAmount(energy).replace(/\s*kcal/i, '')}</AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            kcal
          </AppText>
        </View>
      ) : null}
      <View style={styles.list}>
        {rest.map((item) => (
          <Metric key={item.id} item={item} />
        ))}
      </View>
    </View>
  );
}

function Metric({ item }: { item: NutritionItem }) {
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();
  const amount = parseAmount(item) ?? 0;
  const ratio = nutrientRatio(item.name, amount);
  const progress = useSharedValue(reduceMotion ? ratio : 0);

  useEffect(() => {
    progress.value = withTiming(ratio, { duration: reduceMotion ? 0 : 700 });
  }, [progress, ratio, reduceMotion]);

  const bar = useAnimatedStyle(() => ({ width: `${Math.round(progress.value * 100)}%` }));
  const emphasize = /saturat|sodium|sugar/i.test(item.name);

  return (
    <View style={styles.metric}>
      <View style={styles.metricTop}>
        <AppText variant="body" color={colors.text}>
          {item.name}
        </AppText>
        <AppText variant="bodyMedium">{formatAmount(item)}</AppText>
      </View>
      <View style={[styles.track, { backgroundColor: colors.cream }]}>
        <Animated.View style={[styles.fill, { backgroundColor: emphasize ? colors.primary : colors.sage }, bar]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  list: { gap: 14 },
  metric: { gap: 8 },
  metricTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  track: { height: 4, borderRadius: 2, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2 },
});

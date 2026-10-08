import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { AppText } from '@/components/ui/AppText';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useTheme, type Theme } from '@/theme/ThemeProvider';
import type { NutritionItem } from '@/types/models';
import { formatAmount, nutrientIcon, nutrientRatio, orderNutrition, parseAmount } from '@/utils/presentation';

export function NutritionBlock({ items, focus = [] }: { items: NutritionItem[]; focus?: string[] }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const ordered = orderNutrition(items, focus);
  const visible = open ? ordered : ordered.slice(0, 4);
  if (items.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <AppText variant="title">Nutritional overview</AppText>
      <View style={styles.grid}>
        {visible.map((item) => (
          <Metric key={item.id} item={item} relevant={isRelevant(item, focus)} />
        ))}
      </View>
      {ordered.length > 4 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          onPress={() => setOpen((value) => !value)}
          style={styles.more}
        >
          <AppText variant="bodyMedium" color={colors.primary}>
            {open ? 'Show fewer nutrients' : `Show ${ordered.length - 4} more`}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

function isRelevant(item: NutritionItem, focus: string[]): boolean {
  const name = item.name.toLowerCase();
  return focus.some((key) => {
    const value = key.toLowerCase();
    return value.length > 0 && (name.includes(value) || value.includes(name));
  });
}

function palette(name: string, colors: Theme['colors']) {
  const value = name.toLowerCase();
  if (/calorie|energy|kcal/.test(value)) return { fg: colors.avoid, bg: colors.avoidSoft };
  if (/protein/.test(value)) return { fg: colors.info, bg: colors.infoSoft };
  if (/carb/.test(value)) return { fg: colors.accent, bg: colors.accentSoft };
  if (/sugar/.test(value)) return { fg: colors.avoid, bg: colors.avoidSoft };
  if (/fat|sodium|salt|saturat/.test(value)) return { fg: colors.review, bg: colors.reviewSoft };
  return { fg: colors.primary, bg: colors.primarySoft };
}

function Metric({ item, relevant }: { item: NutritionItem; relevant: boolean }) {
  const { colors, radius } = useTheme();
  const { width } = useWindowDimensions();
  const reduceMotion = useReduceMotion();
  const amount = parseAmount(item) ?? 0;
  const hasDailyValue = typeof item.dailyValuePercent === 'number' && Number.isFinite(item.dailyValuePercent);
  const ratio = hasDailyValue ? Math.max(0.04, Math.min(1, (item.dailyValuePercent ?? 0) / 100)) : nutrientRatio(item.name, amount);
  const progress = useSharedValue(reduceMotion ? ratio : 0);
  const tone = palette(item.name, colors);
  const compact = width < 360;

  useEffect(() => {
    progress.value = withTiming(ratio, { duration: reduceMotion ? 0 : 700 });
  }, [progress, ratio, reduceMotion]);

  const bar = useAnimatedStyle(() => ({ width: `${Math.round(progress.value * 100)}%` }));

  return (
    <View
      style={[
        styles.card,
        compact && styles.cardFull,
        {
          backgroundColor: colors.surface,
          borderColor: relevant ? tone.fg : colors.border,
          borderRadius: radius.lg,
          boxShadow: `0 8px 24px ${colors.shadow}`,
        },
      ]}
    >
      <View style={styles.cardHead}>
        <View style={[styles.icon, { backgroundColor: tone.bg }]}>
          <Ionicons name={nutrientIcon(item.name)} size={16} color={tone.fg} />
        </View>
        <AppText variant="caption" color={colors.textSecondary} style={styles.name}>
          {item.name}
        </AppText>
      </View>
      <AppText variant="title">{formatAmount(item)}</AppText>
      <View style={[styles.track, { backgroundColor: colors.surfaceMuted }]}>
        <Animated.View style={[styles.fill, { backgroundColor: relevant ? tone.fg : colors.sage }, bar]} />
      </View>
      {hasDailyValue ? (
        <AppText variant="caption" color={colors.textTertiary}>
          {`${Math.round(item.dailyValuePercent ?? 0)}% daily value`}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '47%', flexGrow: 1, minWidth: 148, gap: 8, padding: 16, borderWidth: 1 },
  cardFull: { width: '100%' },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  name: { flex: 1 },
  track: { height: 4, borderRadius: 2, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2 },
  more: { minHeight: 44, justifyContent: 'center' },
});

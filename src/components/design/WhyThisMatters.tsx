import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme/ThemeProvider';

type Point = {
  id: string;
  title: string;
  measure: string | null;
  reason: string;
};

type Props = {
  name: string;
  points: Point[];
  onExplain?: () => void;
};

export function WhyThisMatters({ name, points, onExplain }: Props) {
  const { colors, radius } = useTheme();
  const [open, setOpen] = useState(false);
  if (points.length === 0) return null;
  const shown = open ? points : points.slice(0, 1);

  return (
    <View style={[styles.wrap, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((value) => !value)}
        style={styles.head}
      >
        <View style={styles.copy}>
          <AppText variant="title">Why this matters</AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            {name}
          </AppText>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textTertiary} />
      </Pressable>
      {shown.map((point) => (
        <View key={point.id} style={styles.point}>
          <AppText variant="headline">{point.title}</AppText>
          {point.measure ? (
            <AppText variant="caption" color={colors.textSecondary}>
              {point.measure}
            </AppText>
          ) : null}
          <AppText variant="body" color={colors.textSecondary} numberOfLines={open ? undefined : 2}>
            {point.reason}
          </AppText>
        </View>
      ))}
      {onExplain ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Why am I seeing this?" onPress={onExplain} style={styles.link}>
          <AppText variant="bodyMedium" color={colors.primary}>
            Why am I seeing this?
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10, padding: 16, borderWidth: StyleSheet.hairlineWidth },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  copy: { flex: 1, gap: 2 },
  point: { gap: 2 },
  link: { minHeight: 44, justifyContent: 'center' },
});

import { Pressable, StyleSheet, View } from 'react-native';

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
  if (points.length === 0) return null;

  return (
    <View style={[styles.wrap, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
      <AppText variant="label" color={colors.textTertiary}>
        Why this matters
      </AppText>
      <AppText variant="title">{name}</AppText>
      {points.map((point) => (
        <View key={point.id} style={styles.point}>
          <AppText variant="headline">{point.title}</AppText>
          {point.measure ? (
            <AppText variant="bodyMedium" color={colors.textSecondary}>
              {point.measure}
            </AppText>
          ) : null}
          <AppText variant="body" color={colors.textSecondary}>
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
  wrap: { gap: 10, padding: 20, borderWidth: 1 },
  point: { gap: 2, paddingTop: 4 },
  link: { minHeight: 44, justifyContent: 'center' },
});

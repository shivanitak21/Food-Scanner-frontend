import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme/ThemeProvider';
import type { AnalysisStatus } from '@/types/models';
import { statusLabel } from '@/utils/presentation';

const icons: Record<AnalysisStatus, keyof typeof Ionicons.glyphMap> = {
  suitable: 'checkmark-circle',
  review: 'alert-circle',
  avoid: 'alert-circle',
};

export function StatusBadge({ status, label }: { status: AnalysisStatus; label?: string }) {
  const { colors, radius } = useTheme();
  const palette = {
    suitable: { fg: colors.suitable, bg: colors.suitableSoft },
    review: { fg: colors.review, bg: colors.reviewSoft },
    avoid: { fg: colors.avoid, bg: colors.avoidSoft },
  }[status];

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={label ?? statusLabel(status)}
      style={[styles.badge, { backgroundColor: palette.bg, borderRadius: radius.pill }]}
    >
      <Ionicons name={icons[status]} size={14} color={palette.fg} />
      <AppText variant="caption" color={palette.fg} style={styles.label}>
        {label ?? statusLabel(status)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '100%',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  label: {
    flexShrink: 1,
    letterSpacing: 0.2,
    textTransform: 'none',
    fontSize: 13,
  },
});

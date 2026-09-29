import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme/ThemeProvider';
import type { AnalysisStatus } from '@/types/models';
import { statusLabel } from '@/utils/presentation';

export function StatusMark({ status, label }: { status: AnalysisStatus; label?: string }) {
  const { colors } = useTheme();
  const color = status === 'suitable' ? colors.suitable : status === 'avoid' ? colors.avoid : colors.review;
  const text = label ?? statusLabel(status);

  return (
    <View style={styles.row} accessibilityLabel={text}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      {text ? (
        <AppText variant="bodyMedium" color={colors.text}>
          {text}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 24 },
  dot: { width: 7, height: 7, borderRadius: 4 },
});

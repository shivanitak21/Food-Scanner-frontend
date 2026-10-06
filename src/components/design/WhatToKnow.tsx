import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme/ThemeProvider';
import type { ProductSignal } from '@/utils/presentation';

export function WhatToKnow({ signal }: { signal: ProductSignal }) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrap}>
      <AppText variant="label" color={colors.textTertiary}>
        What to know
      </AppText>
      {signal.amount ? (
          <AppText variant="editorial" style={styles.amount}>
          {signal.amount}
        </AppText>
      ) : null}
      <AppText variant={signal.amount ? 'headline' : 'title'}>{signal.title}</AppText>
      {signal.basis ? (
        <AppText variant="caption" color={colors.textSecondary}>
          {signal.basis}
        </AppText>
      ) : null}
      {signal.notes.length > 0 ? (
        <View style={styles.notes}>
          {signal.notes.map((note) => (
            <AppText key={note} variant="body" color={colors.textSecondary}>
              {note}
            </AppText>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6, paddingTop: 8 },
  amount: { fontSize: 48, lineHeight: 54 },
  notes: { gap: 4, marginTop: 8 },
});

import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useTheme } from '@/theme/ThemeProvider';

const steps = ['Reading ingredients', 'Checking nutrition', 'Reviewing family profiles'];

export function AnalysisLoader({ subtitle }: { subtitle?: string }) {
  const { colors, radius } = useTheme();
  const reduceMotion = useReduceMotion();
  const [active, setActive] = useState(reduceMotion ? 2 : 0);

  useEffect(() => {
    if (reduceMotion) return;
    const timers = [700, 1500].map((delay, index) => setTimeout(() => setActive(index + 1), delay));
    return () => timers.forEach(clearTimeout);
  }, [reduceMotion]);

  return (
    <View style={styles.wrap} accessibilityRole="progressbar" accessibilityLabel="Analyzing your food">
      <View style={[styles.mark, { backgroundColor: colors.primarySoft, borderRadius: radius.xl }]}>
        <Ionicons name="sparkles-outline" size={28} color={colors.primary} />
      </View>
      <AppText variant="title" style={styles.center}>
        Analyzing your food
      </AppText>
      {subtitle ? (
        <AppText variant="caption" color={colors.textSecondary} style={styles.center}>
          {subtitle}
        </AppText>
      ) : null}
      <View style={styles.list}>
        {steps.map((step, index) => {
          const done = index < active;
          const current = index === active;
          return (
            <View key={step} style={styles.row}>
              <Ionicons
                name={done ? 'checkmark-circle' : current ? 'ellipse' : 'ellipse-outline'}
                size={18}
                color={done || current ? colors.primary : colors.textTertiary}
              />
              <AppText variant="body" color={done || current ? colors.text : colors.textTertiary}>
                {step}
              </AppText>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  mark: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  center: { textAlign: 'center' },
  list: { alignSelf: 'stretch', gap: 14, marginTop: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});

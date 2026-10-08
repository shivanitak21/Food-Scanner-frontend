import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { AppText } from '@/components/ui/AppText';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useTheme } from '@/theme/ThemeProvider';

const steps = ['Reading the package', 'Checking ingredients', 'Comparing nutrition', 'Preparing family insights'];

export function AnalysisLoader({ subtitle }: { subtitle?: string }) {
  const { colors, radius } = useTheme();
  const reduceMotion = useReduceMotion();
  const [active, setActive] = useState(reduceMotion ? steps.length - 1 : 0);

  useEffect(() => {
    if (reduceMotion) return;
    const timers = [600, 1200, 1900].map((delay, index) => setTimeout(() => setActive(index + 1), delay));
    return () => timers.forEach(clearTimeout);
  }, [reduceMotion]);

  return (
    <View style={styles.wrap} accessibilityRole="progressbar" accessibilityLabel="Analyzing your food">
      <View style={[styles.mark, { backgroundColor: colors.primarySoft, borderRadius: radius.xl }]}>
        <Ionicons name="scan-outline" size={28} color={colors.primary} />
      </View>
      <AppText variant="title" style={styles.center}>
        Analyzing your food
      </AppText>
      {subtitle ? (
        <AppText variant="caption" color={colors.textSecondary} style={styles.center}>
          {subtitle}
        </AppText>
      ) : null}
      <SkeletonRows />
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

function SkeletonRows() {
  const { colors, radius } = useTheme();
  const reduceMotion = useReduceMotion();
  const opacity = useSharedValue(reduceMotion ? 0.7 : 0.4);

  useEffect(() => {
    if (reduceMotion) return;
    opacity.value = withRepeat(withTiming(0.9, { duration: 800 }), -1, true);
  }, [opacity, reduceMotion]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.skeleton, style]}>
      {[0.86, 0.62, 0.74].map((width) => (
        <View key={width} style={[styles.bone, { width: `${width * 100}%`, backgroundColor: colors.surfaceMuted, borderRadius: radius.sm }]} />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  mark: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  center: { textAlign: 'center' },
  list: { alignSelf: 'stretch', gap: 14, marginTop: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  skeleton: { alignSelf: 'stretch', gap: 10, marginTop: 8 },
  bone: { height: 12 },
});

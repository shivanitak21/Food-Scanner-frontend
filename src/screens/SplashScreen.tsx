import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';

import { AppText } from '@/components/ui/AppText';
import { BrandMark } from '@/components/ui/BrandMark';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useTheme } from '@/theme/ThemeProvider';

export function SplashScreen() {
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();
  const logo = useSharedValue(reduceMotion ? 1 : 0);
  const name = useSharedValue(reduceMotion ? 1 : 0);
  const pulse = useSharedValue(reduceMotion ? 1 : 0.92);

  useEffect(() => {
    if (reduceMotion) return;
    logo.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
    name.value = withDelay(520, withTiming(1, { duration: 480, easing: Easing.out(Easing.cubic) }));
    pulse.value = withDelay(900, withRepeat(withTiming(1.08, { duration: 900, easing: Easing.inOut(Easing.sin) }), 2, true));
  }, [logo, name, pulse, reduceMotion]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logo.value,
    transform: [{ scale: 0.96 + logo.value * 0.04 }],
  }));
  const nameStyle = useAnimatedStyle(() => ({ opacity: name.value }));
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.28 * name.value,
    transform: [{ scale: pulse.value }],
  }));

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <View style={styles.stage}>
        <Animated.View style={[styles.pulse, { borderColor: colors.sage }, pulseStyle]} />
        <Animated.View style={logoStyle}>
          <BrandMark size={84} />
        </Animated.View>
      </View>
      <Animated.View style={[styles.copy, nameStyle]}>
        <AppText variant="display">FoodLens</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Know what's inside.
        </AppText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 28 },
  stage: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center' },
  pulse: { position: 'absolute', width: 132, height: 132, borderRadius: 66, borderWidth: 1 },
  copy: { alignItems: 'center', gap: 6 },
});

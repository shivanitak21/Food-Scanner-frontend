import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { BrandMark } from '@/components/ui/BrandMark';
import { glassSurface } from '@/components/ui/Glass';
import { AppWash } from '@/components/ui/Screen';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useTheme } from '@/theme/ThemeProvider';

const MARK_SIZE = 120;

const BUBBLES = [
  { icon: 'nutrition-outline', x: -118, y: -92, delay: 620 },
  { icon: 'leaf-outline', x: 116, y: -48, delay: 760 },
  { icon: 'people-outline', x: -92, y: 104, delay: 900 },
] as const;

export function SplashScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const start = reduceMotion ? 1 : 0;
  const logo = useSharedValue(start);
  const glow = useSharedValue(start);
  const ringA = useSharedValue(0);
  const ringB = useSharedValue(0);
  const copy = useSharedValue(start);
  const bubbles = useSharedValue(start);
  const progress = useSharedValue(reduceMotion ? 0.5 : 0);

  useEffect(() => {
    if (reduceMotion) return;
    logo.value = withSpring(1, { damping: 14, stiffness: 120 });
    glow.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
    ringA.value = withDelay(350, withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), -1));
    ringB.value = withDelay(1250, withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), -1));
    bubbles.value = withDelay(500, withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }));
    copy.value = withDelay(450, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }));
    progress.value = withDelay(
      600,
      withRepeat(
        withSequence(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.cubic) }), withTiming(0, { duration: 0 })),
        -1,
      ),
    );
  }, [bubbles, copy, glow, logo, progress, reduceMotion, ringA, ringB]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + logo.value * 0.08 }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: 0.7 + glow.value * 0.3 }],
  }));
  const ringAStyle = useAnimatedStyle(() => ({
    opacity: 0.45 * (1 - ringA.value),
    transform: [{ scale: 1 + ringA.value * 0.9 }],
  }));
  const ringBStyle = useAnimatedStyle(() => ({
    opacity: 0.45 * (1 - ringB.value),
    transform: [{ scale: 1 + ringB.value * 0.9 }],
  }));
  const copyStyle = useAnimatedStyle(() => ({
    opacity: copy.value,
    transform: [{ translateY: (1 - copy.value) * 14 }],
  }));
  const barStyle = useAnimatedStyle(() => ({
    left: `${progress.value * 70 - 30}%`,
  }));

  return (
    <AppWash>
      <View style={styles.fill}>
        <View style={styles.stage}>
          <Animated.View style={[styles.glow, glowStyle]} pointerEvents="none">
            {[280, 220, 168].map((size, index) => (
              <LinearGradient
                key={size}
                colors={[`${colors.primaryStart}${['14', '1F', '2E'][index]}`, `${colors.accent}${['14', '1F', '2E'][index]}`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.halo, { width: size, height: size, borderRadius: size / 2 }]}
              />
            ))}
          </Animated.View>
          <Animated.View style={[styles.ring, { borderColor: colors.primary }, ringAStyle]} />
          <Animated.View style={[styles.ring, { borderColor: colors.accent }, ringBStyle]} />
          {BUBBLES.map((bubble) => (
            <Bubble key={bubble.icon} {...bubble} progress={bubbles} />
          ))}
          <Animated.View style={logoStyle}>
            <BrandMark size={MARK_SIZE} />
          </Animated.View>
        </View>

        <Animated.View style={[styles.copy, copyStyle]}>
          <AppText variant="display" style={styles.wordmark}>
            Food<AppText variant="display" color={colors.primary} style={styles.wordmark}>Lens</AppText>
          </AppText>
          <AppText variant="body" color={colors.textSecondary}>
            Know what’s inside.
          </AppText>
        </Animated.View>
      </View>

      <Animated.View style={[styles.footer, { paddingBottom: insets.bottom + 36 }, copyStyle]}>
        <View style={[styles.track, { backgroundColor: colors.glassFill, borderColor: colors.glassBorder }]}>
          <Animated.View style={[styles.bar, barStyle]}>
            <LinearGradient
              colors={[colors.primaryStart, colors.primaryEnd, colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
        <AppText variant="label" color={colors.textTertiary}>
          Smart labels for the whole family
        </AppText>
      </Animated.View>
    </AppWash>
  );
}

function Bubble({
  icon,
  x,
  y,
  delay,
  progress,
}: {
  icon: (typeof BUBBLES)[number]['icon'];
  x: number;
  y: number;
  delay: number;
  progress: SharedValue<number>;
}) {
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();
  const float = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    float.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
  }, [delay, float, reduceMotion]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateX: x * (0.6 + progress.value * 0.4) },
      { translateY: y * (0.6 + progress.value * 0.4) + float.value * -6 },
      { scale: 0.7 + progress.value * 0.3 },
    ],
  }));

  return (
    <Animated.View style={[styles.bubble, glassSurface(colors), { backgroundColor: colors.glassStrong }, style]}>
      <Ionicons name={icon} size={20} color={colors.accent} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 36 },
  stage: { width: 300, height: 300, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute' },
  ring: { position: 'absolute', width: MARK_SIZE + 24, height: MARK_SIZE + 24, borderRadius: 44, borderWidth: 1.5 },
  bubble: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { alignItems: 'center', gap: 6 },
  wordmark: { fontSize: 38, lineHeight: 44, letterSpacing: -1.2 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', gap: 12 },
  track: { width: 120, height: 6, borderRadius: 3, overflow: 'hidden', borderWidth: 1 },
  bar: { position: 'absolute', top: 0, bottom: 0, width: '45%', borderRadius: 3, overflow: 'hidden' },
});

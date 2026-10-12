import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/ui/AppText';
import { useReduceMotion } from '@/hooks/useReduceMotion';

export function ScanLine({ height }: { height: number }) {
  const reduceMotion = useReduceMotion();
  const offset = useSharedValue(12);

  useEffect(() => {
    if (reduceMotion) {
      offset.value = height / 2;
      return;
    }
    offset.value = 12;
    offset.value = withRepeat(
      withTiming(Math.max(12, height - 16), { duration: 1700, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [height, offset, reduceMotion]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.line, style]}>
      <LinearGradient colors={['rgba(255,154,92,0)', 'rgba(255,154,92,0.28)']} style={styles.trail} />
      <LinearGradient
        colors={['rgba(255,154,92,0)', '#FFB38A', '#FFFFFF', '#B9AEFF', 'rgba(124,107,242,0)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.beam}
      />
    </Animated.View>
  );
}

export function ScanReticle({ size = 220 }: { size?: number }) {
  const reduceMotion = useReduceMotion();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) return;
    scale.value = withRepeat(withTiming(1.05, { duration: 1400, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [reduceMotion, scale]);

  const pulse = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View pointerEvents="none" style={{ width: size, height: size }}>
      <Animated.View style={[ring(size, size, 1.5), pulse]} />
      <View style={ring(size * 0.72, size, 1)} />
      <View style={[ring(size * 0.18, size, 2), styles.core]} />
    </View>
  );
}

export function FocusRings({ size = 280 }: { size?: number }) {
  const reduceMotion = useReduceMotion();
  const spin = useSharedValue(0);
  const breathe = useSharedValue(0);
  const ping = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    spin.value = withRepeat(withTiming(1, { duration: 9000, easing: Easing.linear }), -1);
    breathe.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }), -1, true);
    ping.value = withRepeat(
      withSequence(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 0 })),
      -1,
    );
  }, [breathe, ping, reduceMotion, spin]);

  const spinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value * 360}deg` }] }));
  const counterStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${-spin.value * 540}deg` }] }));
  const breatheStyle = useAnimatedStyle(() => ({ transform: [{ scale: 0.96 + breathe.value * 0.06 }] }));
  const pingStyle = useAnimatedStyle(() => ({
    opacity: 0.6 * (1 - ping.value),
    transform: [{ scale: 0.55 + ping.value * 0.5 }],
  }));

  const inner = size * 0.64;
  const core = size * 0.2;

  return (
    <View pointerEvents="none" style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[ring(size, size, 1), styles.softRing, pingStyle]} />
      <Animated.View style={[ring(size * 0.92, size, 1), spinStyle, styles.dashed]} />
      <Animated.View style={[ring(size * 0.92, size, 2.5), spinStyle, styles.arc]} />
      <Animated.View style={[ring(inner, size, 1.5), breatheStyle]} />
      <Animated.View style={[ring(inner * 0.86, size, 2), counterStyle, styles.arcSmall]} />
      <View style={[styles.focus, { width: core, height: core, borderRadius: core * 0.32 }]}>
        <Ionicons name="scan-outline" size={core * 0.55} color="#FFFFFF" />
      </View>
    </View>
  );
}

function ring(diameter: number, box: number, width: number) {
  const offset = (box - diameter) / 2;
  return {
    position: 'absolute' as const,
    top: offset,
    left: offset,
    width: diameter,
    height: diameter,
    borderRadius: diameter / 2,
    borderWidth: width,
    borderColor: 'rgba(255, 255, 255, 0.92)',
  };
}

export function ScanningPill({ label }: { label: string }) {
  const reduceMotion = useReduceMotion();
  const glow = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) return;
    glow.value = withRepeat(withTiming(0.45, { duration: 900, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [glow, reduceMotion]);

  const sparkle = useAnimatedStyle(() => ({ opacity: glow.value, transform: [{ scale: 0.85 + glow.value * 0.2 }] }));

  return (
    <View style={styles.pill} accessibilityRole="text" accessibilityLabel={label}>
      <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
      <Animated.View style={sparkle}>
        <Ionicons name="sparkles" size={15} color="#FFFFFF" />
      </Animated.View>
      <AppText variant="bodyMedium" color="#FFFFFF" style={styles.pillLabel} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

export function GlassShutter({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.shutter, pressed && styles.pressed]}
    >
      <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
      <View style={styles.shutterInner}>
        <LinearGradient
          pointerEvents="none"
          colors={['#FFFFFF', '#EEF0FF']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
    </Pressable>
  );
}

export function ScanModes({
  mode,
  onBarcode,
  onLabel,
}: {
  mode: 'barcode' | 'label';
  onBarcode: () => void;
  onLabel: () => void;
}) {
  return (
    <View style={styles.modes} accessibilityRole="tablist">
      <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
      <ModeChip label="Barcode" icon="barcode-outline" active={mode === 'barcode'} onPress={onBarcode} />
      <ModeChip label="Label" icon="document-text-outline" active={mode === 'label'} onPress={onLabel} />
    </View>
  );
}

function ModeChip({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.chip, { backgroundColor: active ? '#FFFFFF' : 'transparent' }]}
    >
      <Ionicons name={icon} size={16} color={active ? '#241B38' : '#FFFFFF'} />
      <AppText variant="bodyMedium" color={active ? '#241B38' : '#FFFFFF'} style={styles.chipLabel}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function CameraIconButton({
  label,
  icon,
  onPress,
  active = false,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, active && styles.iconActive, pressed && styles.pressed]}
    >
      {active ? null : <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />}
      <Ionicons name={icon} size={21} color={active ? '#241B38' : '#FFFFFF'} />
    </Pressable>
  );
}

const glassEdge = {
  overflow: 'hidden' as const,
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.45)',
  backgroundColor: 'rgba(255, 255, 255, 0.16)',
};

const styles = StyleSheet.create({
  line: { position: 'absolute', top: 0, left: 14, right: 14, height: 3 },
  trail: { position: 'absolute', left: 0, right: 0, bottom: 1, height: 36 },
  beam: { height: 3, borderRadius: 2, boxShadow: '0 0 12px rgba(255, 154, 92, 0.9)' },
  core: { backgroundColor: 'rgba(255, 255, 255, 0.28)' },
  softRing: { borderColor: 'rgba(255, 255, 255, 0.55)' },
  dashed: { borderStyle: 'dashed', borderColor: 'rgba(255, 255, 255, 0.45)' },
  arc: {
    borderColor: 'transparent',
    borderTopColor: '#FFFFFF',
    borderRightColor: 'rgba(255, 255, 255, 0.6)',
  },
  arcSmall: {
    borderColor: 'transparent',
    borderBottomColor: '#FFB07A',
    borderLeftColor: 'rgba(255, 176, 122, 0.5)',
  },
  focus: {
    ...glassEdge,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1.5,
  },
  pill: {
    ...glassEdge,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  pillLabel: { fontSize: 14 },
  shutter: {
    ...glassEdge,
    width: 88,
    height: 88,
    borderRadius: 44,
    padding: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    boxShadow: '0 10px 30px rgba(20, 14, 40, 0.28)',
  },
  shutterInner: {
    flex: 1,
    borderRadius: 36,
    overflow: 'hidden',
    boxShadow: '0 4px 14px rgba(124, 107, 242, 0.35)',
  },
  pressed: { transform: [{ scale: 0.94 }], opacity: 0.9 },
  modes: {
    ...glassEdge,
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 4,
    padding: 4,
    borderRadius: 999,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  chipLabel: { fontSize: 14 },
  iconButton: {
    ...glassEdge,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconActive: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
});

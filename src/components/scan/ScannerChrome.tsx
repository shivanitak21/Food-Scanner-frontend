import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

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

  return <Animated.View pointerEvents="none" style={[styles.line, style]} />;
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
      <ModeChip label="Barcode" active={mode === 'barcode'} onPress={onBarcode} />
      <ModeChip label="Label" active={mode === 'label'} onPress={onLabel} />
    </View>
  );
}

function ModeChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.chip, { backgroundColor: active ? '#F7FBF8' : 'rgba(16, 21, 19, 0.45)' }]}
    >
      <AppText variant="caption" color={active ? '#1E4D3A' : '#F7FBF8'} style={styles.chipLabel}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function CameraIconButton({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.iconButton}>
      <Ionicons name={icon} size={22} color="#F7FBF8" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  line: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 2,
    borderRadius: 2,
    backgroundColor: '#D7F3E4',
  },
  modes: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 8,
    padding: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(16, 21, 19, 0.35)',
  },
  chip: {
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLabel: {
    textTransform: 'none',
    letterSpacing: 0,
    fontSize: 13,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(16, 21, 19, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

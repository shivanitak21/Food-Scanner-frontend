import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FocusRings, ScanningPill } from '@/components/scan/ScannerChrome';
import { AppText } from '@/components/ui/AppText';
import { glassSurface } from '@/components/ui/Glass';
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
      <View
        style={[
          styles.card,
          {
            ...glassSurface(colors),
            borderRadius: radius.xl,
            boxShadow: `0 16px 40px ${colors.shadow}`,
          },
        ]}
      >
        <View style={[styles.mark, { backgroundColor: colors.accentSoft, borderRadius: radius.pill }]}>
          <Ionicons name="scan-outline" size={26} color={colors.accent} />
        </View>
        <AppText variant="title" style={styles.center}>
          AI is analyzing
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color={colors.textSecondary} style={styles.center}>
            {subtitle}
          </AppText>
        ) : (
          <AppText variant="caption" color={colors.textSecondary} style={styles.center}>
            Checking this food for you
          </AppText>
        )}
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
    </View>
  );
}

export type ChecklistItem = { label: string; state: 'done' | 'current' | 'waiting' };

export function ScanChecklist({
  title,
  subtitle,
  items,
  live = true,
}: {
  title: string;
  subtitle?: string | null;
  items: ChecklistItem[];
  live?: boolean;
}) {
  const { colors, mode } = useTheme();
  return (
    <View style={[styles.sheet, { backgroundColor: mode === 'dark' ? 'rgba(30,26,44,0.55)' : 'rgba(255,255,255,0.55)' }]}>
      <BlurView intensity={60} tint={mode === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <LinearGradient
        pointerEvents="none"
        colors={[colors.glassHighlight, 'rgba(255,255,255,0)']}
        locations={[0, 0.5]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.sheetHead}>
        <AppText variant="headline">{title}</AppText>
        {subtitle ? (
          <AppText variant="caption" color={colors.textSecondary}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <View style={styles.sheetList}>
        {items.map((item) => (
          <View key={item.label} style={styles.row}>
            {item.state === 'done' ? (
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.primary} />
            ) : item.state === 'current' && live ? (
              <ActivityIndicator size="small" color={colors.primary} style={styles.spinner} />
            ) : item.state === 'current' ? (
              <Ionicons name="radio-button-on" size={20} color={colors.primary} />
            ) : (
              <Ionicons name="ellipse-outline" size={20} color={colors.textTertiary} />
            )}
            <AppText
              variant={item.state === 'current' ? 'bodyMedium' : 'body'}
              color={item.state === 'waiting' ? colors.textTertiary : colors.text}
              style={styles.rowLabel}
            >
              {item.label}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

const ANALYZING_STEPS = [
  'Reading the package',
  'Detecting ingredients',
  'Checking allergens',
  'Estimating nutrition',
  'Preparing family insights',
];

export function ScanAnalyzing({ imageUri, subtitle }: { imageUri?: string; subtitle?: string }) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const [active, setActive] = useState(reduceMotion ? ANALYZING_STEPS.length - 1 : 0);

  useEffect(() => {
    if (reduceMotion) return;
    const timers = [700, 1500, 2300, 3200].map((delay, index) => setTimeout(() => setActive(index + 1), delay));
    return () => timers.forEach(clearTimeout);
  }, [reduceMotion]);

  return (
    <View style={styles.overlay} accessibilityRole="progressbar" accessibilityLabel="Analyzing your food">
      {imageUri ? <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(12,10,22,0.45)', 'rgba(12,10,22,0.05)', 'rgba(12,10,22,0.35)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.overlayTop, { paddingTop: insets.top + 12 }]}>
        <ScanningPill label="Scanning..." />
      </View>
      <View style={styles.overlayCenter}>
        <FocusRings size={260} />
      </View>
      <View style={[styles.overlayBottom, { paddingBottom: insets.bottom + 24 }]}>
        <ScanChecklist
          title="AI is analyzing..."
          subtitle={subtitle}
          items={ANALYZING_STEPS.map((label, index) => ({
            label,
            state: index < active ? 'done' : index === active ? 'current' : 'waiting',
          }))}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill },
  overlayTop: { alignItems: 'center' },
  overlayCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  overlayBottom: { paddingHorizontal: 18 },
  sheet: {
    overflow: 'hidden',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 12,
    boxShadow: '0 18px 40px rgba(20, 14, 40, 0.25)',
  },
  sheetHead: { gap: 2 },
  sheetList: { gap: 11 },
  rowLabel: { flex: 1 },
  spinner: { width: 20, height: 20 },
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { alignSelf: 'stretch', alignItems: 'center', gap: 12, paddingHorizontal: 22, paddingVertical: 28 },
  mark: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  center: { textAlign: 'center' },
  list: { alignSelf: 'stretch', gap: 14, marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});

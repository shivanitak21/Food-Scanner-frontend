import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { AppText } from '@/components/ui/AppText';
import { BrandMark } from '@/components/ui/BrandMark';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { authIntent } from '@/state/authIntent';
import { useSettingsStore } from '@/state/settingsStore';
import { useTheme } from '@/theme/ThemeProvider';

const slides = [
  {
    icon: 'camera-outline' as const,
    title: 'Scan a product',
    message: 'Photograph the package. We ask for another photo only when something is still missing.',
  },
  {
    icon: 'barcode-outline' as const,
    title: 'Barcode is optional',
    message: 'A barcode can look the product up faster. If it is missing, we read the package.',
  },
  {
    icon: 'people-outline' as const,
    title: 'Reviewed for your family',
    message: 'Add each person once. Every product is checked against all of them.',
  },
];

export function OnboardingScreen() {
  const { colors, radius } = useTheme();
  const completeOnboarding = useSettingsStore((state) => state.completeOnboarding);
  const [index, setIndex] = useState(0);
  const slide = slides[index];
  const last = index === slides.length - 1;

  const finish = (start: 'Login' | 'Register') => {
    authIntent.set(start);
    completeOnboarding();
  };

  return (
    <Screen
      edges={['top', 'left', 'right', 'bottom']}
      footer={
        <View style={styles.footer}>
          {last ? (
            <>
              <Button label="Create account" onPress={() => finish('Register')} />
              <Button label="I already have an account" variant="secondary" onPress={() => finish('Login')} />
            </>
          ) : (
            <>
              <Button label="Continue" onPress={() => setIndex((value) => value + 1)} />
              <Button label="Skip" variant="ghost" onPress={() => finish('Login')} />
            </>
          )}
        </View>
      }
    >
      <View style={styles.body}>
        <BrandMark />
        <View style={[styles.icon, { backgroundColor: colors.primarySoft, borderRadius: radius.xl }]}>
          <Ionicons name={slide.icon} size={36} color={colors.primary} />
        </View>
        <AppText variant="title" style={styles.center}>
          {slide.title}
        </AppText>
        <AppText variant="body" color={colors.textSecondary} style={styles.center}>
          {slide.message}
        </AppText>
        <View style={styles.dots}>
          {slides.map((item, dotIndex) => (
            <View
              key={item.title}
              style={[
                styles.dot,
                {
                  backgroundColor: dotIndex === index ? colors.primary : colors.surfaceMuted,
                  width: dotIndex === index ? 22 : 8,
                },
              ]}
            />
          ))}
        </View>
        {last ? (
          <AppText variant="caption" color={colors.textTertiary} style={styles.center}>
            Food information for your family. Not a medical diagnosis.
          </AppText>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 24,
  },
  icon: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  center: {
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  dot: {
    height: 8,
    borderRadius: 999,
  },
  footer: {
    gap: 10,
  },
});

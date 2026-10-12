import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { foodPhotos } from '@/constants/photos';
import { AppText } from '@/components/ui/AppText';
import { glassSurface } from '@/components/ui/Glass';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import type { LifeStage, ProfileSex } from '@/types/models';
import { BrandMark } from '@/components/ui/BrandMark';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { authIntent } from '@/state/authIntent';
import { useSettingsStore } from '@/state/settingsStore';
import { useTheme } from '@/theme/ThemeProvider';

const slides = [
  {
    icon: 'camera-outline' as const,
    photo: foodPhotos.hero,
    title: 'Scan a product',
    message: 'Photograph the package. We ask for another photo only when something is still missing.',
  },
  {
    icon: 'barcode-outline' as const,
    photo: foodPhotos.cereal,
    title: 'Barcode is optional',
    message: 'A barcode can look the product up faster. If it is missing, we read the package.',
  },
  {
    icon: 'people-outline' as const,
    photo: foodPhotos.dairy,
    title: 'Reviewed for your family',
    message: 'Add each person when you want a family check. You can scan a product before creating a profile.',
  },
];

const FAMILY: { name: string; lifeStage: LifeStage; sex: ProfileSex }[] = [
  { name: 'Grandpa', lifeStage: 'senior', sex: 'male' },
  { name: 'Ana', lifeStage: 'adult', sex: 'female' },
  { name: 'Sam', lifeStage: 'teen', sex: 'male' },
  { name: 'Zoe', lifeStage: 'child', sex: 'female' },
  { name: 'Mia', lifeStage: 'baby', sex: 'female' },
];

export function OnboardingScreen() {
  const { colors, radius } = useTheme();
  const completeOnboarding = useSettingsStore((state) => state.completeOnboarding);
  const enterGuest = useSettingsStore((state) => state.enterGuest);
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
              <Button label="Scan without an account" variant="ghost" onPress={enterGuest} />
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
        <View style={styles.hero}>
          <Image source={slide.photo} contentFit="cover" accessibilityLabel={slide.title} style={[styles.photo, { borderRadius: radius.xl }]} />
          {last ? (
            <View style={[styles.family, { ...glassSurface(colors), backgroundColor: colors.glassStrong, borderRadius: radius.pill }]}>
              {FAMILY.map((person, personIndex) => (
                <ProfileAvatar key={person.name} person={person} size={46} style={{ marginLeft: personIndex === 0 ? 0 : -10 }} />
              ))}
            </View>
          ) : (
            <View style={[styles.icon, { ...glassSurface(colors), backgroundColor: colors.glassStrong, borderRadius: radius.pill }]}>
              <Ionicons name={slide.icon} size={22} color={colors.accent} />
            </View>
          )}
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
  hero: {
    width: '100%',
    marginTop: 8,
    marginBottom: 18,
    alignItems: 'center',
  },
  photo: {
    width: '100%',
    height: 260,
  },
  family: {
    position: 'absolute',
    bottom: -24,
    flexDirection: 'row',
    padding: 4,
  },
  icon: {
    position: 'absolute',
    bottom: -18,
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
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

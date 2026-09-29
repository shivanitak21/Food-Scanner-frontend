import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { DetailSheet } from '@/components/design/DetailSheet';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { APP_VERSION } from '@/constants/config';
import { DISCLAIMER } from '@/constants/copy';
import { queryClient } from '@/lib/queryClient';
import { useCurrentUser } from '@/hooks/useFoodData';
import { useAuthStore } from '@/state/authStore';
import { useSettingsStore, type ThemePreference } from '@/state/settingsStore';
import { useTheme } from '@/theme/ThemeProvider';
import type { MainTabParamList, RootStackParamList } from '@/types/navigation';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Settings'>,
  NativeStackScreenProps<RootStackParamList>
>;

const themes: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

export function SettingsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const theme = useSettingsStore((state) => state.theme);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const resetOnboarding = useSettingsStore((state) => state.resetOnboarding);
  const signOut = useAuthStore((state) => state.signOut);
  const user = useCurrentUser();
  const [privacy, setPrivacy] = useState(false);
  const [about, setAbout] = useState(false);

  return (
    <Screen>
      <AppText variant="display">Settings</AppText>
      <View>
        <Row title="Account" detail={user.data?.email || user.data?.name || 'Signed in'} onPress={() => navigation.navigate('UserProfile')} />
        <Row title="Family" detail="People included in every scan" onPress={() => navigation.navigate('Family')} />
        <View style={styles.block}>
          <AppText variant="headline">Preferences</AppText>
          <View style={styles.themes}>
            {themes.map((option) => {
              const active = theme === option.value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  onPress={() => setTheme(option.value)}
                  style={styles.theme}
                >
                  <AppText variant="bodyMedium" color={active ? colors.primary : colors.textSecondary}>
                    {option.label}
                  </AppText>
                  <View style={[styles.mark, { backgroundColor: active ? colors.primary : 'transparent' }]} />
                </Pressable>
              );
            })}
          </View>
        </View>
        <Row title="Notifications" detail="Off" />
        <Row title="Privacy" onPress={() => setPrivacy(true)} />
        <Row title="About" detail={`FoodLens ${APP_VERSION}`} onPress={() => setAbout(true)} />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sign out"
        onPress={() => {
          queryClient.clear();
          signOut();
        }}
        style={styles.signOut}
      >
        <AppText variant="bodyMedium" color={colors.avoid}>
          Sign out
        </AppText>
      </Pressable>

      <DetailSheet visible={privacy} title="Privacy" onClose={() => setPrivacy(false)}>
        <AppText variant="body" color={colors.textSecondary}>
          {DISCLAIMER}
        </AppText>
      </DetailSheet>
      <DetailSheet visible={about} title="About" onClose={() => setAbout(false)}>
        <AppText variant="body" color={colors.textSecondary}>
          FoodLens {APP_VERSION}
        </AppText>
        <Pressable accessibilityRole="button" onPress={resetOnboarding} style={styles.signOut}>
          <AppText variant="bodyMedium" color={colors.primary}>
            Show introduction
          </AppText>
        </Pressable>
      </DetailSheet>
    </Screen>
  );
}

function Row({ title, detail, onPress }: { title: string; detail?: string; onPress?: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'text'}
      disabled={!onPress}
      onPress={onPress}
      style={[styles.row, { borderBottomColor: colors.border }]}
    >
      <AppText variant="headline">{title}</AppText>
      {detail ? (
        <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
          {detail}
        </AppText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 64, justifyContent: 'center', gap: 2, borderBottomWidth: StyleSheet.hairlineWidth },
  block: { paddingVertical: 16, gap: 12 },
  themes: { flexDirection: 'row', gap: 18 },
  theme: { minHeight: 44, justifyContent: 'center', gap: 6 },
  mark: { height: 2, borderRadius: 1 },
  signOut: { minHeight: 48, justifyContent: 'center' },
});

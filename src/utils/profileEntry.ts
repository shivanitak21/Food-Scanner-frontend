import { authIntent } from '@/state/authIntent';
import { useAuthStore } from '@/state/authStore';
import { useQuickDraftStore } from '@/state/quickDraftStore';
import { useSettingsStore } from '@/state/settingsStore';
import type { ProfileSeed } from '@/types/models';

export function beginProfile(
  navigation: { navigate: (screen: 'FamilyMemberForm', params?: { seed?: ProfileSeed }) => void },
  seed?: ProfileSeed,
) {
  if (useAuthStore.getState().status === 'authenticated') {
    navigation.navigate('FamilyMemberForm', seed ? { seed } : {});
    return;
  }
  if (seed) useQuickDraftStore.getState().arm(seed);
  authIntent.set('Register');
  useSettingsStore.getState().exitGuest();
}

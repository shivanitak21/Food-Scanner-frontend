import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useLayoutEffect } from 'react';
import { Alert } from 'react-native';

import { ProfileForm } from '@/components/profile/ProfileForm';
import { Screen } from '@/components/ui/Screen';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { useProfileMutations, useProfiles } from '@/hooks/useFoodData';
import { useProfileStore } from '@/state/profileStore';
import type { Profile, ProfileInput, ProfileRole } from '@/types/models';
import type { RootStackParamList } from '@/types/navigation';
import { getErrorMessage } from '@/utils/errors';

type Props = NativeStackScreenProps<RootStackParamList, 'FamilyMemberForm'>;

const MEMBER_ROLES: ProfileRole[] = ['adult', 'child', 'baby', 'other'];

function reportDetail(profile: Profile | null): string {
  if (!profile) return 'Optional. A confirmed report is included in this person’s product review.';
  const context = profile.healthContext;
  const count = (context?.biomarkers.length ?? 0) + (context?.dietaryRecommendations.length ?? 0);
  if (context?.enabled && context.paused) return 'Paused. Tap to review or replace the page.';
  if (context?.enabled && count > 0) return `${count} confirmed ${count === 1 ? 'item' : 'items'}`;
  return 'Optional. Confirm a page and it is included in this person’s product review.';
}

export function FamilyMemberFormScreen({ navigation, route }: Props) {
  const profileId = route.params.profileId;
  const profiles = useProfiles();
  const { create, update, remove } = useProfileMutations();
  const selectedId = useProfileStore((state) => state.selectedProfileId);
  const setSelectedProfileId = useProfileStore((state) => state.setSelectedProfileId);
  const existing = (profiles.data ?? []).find((profile) => profile.id === profileId) ?? null;
  const selfTaken = (profiles.data ?? []).some((profile) => profile.role === 'self' && profile.id !== profileId);
  const allowedRoles: ProfileRole[] = selfTaken ? MEMBER_ROLES : ['self', ...MEMBER_ROLES];

  useLayoutEffect(() => {
    navigation.setOptions({ title: profileId ? 'Edit profile' : 'Add profile' });
  }, [navigation, profileId]);

  const persist = async (input: ProfileInput) => {
    const saved = existing
      ? await update.mutateAsync({ id: existing.id, input })
      : await create.mutateAsync(input);
    if (!selectedId || saved.role === 'self') setSelectedProfileId(saved.id);
    return saved;
  };

  const save = async (input: ProfileInput) => {
    await persist(input);
    navigation.goBack();
  };

  const openReport = async (input: ProfileInput) => {
    const saved = await persist(input);
    if (existing) navigation.navigate('HealthContext', { profileId: saved.id });
    else navigation.replace('HealthContext', { profileId: saved.id });
  };

  const confirmDelete = () => {
    if (!existing) return;
    Alert.alert(`Remove ${existing.name}?`, 'This profile will no longer be available for scans.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          void remove.mutateAsync(existing.id).then(
            () => {
              if (selectedId === existing.id) setSelectedProfileId(null);
              navigation.goBack();
            },
            (error: unknown) => Alert.alert('Could not remove profile', getErrorMessage(error)),
          );
        },
      },
    ]);
  };

  if (profileId && profiles.isLoading) {
    return (
      <Screen edges={['left', 'right', 'bottom']} scroll={false}>
        <LoadingState message="Loading profile" />
      </Screen>
    );
  }

  if (profileId && profiles.isError) {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <ErrorState message={getErrorMessage(profiles.error)} onRetry={() => void profiles.refetch()} />
      </Screen>
    );
  }

  if (profileId && !profiles.isLoading && !existing) {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <ErrorState title="Profile not found" message="That family profile is no longer available." />
      </Screen>
    );
  }

  return (
    <Screen edges={['left', 'right', 'bottom']} keyboardOffset={88}>
      <ProfileForm
        initial={existing}
        allowedRoles={existing ? Array.from(new Set([existing.role, ...allowedRoles])) : allowedRoles}
        submitLabel={existing ? 'Save changes' : 'Add profile'}
        submitting={create.isPending || update.isPending}
        deleting={remove.isPending}
        onSubmit={save}
        onDelete={existing ? confirmDelete : undefined}
        report={{ detail: reportDetail(existing), onPress: openReport }}
      />
    </Screen>
  );
}

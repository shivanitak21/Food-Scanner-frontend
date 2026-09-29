import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, StyleSheet, View } from 'react-native';

import { ProfileForm } from '@/components/profile/ProfileForm';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { useCurrentUser, useProfileMutations, useProfiles } from '@/hooks/useFoodData';
import { useProfileStore } from '@/state/profileStore';
import { useTheme } from '@/theme/ThemeProvider';
import type { ProfileInput } from '@/types/models';
import type { RootStackParamList } from '@/types/navigation';
import { getErrorMessage } from '@/utils/errors';

type Props = NativeStackScreenProps<RootStackParamList, 'UserProfile'>;

export function UserProfileScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const user = useCurrentUser();
  const profiles = useProfiles();
  const { create, update, remove } = useProfileMutations();
  const setSelectedProfileId = useProfileStore((state) => state.setSelectedProfileId);
  const self = (profiles.data ?? []).find((profile) => profile.role === 'self') ?? null;

  const save = async (input: ProfileInput) => {
    const saved = self ? await update.mutateAsync({ id: self.id, input }) : await create.mutateAsync(input);
    setSelectedProfileId(saved.id);
    navigation.goBack();
  };

  return (
    <Screen edges={['left', 'right', 'bottom']} keyboardOffset={88}>
      <View style={styles.account}>
        <AppText variant="label" color={colors.textTertiary}>
          Account
        </AppText>
        <AppText variant="display">{user.data?.name || 'Your account'}</AppText>
        {user.data?.email ? (
          <AppText variant="body" color={colors.textSecondary}>
            {user.data.email}
          </AppText>
        ) : null}
      </View>
      {profiles.isLoading ? <LoadingState message="Loading your profile" /> : null}
      {profiles.isError ? (
        <ErrorState message={getErrorMessage(profiles.error)} onRetry={() => void profiles.refetch()} />
      ) : null}
      {!profiles.isLoading && !profiles.isError ? (
        <ProfileForm
          initial={self}
          allowedRoles={['self']}
          submitLabel={self ? 'Save profile' : 'Create your profile'}
          submitting={create.isPending || update.isPending}
          onSubmit={save}
          deleting={remove.isPending}
          onDelete={
            self
              ? () => {
                  Alert.alert('Remove your food profile?', 'You can create it again later.', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Remove',
                      style: 'destructive',
                      onPress: () => {
                        void remove.mutateAsync(self.id).then(
                          () => navigation.goBack(),
                          (error: unknown) => Alert.alert('Could not remove profile', getErrorMessage(error)),
                        );
                      },
                    },
                  ]);
                }
              : undefined
          }
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  account: {
    gap: 4,
  },
});

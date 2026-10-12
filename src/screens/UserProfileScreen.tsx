import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, StyleSheet, View } from 'react-native';

import { ProfileForm } from '@/components/profile/ProfileForm';
import { AppText } from '@/components/ui/AppText';
import { Glass } from '@/components/ui/Glass';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
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
      <Glass style={styles.account}>
        <ProfileAvatar person={self ?? { name: user.data?.name, role: 'self' }} size={72} />
        <View style={styles.accountCopy}>
          <AppText variant="label" color={colors.textTertiary}>
            Account
          </AppText>
          <AppText variant="title" numberOfLines={1}>
            {user.data?.name || 'Your account'}
          </AppText>
          {user.data?.email ? (
            <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
              {user.data.email}
            </AppText>
          ) : null}
        </View>
      </Glass>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
  },
  accountCopy: {
    flex: 1,
    gap: 2,
  },
});

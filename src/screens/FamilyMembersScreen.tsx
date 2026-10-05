import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateViews';
import { ageGroupLabel, allergyLabel, dietLabel, lifeStageLabel, limitLabel, roleLabel } from '@/constants/profileOptions';
import { useSelectedProfile } from '@/hooks/useSelectedProfile';
import { useTheme } from '@/theme/ThemeProvider';
import type { Profile } from '@/types/models';
import type { MainTabParamList, RootStackParamList } from '@/types/navigation';
import { getErrorMessage } from '@/utils/errors';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Family'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function FamilyMembersScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { profiles, isLoading, isRefetching, isError, error, refetch } = useSelectedProfile();

  return (
    <Screen
      refreshControl={<RefreshControl refreshing={isRefetching && !isLoading} tintColor={colors.primary} onRefresh={refetch} />}
    >
      <View style={styles.header}>
        <AppText variant="display">Your family</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          {profiles.length} {profiles.length === 1 ? 'person' : 'people'}
        </AppText>
      </View>
      {isLoading ? <LoadingState message="Family" /> : null}
      {isError ? <ErrorState message={getErrorMessage(error)} onRetry={refetch} /> : null}
      {!isLoading && !isError && profiles.length === 0 ? (
        <EmptyState icon="people-outline" title="No one here yet" message="Add the people a scan should be reviewed for." />
      ) : null}
      {profiles.map((profile) => (
        <ProfileRow
          key={profile.id}
          profile={profile}
          onPress={() => navigation.navigate('FamilyMemberForm', { profileId: profile.id })}
        />
      ))}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add person"
        onPress={() => navigation.navigate('FamilyMemberForm', {})}
        style={styles.add}
      >
        <AppText variant="headline" color={colors.primary}>
          Add family member
        </AppText>
      </Pressable>
    </Screen>
  );
}

function ProfileRow({ profile, onPress }: { profile: Profile; onPress: () => void }) {
  const { colors } = useTheme();
  const stage = lifeStageLabel(profile.lifeStage) ?? ageGroupLabel(profile.ageGroup) ?? roleLabel(profile.role);
  const diet = dietLabel(profile.diet);
  const watch =
    profile.allergies[0]
      ? `${allergyLabel(profile.allergies[0])} allergy`
      : profile.limits.length > 0
        ? profile.limits.length === 1
          ? limitLabel(profile.limits[0])
          : `${profile.limits.length} things to watch`
        : diet === 'No specific diet'
          ? profile.dietaryPreferences[0] ?? null
          : diet;
  const meta = [stage, watch].filter(Boolean).join(' · ');

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${profile.name}, ${meta}`} onPress={onPress} style={styles.row}>
      <View style={[styles.avatar, { backgroundColor: colors.cream }]}>
        <AppText variant="headline" color={colors.primary}>
          {profile.name.slice(0, 1).toUpperCase()}
        </AppText>
      </View>
      <View style={styles.copy}>
        <AppText variant="headline">{profile.name}</AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          {meta}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { gap: 4, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 76 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 2 },
  add: { minHeight: 56, justifyContent: 'center', marginTop: 8 },
});

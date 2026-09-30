import Ionicons from '@expo/vector-icons/Ionicons';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { Alert, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { StatusMark } from '@/components/design/StatusMark';
import { AppText } from '@/components/ui/AppText';
import { Banner } from '@/components/ui/Banner';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState } from '@/components/ui/StateViews';
import { useCurrentUser, useProfiles, useScanHistory } from '@/hooks/useFoodData';
import { useAuthStore } from '@/state/authStore';
import { useTheme } from '@/theme/ThemeProvider';
import type { ScanSummary } from '@/types/models';
import type { MainTabParamList, RootStackParamList } from '@/types/navigation';
import { getErrorMessage } from '@/utils/errors';
import { firstName, greetingForHour } from '@/utils/format';
import { tapHaptic } from '@/utils/haptics';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function HomeScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const offline = useAuthStore((state) => state.offline);
  const userQuery = useCurrentUser();
  const profiles = useProfiles();
  const history = useScanHistory();
  const recent = (history.data ?? []).slice(0, 3);
  const people = profiles.data ?? [];
  const name = firstName(userQuery.data?.name);
  const greeting = greetingForHour(new Date().getHours());

  const openScan = (mode: 'barcode' | 'label') => {
    if (profiles.isLoading) {
      Alert.alert('Family is still loading', 'Try the scan again in a moment.');
      return;
    }
    if (people.length === 0) {
      Alert.alert('Add your family first', 'A scan is reviewed for every profile on the account.', [
        { text: 'Not now', style: 'cancel' },
        { text: 'Add person', onPress: () => navigation.navigate('FamilyMemberForm', {}) },
      ]);
      return;
    }
    navigation.navigate(mode === 'barcode' ? 'BarcodeScanner' : 'LabelCamera');
  };

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={history.isRefetching || userQuery.isRefetching}
          tintColor={colors.primary}
          onRefresh={() => {
            void history.refetch();
            void userQuery.refetch();
            void profiles.refetch();
          }}
        />
      }
    >
      <View style={styles.greeting}>
        <AppText variant="body" color={colors.textSecondary}>
          {greeting}
        </AppText>
        <AppText variant="display">{name}</AppText>
      </View>

      {offline ? <Banner tone="warning" message="You're offline. Scans will load when the connection returns." /> : null}

      <View style={styles.hero}>
        <AppText variant="title">Know what's inside.</AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Scan product"
          onPress={() => {
            void tapHaptic();
            openScan('barcode');
          }}
          style={({ pressed }) => [
            styles.scan,
            { backgroundColor: colors.primary, transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
        >
          <Ionicons name="scan-outline" size={20} color={colors.onPrimary} />
          <AppText variant="bodyMedium" color={colors.onPrimary}>
            Scan product
          </AppText>
        </Pressable>
        <View style={styles.secondary}>
          <TextAction label="Scan barcode" onPress={() => openScan('barcode')} />
          <View style={[styles.dot, { backgroundColor: colors.textTertiary }]} />
          <TextAction label="Scan label" onPress={() => openScan('label')} />
        </View>
      </View>

      <View style={styles.family}>
        <AppText variant="label" color={colors.textTertiary}>
          Reviewing for
        </AppText>
        <AppText variant="headline">
          {people.length} {people.length === 1 ? 'family member' : 'family members'}
        </AppText>
        {people.length > 0 ? (
          <AppText variant="body" color={colors.textSecondary}>
            {people.map((profile) => profile.name).join(' · ')}
          </AppText>
        ) : (
          <Pressable accessibilityRole="button" onPress={() => navigation.navigate('FamilyMemberForm', {})} style={styles.add}>
            <AppText variant="bodyMedium" color={colors.primary}>
              Add a person
            </AppText>
          </Pressable>
        )}
      </View>

      <View style={styles.recentHead}>
        <AppText variant="label" color={colors.textTertiary}>
          Recent scans
        </AppText>
        {recent.length > 0 ? (
          <Pressable accessibilityRole="button" onPress={() => navigation.navigate('History')} hitSlop={8}>
            <AppText variant="caption" color={colors.primary}>
              See all
            </AppText>
          </Pressable>
        ) : null}
      </View>

      {history.isError ? <ErrorState message={getErrorMessage(history.error)} onRetry={() => void history.refetch()} /> : null}
      {!history.isLoading && !history.isError && recent.length === 0 ? (
        <EmptyState icon="scan-outline" title="No scans yet" message="A product you scan will appear here." />
      ) : null}
      {recent.map((scan) => (
        <RecentRow key={scan.id} scan={scan} onPress={() => navigation.navigate('AnalysisResult', { scan: scan.family })} />
      ))}
    </Screen>
  );
}

function TextAction({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.textAction}>
      <AppText variant="caption" color={colors.textSecondary}>
        {label}
      </AppText>
    </Pressable>
  );
}

function RecentRow({ scan, onPress }: { scan: ScanSummary; onPress: () => void }) {
  const { colors, radius } = useTheme();
  const summary =
    scan.importantCount + scan.reviewCount > 0
      ? `${scan.importantCount + scan.reviewCount} review${scan.importantCount + scan.reviewCount === 1 ? '' : 's'}`
      : 'Can eat';
  const quiet = scan.okayCount > 0 ? `${scan.okayCount} can eat` : null;

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={scan.productName} onPress={onPress} style={styles.recent}>
      {scan.imageUrl ? (
        <Image source={{ uri: scan.imageUrl }} style={[styles.thumb, { borderRadius: radius.md, backgroundColor: colors.cream }]} />
      ) : (
        <View style={[styles.thumb, { borderRadius: radius.md, backgroundColor: colors.cream }]} />
      )}
      <View style={styles.recentCopy}>
        <AppText variant="headline">{scan.productName}</AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          Family review · {scan.profileCount} {scan.profileCount === 1 ? 'profile' : 'profiles'}
        </AppText>
        <AppText variant="caption" color={colors.textTertiary}>
          {[summary, quiet].filter(Boolean).join(' · ')}
        </AppText>
      </View>
      <StatusMark status={scan.importantCount > 0 ? 'avoid' : scan.reviewCount > 0 ? 'review' : 'suitable'} label="" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  greeting: { gap: 2, marginBottom: 8 },
  hero: { gap: 18, paddingVertical: 12 },
  scan: {
    minHeight: 58,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  secondary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  textAction: { minHeight: 44, justifyContent: 'center' },
  dot: { width: 3, height: 3, borderRadius: 2 },
  family: { gap: 6, paddingVertical: 8 },
  add: { minHeight: 44, justifyContent: 'center' },
  recentHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  recent: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 76 },
  thumb: { width: 56, height: 56 },
  recentCopy: { flex: 1, gap: 2 },
});

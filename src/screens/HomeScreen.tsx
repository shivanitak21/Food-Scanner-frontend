import Ionicons from '@expo/vector-icons/Ionicons';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Alert, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { ScanReticle } from '@/components/scan/ScannerChrome';
import { foodPhotos, productPhoto } from '@/constants/photos';
import { AppText } from '@/components/ui/AppText';
import { Glass, glassSurface } from '@/components/ui/Glass';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { Banner } from '@/components/ui/Banner';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState } from '@/components/ui/StateViews';
import { useCurrentUser, useProfiles, useScanHistory } from '@/hooks/useFoodData';
import { useAuthStore } from '@/state/authStore';
import { useQuickDraftStore } from '@/state/quickDraftStore';
import { useTheme } from '@/theme/ThemeProvider';
import type { Profile, ScanSummary } from '@/types/models';
import type { MainTabParamList, RootStackParamList } from '@/types/navigation';
import { getErrorMessage } from '@/utils/errors';
import { firstName, greetingForHour } from '@/utils/format';
import { tapHaptic } from '@/utils/haptics';
import { beginProfile } from '@/utils/profileEntry';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function HomeScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const status = useAuthStore((state) => state.status);
  const offline = useAuthStore((state) => state.offline);
  const pendingProfile = useQuickDraftStore((state) => state.pending);
  const userQuery = useCurrentUser();
  const profiles = useProfiles();
  const history = useScanHistory();
  const recent = (history.data ?? []).slice(0, 3);
  const people = profiles.data ?? [];
  const name = firstName(userQuery.data?.name);
  const greeting = greetingForHour(new Date().getHours());

  useEffect(() => {
    if (status !== 'authenticated' || !pendingProfile) return;
    const seed = useQuickDraftStore.getState().take();
    if (seed) navigation.navigate('FamilyMemberForm', { seed });
  }, [navigation, pendingProfile, status]);

  const openScan = (mode: 'barcode' | 'label') => {
    if (status === 'authenticated' && profiles.isLoading) {
      Alert.alert('Family is still loading', 'Try the scan again in a moment.');
      return;
    }
    navigation.navigate(mode === 'barcode' ? 'BarcodeScanner' : 'LabelCamera');
  };

  const addPerson = () => {
    if (status === 'authenticated') navigation.navigate('FamilyMemberForm', {});
    else beginProfile(navigation);
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
        <View style={styles.greetingRow}>
          <View style={styles.greetingCopy}>
            <AppText variant="bodyMedium" color={colors.textSecondary}>{`${greeting}, ${name}`}</AppText>
            <AppText variant="editorial">Know what’s inside.</AppText>
          </View>
          <ProfileAvatar person={people.find((profile) => profile.role === 'self') ?? { name, role: 'self' }} size={52} />
        </View>
        <AppText variant="body" color={colors.textSecondary}>
          Understand any food. Know who it’s right for.
        </AppText>
      </View>

      {offline ? <Banner tone="warning" message="You're offline. Scans will load when the connection returns." /> : null}

      <ScanProductCard
        onScan={() => {
          void tapHaptic();
          openScan('label');
        }}
        onBarcode={() => {
          void tapHaptic();
          openScan('barcode');
        }}
      />

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <AppText variant="label" color={colors.textTertiary}>
            Your family
          </AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            {people.length} {people.length === 1 ? 'person' : 'people'}
          </AppText>
        </View>
        {people.length > 0 ? (
          <FamilyStrip people={people} onPress={() => navigation.navigate('Family')} />
        ) : (
          <EmptyState
            icon="people-outline"
            title="Add your family"
            message="You can scan without a profile. Add people when you want each product checked for them."
            actionLabel="Add family member"
            onAction={addPerson}
          />
        )}
      </View>

      <View style={styles.sectionHead}>
        <AppText variant="label" color={colors.textTertiary}>
          Recent scans
        </AppText>
        {recent.length > 0 ? (
          <Pressable accessibilityRole="button" accessibilityLabel="See all scans" onPress={() => navigation.navigate('History')} hitSlop={8}>
            <AppText variant="caption" color={colors.primary}>
              See all
            </AppText>
          </Pressable>
        ) : null}
      </View>

      {history.isError ? <ErrorState message={getErrorMessage(history.error)} onRetry={() => void history.refetch()} /> : null}
      {!history.isLoading && !history.isError && recent.length === 0 ? (
        <EmptyState
          icon="scan-outline"
          title="Your food history starts here."
          message={people.length > 0 ? 'A product you scan will show who it fits.' : 'A scan works before you create a profile.'}
          actionLabel="Scan a product"
          onAction={() => openScan('label')}
        />
      ) : null}
      {recent.map((scan) => (
        <RecentRow key={scan.id} scan={scan} onPress={() => navigation.navigate('AnalysisResult', { scan: scan.family })} />
      ))}
    </Screen>
  );
}

function ScanProductCard({ onScan, onBarcode }: { onScan: () => void; onBarcode: () => void }) {
  const { colors, radius } = useTheme();

  return (
    <View style={[styles.scan, { borderRadius: radius.xl, boxShadow: `0 18px 40px ${colors.shadow}` }]}>
      <Image source={foodPhotos.hero} contentFit="cover" style={StyleSheet.absoluteFill} accessibilityLabel="Fresh groceries" />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(124, 107, 242, 0.18)', 'rgba(255, 255, 255, 0)', 'rgba(36, 27, 56, 0.22)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Scan a product. Take a photo of the package."
        onPress={onScan}
        style={({ pressed }) => [styles.finder, pressed && styles.pressed]}
      >
        <ScanReticle size={128} />
      </Pressable>
      <Glass blur intensity={60} radius={radius.lg} style={styles.scanPanel}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Scan a product. Take a photo of the package."
          onPress={onScan}
          style={({ pressed }) => [styles.scanMain, pressed && styles.pressed]}
        >
          <View style={styles.scanCopy}>
            <AppText variant="title">Scan a product</AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              Take a photo of the package
            </AppText>
          </View>
          <LinearGradient
            colors={[colors.primaryStart, colors.primaryEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.scanGo}
          >
            <Ionicons name="camera" size={20} color={colors.onPrimary} />
          </LinearGradient>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Scan barcode instead"
          onPress={onBarcode}
          style={({ pressed }) => [styles.barcode, { borderTopColor: colors.glassBorder }, pressed && styles.pressed]}
        >
          <Ionicons name="barcode-outline" size={18} color={colors.accent} />
          <AppText variant="bodyMedium" color={colors.text} style={styles.barcodeLabel}>
            Scan barcode instead
          </AppText>
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        </Pressable>
      </Glass>
    </View>
  );
}

function FamilyStrip({ people, onPress }: { people: Profile[]; onPress: () => void }) {
  const { colors, radius } = useTheme();
  const shown = people.slice(0, 5);
  const extra = people.length - shown.length;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Your family, ${people.length} people`}
      onPress={onPress}
      style={[
        styles.strip,
        {
          ...glassSurface(colors),
          borderRadius: radius.lg,
          paddingHorizontal: 14,
          boxShadow: `0 10px 24px ${colors.shadow}`,
        },
      ]}
    >
      {shown.map((profile, index) => (
        <ProfileAvatar
          key={profile.id}
          person={profile}
          size={44}
          style={{ marginLeft: index === 0 ? 0 : -12, zIndex: shown.length - index }}
        />
      ))}
      {extra > 0 ? (
        <View style={[styles.avatar, { backgroundColor: colors.primarySoft, borderColor: colors.glassBorder, marginLeft: -12 }]}>
          <AppText variant="caption" color={colors.primary}>
            +{extra}
          </AppText>
        </View>
      ) : null}
      <AppText variant="body" color={colors.textSecondary} style={styles.names} numberOfLines={1}>
        {people.map((profile) => profile.name).join(', ')}
      </AppText>
    </Pressable>
  );
}

function RecentRow({ scan, onPress }: { scan: ScanSummary; onPress: () => void }) {
  const { colors, radius } = useTheme();
  const needs = scan.importantCount + scan.reviewCount;
  const summary =
    scan.importantCount > 0
      ? scan.importantCount === 1
        ? "1 profile doesn't fit"
        : `${scan.importantCount} profiles don't fit`
      : needs > 0
        ? needs === 1
          ? '1 profile needs review'
          : `${needs} profiles need review`
        : scan.insufficientCount > 0 && scan.okayCount === 0
          ? 'Not enough information'
          : 'Good fit for everyone';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${scan.productName}. ${summary}`}
      onPress={onPress}
      style={[
        styles.recent,
        {
          ...glassSurface(colors),
          borderRadius: radius.lg,
          paddingHorizontal: 12,
          boxShadow: `0 10px 24px ${colors.shadow}`,
        },
      ]}
    >
      <Image
        source={productPhoto(scan.productName, scan.imageUrl)}
        contentFit="cover"
        accessibilityLabel={scan.productName}
        style={[styles.thumb, { borderRadius: radius.md, backgroundColor: colors.cream }]}
      />
      <View style={styles.recentCopy}>
        <AppText variant="headline" numberOfLines={2}>
          {scan.productName}
        </AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          {summary}
        </AppText>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  greeting: { gap: 10, marginBottom: 2 },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  greetingCopy: { flex: 1, gap: 4 },
  scan: { overflow: 'hidden', minHeight: 360, justifyContent: 'space-between' },
  scanPanel: { margin: 12 },
  scanMain: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 16, paddingHorizontal: 16, paddingBottom: 14 },
  scanGo: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.9 },
  finder: {
    flex: 1,
    minHeight: 190,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanCopy: { flex: 1, gap: 2 },
  barcode: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  barcodeLabel: { flex: 1 },
  section: { gap: 12 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  strip: { flexDirection: 'row', alignItems: 'center', minHeight: 56 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  names: { flex: 1, marginLeft: 12 },
  recent: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 84 },
  thumb: { width: 64, height: 64 },
  recentCopy: { flex: 1, gap: 4 },
});

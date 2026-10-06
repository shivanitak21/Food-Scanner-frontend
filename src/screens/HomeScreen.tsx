import Ionicons from '@expo/vector-icons/Ionicons';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Alert, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Banner } from '@/components/ui/Banner';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState } from '@/components/ui/StateViews';
import { useCurrentUser, useProfiles, useScanHistory } from '@/hooks/useFoodData';
import { useAuthStore } from '@/state/authStore';
import { useTheme } from '@/theme/ThemeProvider';
import type { Profile, ScanSummary } from '@/types/models';
import type { MainTabParamList, RootStackParamList } from '@/types/navigation';
import { getErrorMessage } from '@/utils/errors';
import { firstName, greetingForHour } from '@/utils/format';
import { tapHaptic } from '@/utils/haptics';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function HomeScreen({ navigation }: Props) {
  const { colors, radius } = useTheme();
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
        <AppText variant="display">{`${greeting}, ${name}`}</AppText>
        <AppText variant="title" style={styles.headline}>
          Know what's inside.
        </AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Understand any food. Know who it's right for.
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
            message="Add your family to see who each product fits."
            actionLabel="Add family member"
            onAction={() => navigation.navigate('FamilyMemberForm', {})}
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
          message="A product you scan will show who it fits."
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
  const { radius } = useTheme();

  return (
    <View style={[styles.scanShadow, { borderRadius: radius.xl }]}>
      <LinearGradient
        colors={['#1B3F2E', '#285A43', '#347556']}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.scan, { borderRadius: radius.xl }]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Scan a product. Take a photo of the package."
          onPress={onScan}
          style={({ pressed }) => [styles.scanMain, pressed && styles.pressed]}
        >
          <View style={styles.finder}>
            <FinderCorner edge="tl" />
            <FinderCorner edge="tr" />
            <FinderCorner edge="bl" />
            <FinderCorner edge="br" />
            <View style={styles.finderIcon}>
              <Ionicons name="camera-outline" size={26} color="#F7F5F0" />
            </View>
          </View>
          <View style={styles.scanCopy}>
            <AppText variant="title" color="#F7F5F0" style={styles.scanTitle}>
              Scan a product
            </AppText>
            <AppText variant="body" color="rgba(247, 245, 240, 0.72)">
              Take a photo of the package
            </AppText>
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Scan barcode instead"
          onPress={onBarcode}
          style={({ pressed }) => [styles.barcode, pressed && styles.pressed]}
        >
          <Ionicons name="barcode-outline" size={18} color="rgba(247, 245, 240, 0.82)" />
          <AppText variant="bodyMedium" color="rgba(247, 245, 240, 0.82)" style={styles.barcodeLabel}>
            Scan barcode instead
          </AppText>
          <Ionicons name="chevron-forward" size={16} color="rgba(247, 245, 240, 0.5)" />
        </Pressable>
      </LinearGradient>
    </View>
  );
}

function FinderCorner({ edge }: { edge: 'tl' | 'tr' | 'bl' | 'br' }) {
  const top = edge[0] === 't';
  const left = edge[1] === 'l';
  return (
    <View
      style={[
        styles.corner,
        top ? styles.cornerTop : styles.cornerBottom,
        left ? styles.cornerLeft : styles.cornerRight,
        {
          borderTopWidth: top ? 1.5 : 0,
          borderBottomWidth: top ? 0 : 1.5,
          borderLeftWidth: left ? 1.5 : 0,
          borderRightWidth: left ? 0 : 1.5,
        },
      ]}
    />
  );
}

function FamilyStrip({ people, onPress }: { people: Profile[]; onPress: () => void }) {
  const { colors } = useTheme();
  const shown = people.slice(0, 5);
  const extra = people.length - shown.length;

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Your family, ${people.length} people`} onPress={onPress} style={styles.strip}>
      {shown.map((profile, index) => (
        <View
          key={profile.id}
          style={[
            styles.avatar,
            {
              backgroundColor: colors.cream,
              borderColor: colors.background,
              marginLeft: index === 0 ? 0 : -12,
              zIndex: shown.length - index,
            },
          ]}
        >
          <AppText variant="bodyMedium" color={colors.primary}>
            {profile.name.slice(0, 1).toUpperCase()}
          </AppText>
        </View>
      ))}
      {extra > 0 ? (
        <View style={[styles.avatar, { backgroundColor: colors.primarySoft, borderColor: colors.background, marginLeft: -12 }]}>
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
      style={styles.recent}
    >
      {scan.imageUrl ? (
        <Image
          source={{ uri: scan.imageUrl }}
          contentFit="cover"
          style={[styles.thumb, { borderRadius: radius.md, backgroundColor: colors.cream }]}
        />
      ) : (
        <View style={[styles.thumb, styles.thumbFallback, { borderRadius: radius.md, backgroundColor: colors.ink }]}>
          <AppText variant="headline" color={colors.background}>
            {scan.productName.slice(0, 1).toUpperCase()}
          </AppText>
        </View>
      )}
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
  greeting: { gap: 8, marginBottom: 4 },
  headline: { marginTop: 12 },
  scanShadow: {
    boxShadow: '0 18px 36px rgba(27, 63, 46, 0.22)',
  },
  scan: { overflow: 'hidden' },
  scanMain: { paddingTop: 18, paddingHorizontal: 18, paddingBottom: 20 },
  pressed: { opacity: 0.9 },
  finder: {
    height: 120,
    borderRadius: 18,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(247, 245, 240, 0.06)',
  },
  finderIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(247, 245, 240, 0.28)',
    backgroundColor: 'rgba(247, 245, 240, 0.08)',
  },
  corner: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderColor: 'rgba(247, 245, 240, 0.78)',
  },
  cornerTop: { top: 14 },
  cornerBottom: { bottom: 14 },
  cornerLeft: { left: 14 },
  cornerRight: { right: 14 },
  scanCopy: { gap: 6, paddingHorizontal: 4 },
  scanTitle: { fontSize: 32, lineHeight: 38 },
  barcode: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 22,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(247, 245, 240, 0.18)',
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
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  recentCopy: { flex: 1, gap: 4 },
});

import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateViews';
import { useScanHistory } from '@/hooks/useFoodData';
import { useTheme } from '@/theme/ThemeProvider';
import type { ScanSummary } from '@/types/models';
import type { MainTabParamList, RootStackParamList } from '@/types/navigation';
import { getErrorMessage } from '@/utils/errors';
import { formatDay } from '@/utils/format';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'History'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function ScanHistoryScreen({ navigation }: Props) {
  const { colors, spacing } = useTheme();
  const history = useScanHistory();
  const entries = groupHistory(history.data ?? []);

  if (history.isLoading) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={[styles.fill, { backgroundColor: colors.background }]}>
        <LoadingState message="Gathering your scans" />
      </SafeAreaView>
    );
  }

  if (history.isError) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={[styles.fill, styles.padded, { backgroundColor: colors.background }]}>
        <ErrorState message={getErrorMessage(history.error)} onRetry={() => void history.refetch()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.fill, { backgroundColor: colors.background }]}>
      <FlashList
        data={entries}
        keyExtractor={(item) => item.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.huge }}
        refreshing={history.isRefetching}
        onRefresh={() => void history.refetch()}
        ListHeaderComponent={
          <View style={styles.header}>
            <AppText variant="label" color={colors.textTertiary}>
              Recent
            </AppText>
            <AppText variant="display">History</AppText>
          </View>
        }
        ListEmptyComponent={
          <EmptyState icon="scan-outline" title="Your food history starts here." message="Products you scan will gather here, with who they fit." />
        }
        getItemType={(row) => row.kind}
        renderItem={({ item }: { item: HistoryEntry }) =>
          item.kind === 'day' ? (
            <AppText variant="label" color={colors.textTertiary} style={styles.day}>
              {item.label}
            </AppText>
          ) : (
            <HistoryRow item={item.scan} onPress={() => navigation.navigate('AnalysisResult', { scan: item.scan.family })} />
          )
        }
      />
    </SafeAreaView>
  );
}

type HistoryEntry = { kind: 'day'; id: string; label: string } | { kind: 'scan'; id: string; scan: ScanSummary };

function groupHistory(items: ScanSummary[]): HistoryEntry[] {
  const rows: HistoryEntry[] = [];
  let last = '';
  for (const scan of items) {
    const day = formatDay(scan.createdAt);
    if (day !== last) {
      rows.push({ kind: 'day', id: `day-${day}-${scan.id}`, label: day });
      last = day;
    }
    rows.push({ kind: 'scan', id: scan.id, scan });
  }
  return rows;
}

function HistoryRow({ item, onPress }: { item: ScanSummary; onPress: () => void }) {
  const { colors, radius } = useTheme();
  const needs = item.reviewCount + item.importantCount;
  const line =
    item.importantCount > 0
      ? item.importantCount === 1
        ? "1 profile doesn't fit"
        : `${item.importantCount} profiles don't fit`
      : needs > 0
        ? needs === 1
          ? '1 profile needs review'
          : `${needs} profiles need review`
        : item.insufficientCount > 0 && item.okayCount === 0
          ? 'Not enough information'
          : 'Good fit for everyone';

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={item.productName} onPress={onPress} style={styles.row}>
      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          contentFit="cover"
          style={[styles.thumb, { borderRadius: radius.md, backgroundColor: colors.cream }]}
        />
      ) : (
        <View style={[styles.thumb, { borderRadius: radius.md, backgroundColor: colors.cream }]} />
      )}
      <View style={styles.copy}>
        <AppText variant="headline" numberOfLines={2}>
          {item.productName}
        </AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          {line}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  padded: { padding: 24, justifyContent: 'center' },
  header: { paddingTop: 12, paddingBottom: 8, gap: 6 },
  day: { marginTop: 18, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 84 },
  thumb: { width: 64, height: 64 },
  copy: { flex: 1, gap: 2 },
});

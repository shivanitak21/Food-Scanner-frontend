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

  if (history.isLoading) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={[styles.fill, { backgroundColor: colors.background }]}>
        <LoadingState message="History" />
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
        data={history.data ?? []}
        keyExtractor={(item) => item.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.huge }}
        refreshing={history.isRefetching}
        onRefresh={() => void history.refetch()}
        ListHeaderComponent={
          <View style={styles.header}>
            <AppText variant="display">History</AppText>
          </View>
        }
        ListEmptyComponent={<EmptyState icon="time-outline" title="No scans yet" message="Products you scan will gather here." />}
        renderItem={({ item }: { item: ScanSummary }) => (
          <HistoryRow item={item} onPress={() => navigation.navigate('AnalysisResult', { scan: item.family })} />
        )}
      />
    </SafeAreaView>
  );
}

function HistoryRow({ item, onPress }: { item: ScanSummary; onPress: () => void }) {
  const { colors, radius } = useTheme();
  const reviews = item.reviewCount + item.importantCount;
  const line = [
    reviews > 0 ? `${reviews} review${reviews === 1 ? '' : 's'}` : null,
    item.okayCount > 0 ? `${item.okayCount} looks okay` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={item.productName} onPress={onPress} style={styles.row}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={[styles.thumb, { borderRadius: radius.md, backgroundColor: colors.cream }]} />
      ) : (
        <View style={[styles.thumb, { borderRadius: radius.md, backgroundColor: colors.cream }]} />
      )}
      <View style={styles.copy}>
        <AppText variant="headline">{item.productName}</AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          {formatDay(item.createdAt)}
        </AppText>
        {line ? (
          <AppText variant="caption" color={colors.textTertiary}>
            {line}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  padded: { padding: 24, justifyContent: 'center' },
  header: { paddingTop: 12, paddingBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 84 },
  thumb: { width: 64, height: 64 },
  copy: { flex: 1, gap: 2 },
});

import { Image } from 'expo-image';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { AppText } from '@/components/ui/AppText';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useTheme } from '@/theme/ThemeProvider';
import type { ScanSummary } from '@/types/models';
import { scanInsight } from '@/utils/presentation';

export const ScanSummaryCard = memo(function ScanSummaryCard({
  scan,
  onPress,
}: {
  scan: ScanSummary;
  onPress: () => void;
}) {
  const { colors, radius } = useTheme();
  const image = scan.imageUrl;
  const status = scan.importantCount > 0 ? 'avoid' : scan.reviewCount > 0 ? 'review' : 'suitable';

  return (
    <Card onPress={onPress}>
      <View style={styles.row}>
        {image ? (
          <Image source={{ uri: image }} style={[styles.image, { borderRadius: radius.md, backgroundColor: colors.surfaceMuted }]} contentFit="cover" accessibilityLabel={scan.productName} />
        ) : (
          <View style={[styles.image, styles.fallback, { borderRadius: radius.md, backgroundColor: colors.primarySoft }]}>
            <AppText variant="headline" color={colors.primary}>
              {scan.productName.slice(0, 1).toUpperCase()}
            </AppText>
          </View>
        )}
        <View style={styles.copy}>
          <AppText variant="bodyMedium" numberOfLines={2}>
            {scan.productName}
          </AppText>
          {scan.productBrand ? (
            <AppText variant="caption" color={colors.textTertiary} numberOfLines={1}>
              {scan.productBrand}
            </AppText>
          ) : null}
          <AppText variant="caption" color={colors.textSecondary} numberOfLines={2}>
            {scanInsight(scan)}
          </AppText>
          <StatusBadge status={status} />
        </View>
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  image: { width: 84, height: 84 },
  fallback: { alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 4 },
});

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';

import { StatusMark } from '@/components/design/StatusMark';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useTheme } from '@/theme/ThemeProvider';
import type { FamilyMemberSummary, FamilyScan } from '@/types/models';
import type { RootStackParamList } from '@/types/navigation';
import { ingredientChange } from '@/utils/scanCompare';

type Props = NativeStackScreenProps<RootStackParamList, 'Compare'>;

export function CompareScreen({ route }: Props) {
  const { colors } = useTheme();
  const { left, right } = route.params;
  const names = uniqueNames(left, right);
  const change = ingredientChange(right, left);

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <AppText variant="label" color={colors.textTertiary}>
        Two saved scans
      </AppText>
      <View style={styles.columns}>
        <AppText variant="headline" style={styles.column}>
          {left.product.name}
        </AppText>
        <AppText variant="headline" style={styles.column}>
          {right.product.name}
        </AppText>
      </View>
      {names.map((name) => {
        const first = memberFor(left, name);
        const second = memberFor(right, name);
        return (
          <View key={name} style={[styles.row, { borderTopColor: colors.border }]}>
            <AppText variant="bodyMedium" style={styles.name}>
              {name}
            </AppText>
            <View style={styles.mark}>{first ? <StatusMark status={first.status} label={first.statusLabel} /> : <AppText variant="caption">—</AppText>}</View>
            <View style={styles.mark}>{second ? <StatusMark status={second.status} label={second.statusLabel} /> : <AppText variant="caption">—</AppText>}</View>
          </View>
        );
      })}
      {change.added.length + change.removed.length > 0 ? (
        <AppText variant="body" color={colors.textSecondary}>
          {[
            change.added.length > 0 ? `${right.product.name} lists ${change.added.join(', ')}` : null,
            change.removed.length > 0 ? `${left.product.name} lists ${change.removed.join(', ')}` : null,
          ]
            .filter(Boolean)
            .join('. ')}
        </AppText>
      ) : (
        <AppText variant="body" color={colors.textSecondary}>
          The stored ingredient lists match.
        </AppText>
      )}
      <AppText variant="caption" color={colors.textTertiary}>
        Same rules for both products. Not a medical diagnosis.
      </AppText>
    </Screen>
  );
}

function uniqueNames(left: FamilyScan, right: FamilyScan): string[] {
  const names = [...left.familySummary, ...right.familySummary].map((member) => member.profileName);
  return names.filter((name, index) => names.indexOf(name) === index);
}

function memberFor(scan: FamilyScan, name: string): FamilyMemberSummary | undefined {
  return scan.familySummary.find((member) => member.profileName === name);
}

const styles = StyleSheet.create({
  columns: { flexDirection: 'row', gap: 12, marginTop: 16 },
  column: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 56, borderTopWidth: StyleSheet.hairlineWidth },
  name: { flex: 1.2 },
  mark: { flex: 1, alignItems: 'flex-start' },
});

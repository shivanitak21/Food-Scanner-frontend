import { Pressable, StyleSheet, View } from 'react-native';

import { StatusMark } from '@/components/design/StatusMark';
import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme/ThemeProvider';
import type { FamilyMemberSummary } from '@/types/models';

type Props = {
  members: FamilyMemberSummary[];
  selectedId?: string;
  onSelect: (profileId: string) => void;
};

export function FamilyReview({ members, selectedId, onSelect }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrap}>
      <View style={styles.heading}>
        <AppText variant="label" color={colors.textTertiary}>
          Family snapshot
        </AppText>
        <AppText variant="caption" color={colors.textTertiary}>
          {members.filter((member) => member.status !== 'suitable').length === 0
            ? 'Looks okay'
            : `${members.filter((member) => member.status !== 'suitable').length} need a closer look`}
        </AppText>
      </View>
      {members.map((member, index) => {
        const selected = member.profileId === selectedId;
        const showConcern = member.headline && member.headline !== member.statusLabel && member.status !== 'suitable';
        return (
          <View key={member.profileId || member.profileName}>
            {index > 0 ? <View style={[styles.rule, { backgroundColor: colors.border }]} /> : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${member.profileName}, ${member.statusLabel}${showConcern ? `, ${member.headline}` : ''}`}
              accessibilityState={{ selected }}
              onPress={() => onSelect(member.profileId)}
              style={styles.row}
            >
              <View style={styles.copy}>
                <AppText variant="headline" color={selected ? colors.text : colors.textSecondary}>
                  {member.profileName}
                </AppText>
                {showConcern ? (
                  <AppText variant="caption" color={colors.textSecondary}>
                    {member.headline}
                  </AppText>
                ) : null}
              </View>
              <StatusMark status={member.status} label={member.statusLabel} />
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 4, marginTop: 8 },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 },
  row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  copy: { flex: 1, gap: 2 },
  rule: { height: StyleSheet.hairlineWidth },
});

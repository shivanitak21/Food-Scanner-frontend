import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme/ThemeProvider';
import type { AnalysisStatus, FamilyMemberSummary } from '@/types/models';

type Props = {
  members: FamilyMemberSummary[];
  selectedId?: string;
  onSelect: (profileId: string) => void;
};

export function FamilyReview({ members, selectedId, onSelect }: Props) {
  const { colors, radius } = useTheme();
  const held = members.filter((member) => member.status !== 'suitable').length;

  return (
    <View style={styles.wrap}>
      <View style={styles.heading}>
        <AppText variant="label" color={colors.textTertiary}>
          Who can eat this
        </AppText>
        <AppText variant="caption" color={colors.textTertiary}>
          {held === 0 ? 'Everyone can eat' : `${members.length - held} can eat`}
        </AppText>
      </View>
      {members.map((member) => {
        const selected = member.profileId === selectedId;
        const tone = verdictTone(member.status);
        return (
          <Pressable
            key={member.profileId || member.profileName}
            accessibilityRole="button"
            accessibilityLabel={`${member.profileName}, ${member.statusLabel}`}
            accessibilityState={{ selected }}
            onPress={() => onSelect(member.profileId)}
            style={[
              styles.card,
              {
                backgroundColor: selected ? colors[tone.soft] : colors.surface,
                borderColor: selected ? colors[tone.ink] : colors.border,
                borderRadius: radius.md,
              },
            ]}
          >
            <View style={[styles.mark, { backgroundColor: colors[tone.ink] }]} />
            <View style={styles.copy}>
              <AppText variant="headline">{member.profileName}</AppText>
              {member.status !== 'suitable' && member.headline ? (
                <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                  {member.headline}
                </AppText>
              ) : null}
            </View>
            <AppText variant="bodyMedium" color={colors[tone.ink]}>
              {member.statusLabel}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

function verdictTone(status: AnalysisStatus): { ink: 'suitable' | 'review' | 'avoid'; soft: 'suitableSoft' | 'reviewSoft' | 'avoidSoft' } {
  if (status === 'avoid') return { ink: 'avoid', soft: 'avoidSoft' };
  if (status === 'review') return { ink: 'review', soft: 'reviewSoft' };
  return { ink: 'suitable', soft: 'suitableSoft' };
}

const styles = StyleSheet.create({
  wrap: { gap: 8, marginTop: 8 },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  card: {
    minHeight: 72,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mark: { width: 8, height: 36, borderRadius: 4 },
  copy: { flex: 1, gap: 2 },
});

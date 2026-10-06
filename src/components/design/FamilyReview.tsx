import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme/ThemeProvider';
import type { FamilyMemberSummary, FitStatus } from '@/types/models';

type Props = {
  members: FamilyMemberSummary[];
  selectedId?: string;
  onSelect: (profileId: string) => void;
};

export function FamilyReview({ members, selectedId, onSelect }: Props) {
  const { colors } = useTheme();
  const held = members.filter((member) => member.fit !== 'GOOD_FIT').length;

  return (
    <View style={styles.wrap}>
      <View style={styles.heading}>
        <AppText variant="label" color={colors.textTertiary}>
          Family fit
        </AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          {held === 0 ? 'Good fit for everyone' : `${held} to review`}
        </AppText>
      </View>
      {members.map((member) => {
        const selected = member.profileId === selectedId;
        const tone = fitTone(member.fit);
        return (
          <Pressable
            key={member.profileId || member.profileName}
            accessibilityRole="button"
            accessibilityLabel={`${member.profileName}, ${member.statusLabel}`}
            accessibilityState={{ selected }}
            onPress={() => onSelect(member.profileId)}
            style={[styles.row, selected && { backgroundColor: colors.surfaceMuted, borderRadius: 16 }]}
          >
            <View style={[styles.avatar, { backgroundColor: colors.cream }]}>
              <AppText variant="bodyMedium" color={colors.primary}>
                {member.profileName.slice(0, 1).toUpperCase()}
              </AppText>
            </View>
            <AppText variant="headline" style={styles.name}>
              {member.profileName}
            </AppText>
            <View style={styles.status}>
              <View style={[styles.dot, { backgroundColor: colors[tone] }]} />
              <AppText variant="bodyMedium" color={colors[tone]}>
                {member.statusLabel}
              </AppText>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function fitTone(fit: FitStatus): 'suitable' | 'review' | 'avoid' | 'info' {
  if (fit === 'DOES_NOT_FIT') return 'avoid';
  if (fit === 'REVIEW') return 'review';
  if (fit === 'INSUFFICIENT_INFORMATION') return 'info';
  return 'suitable';
}

const styles = StyleSheet.create({
  wrap: { gap: 4, marginTop: 8 },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 },
  row: {
    minHeight: 64,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  name: { flex: 1 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: '46%' },
  dot: { width: 8, height: 8, borderRadius: 4 },
});

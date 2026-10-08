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
  const { colors, radius } = useTheme();
  const counts = {
    fit: members.filter((member) => member.fit === 'GOOD_FIT').length,
    review: members.filter((member) => member.fit === 'REVIEW').length,
    avoid: members.filter((member) => member.fit === 'DOES_NOT_FIT').length,
    unknown: members.filter((member) => member.fit === 'INSUFFICIENT_INFORMATION').length,
  };
  const total = Math.max(members.length, 1);

  return (
    <View style={styles.wrap}>
      <View style={styles.heading}>
        <AppText variant="title">Profile fit</AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          {counts.review + counts.avoid === 0 ? 'Good fit for everyone' : `${counts.review + counts.avoid} to review`}
        </AppText>
      </View>
      <View style={[styles.meter, { backgroundColor: colors.surfaceMuted, borderRadius: radius.pill }]}>
        {counts.fit > 0 ? <View style={{ flex: counts.fit / total, backgroundColor: colors.suitable }} /> : null}
        {counts.review > 0 ? <View style={{ flex: counts.review / total, backgroundColor: colors.review }} /> : null}
        {counts.avoid > 0 ? <View style={{ flex: counts.avoid / total, backgroundColor: colors.avoid }} /> : null}
        {counts.unknown > 0 ? <View style={{ flex: counts.unknown / total, backgroundColor: colors.sage }} /> : null}
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
            style={[
              styles.row,
              {
                backgroundColor: selected ? colors.surface : 'transparent',
                borderColor: selected ? colors.border : 'transparent',
                borderRadius: radius.lg,
              },
            ]}
          >
            <View style={[styles.avatar, { backgroundColor: colors.surfaceMuted }]}>
              <AppText variant="bodyMedium" color={colors.primary}>
                {member.profileName.slice(0, 1).toUpperCase()}
              </AppText>
            </View>
            <View style={styles.copy}>
              <AppText variant="headline">{member.profileName}</AppText>
              <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                {member.headline || member.statusLabel}
              </AppText>
            </View>
            <View style={styles.status}>
              <View style={[styles.dot, { backgroundColor: colors[tone] }]} />
              <AppText variant="caption" color={colors[tone]}>
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
  wrap: { gap: 8 },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  meter: { height: 6, flexDirection: 'row', overflow: 'hidden', marginBottom: 4 },
  row: {
    minHeight: 68,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 2 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '38%' },
  dot: { width: 8, height: 8, borderRadius: 4 },
});

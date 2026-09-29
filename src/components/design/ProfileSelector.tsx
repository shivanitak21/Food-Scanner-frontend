import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme/ThemeProvider';
import type { FamilyMemberSummary } from '@/types/models';

export function ProfileSelector({
  members,
  selectedId,
  onSelect,
}: {
  members: FamilyMemberSummary[];
  selectedId?: string;
  onSelect: (profileId: string) => void;
}) {
  const { colors } = useTheme();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {members.map((member) => {
        const selected = member.profileId === selectedId;
        return (
          <Pressable
            key={member.profileId || member.profileName}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={member.profileName}
            onPress={() => onSelect(member.profileId)}
            style={styles.item}
          >
            <AppText variant="bodyMedium" color={selected ? colors.text : colors.textTertiary}>
              {member.profileName}
            </AppText>
            <View style={[styles.mark, { backgroundColor: selected ? colors.primary : 'transparent' }]} />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 18, paddingVertical: 4 },
  item: { minHeight: 44, justifyContent: 'center', gap: 6 },
  mark: { height: 2, borderRadius: 1 },
});

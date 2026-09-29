import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { useSelectedProfile } from '@/hooks/useSelectedProfile';
import { roleLabel } from '@/constants/profileOptions';
import { useTheme } from '@/theme/ThemeProvider';
import type { RootStackParamList } from '@/types/navigation';
import { tapHaptic } from '@/utils/haptics';

export function ProfileSwitcher({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors, radius } = useTheme();
  const { profiles, selected, select } = useSelectedProfile();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <Pressable accessibilityLabel="Close profile switcher" style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.surface, borderRadius: radius.xl }]}
          onPress={(event) => event.stopPropagation()}
        >
          <AppText variant="headline">Scan for</AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            Explanations follow the profile you select.
          </AppText>
          <View style={styles.list}>
            {profiles.map((profile) => {
              const active = profile.id === selected?.id;
              return (
                <Pressable
                  key={profile.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    void tapHaptic();
                    select(profile.id);
                    onClose();
                  }}
                  style={[
                    styles.row,
                    {
                      backgroundColor: active ? colors.primarySoft : colors.surfaceMuted,
                      borderRadius: radius.md,
                    },
                  ]}
                >
                  <View style={styles.copy}>
                    <AppText variant="bodyMedium">{profile.name}</AppText>
                    <AppText variant="caption" color={colors.textSecondary}>
                      {roleLabel(profile.role)}
                    </AppText>
                  </View>
                  {active ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} /> : null}
                </Pressable>
              );
            })}
          </View>
          <Button
            label="Manage family"
            variant="secondary"
            onPress={() => {
              onClose();
              navigation.navigate('Tabs', { screen: 'Family' });
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  sheet: {
    padding: 20,
    gap: 12,
  },
  list: {
    gap: 8,
    marginTop: 4,
  },
  row: {
    minHeight: 64,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
});

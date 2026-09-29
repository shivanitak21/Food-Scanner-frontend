import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme/ThemeProvider';

type Props = {
  visible: boolean;
  onClose: () => void;
  onBarcode: () => void;
  onLabel: () => void;
};

export function ScanModeSheet({ visible, onClose, onBarcode, onLabel }: Props) {
  const { colors, radius } = useTheme();

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <Pressable accessibilityLabel="Close scan options" style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.surface, borderRadius: radius.xl }]} onPress={(event) => event.stopPropagation()}>
          <AppText variant="headline">Scan food</AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            Choose a barcode or a photo of the ingredient label.
          </AppText>
          <Option
            icon="barcode-outline"
            title="Barcode"
            message="Scan the package barcode."
            onPress={onBarcode}
          />
          <Option
            icon="camera-outline"
            title="Ingredient label"
            message="Photograph the ingredient list."
            onPress={onLabel}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Option({
  icon,
  title,
  message,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  onPress: () => void;
}) {
  const { colors, radius } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        { backgroundColor: colors.surfaceMuted, borderRadius: radius.md, opacity: pressed ? 0.86 : 1 },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: colors.primarySoft, borderRadius: radius.sm }]}>
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>
      <View style={styles.copy}>
        <AppText variant="bodyMedium">{title}</AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          {message}
        </AppText>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
    </Pressable>
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
  option: {
    minHeight: 76,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
});

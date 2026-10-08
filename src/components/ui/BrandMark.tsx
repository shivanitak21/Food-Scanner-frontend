import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme/ThemeProvider';

export function BrandMark({ size = 72, showWordmark = false }: { size?: number; showWordmark?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.mark,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.primary,
          },
        ]}
      >
        <Ionicons name="scan-outline" size={size * 0.46} color={colors.onPrimary} />
      </View>
      {showWordmark ? (
        <View style={styles.wordmark}>
          <AppText variant="title">FoodLens</AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            Know what's inside.
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 16,
  },
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    alignItems: 'center',
    gap: 4,
  },
});

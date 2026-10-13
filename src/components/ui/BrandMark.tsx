import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme/ThemeProvider';

const MARK = require('../../../assets/images/brand-mark.png');

export function BrandMark({ size = 72, showWordmark = false }: { size?: number; showWordmark?: boolean }) {
  const { colors } = useTheme();
  const corner = size * 0.227;
  return (
    <View style={styles.wrap}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: corner,
          boxShadow: `0 ${size * 0.14}px ${size * 0.36}px rgba(255, 87, 34, 0.32)`,
        }}
      >
        <Image source={MARK} style={{ width: size, height: size, borderRadius: corner }} contentFit="cover" />
      </View>
      {showWordmark ? (
        <View style={styles.wordmark}>
          <AppText variant="title">FoodLens</AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            Know what’s inside.
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
  wordmark: {
    alignItems: 'center',
    gap: 4,
  },
});

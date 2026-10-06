import { Image } from 'expo-image';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme/ThemeProvider';

export function ProductVisual({ name, brand, imageUrl }: { name: string; brand?: string; imageUrl?: string }) {
  const { colors, radius } = useTheme();
  const { width } = useWindowDimensions();
  const height = Math.min(260, Math.max(168, width * 0.56));

  return (
    <View style={styles.wrap}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          accessibilityLabel={name}
          contentFit="cover"
          style={[styles.image, { height, borderRadius: radius.lg, backgroundColor: colors.cream }]}
        />
      ) : (
        <View style={[styles.fallback, { height, borderRadius: radius.lg, backgroundColor: colors.ink }]}>
          <AppText variant="editorial" color={colors.background} style={styles.initial}>
            {name.slice(0, 1).toUpperCase()}
          </AppText>
        </View>
      )}
      {brand ? (
        <AppText variant="label" color={colors.textTertiary}>
          {brand}
        </AppText>
      ) : null}
      <AppText variant="editorial">{name}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  image: { width: '100%' },
  fallback: { width: '100%', alignItems: 'center', justifyContent: 'center' },
  initial: { fontSize: 64, lineHeight: 72 },
});

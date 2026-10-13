import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { productPhoto } from '@/constants/photos';
import { AppText } from '@/components/ui/AppText';
import { Glass } from '@/components/ui/Glass';
import { useTheme } from '@/theme/ThemeProvider';

export function ProductVisual({ name, brand, imageUrl }: { name: string; brand?: string; imageUrl?: string }) {
  const { colors, radius } = useTheme();
  const { width } = useWindowDimensions();
  const height = Math.min(320, Math.max(240, width * 0.72));

  return (
    <View style={[styles.wrap, { height, borderRadius: radius.xl, backgroundColor: colors.cream }]}>
      <Image source={productPhoto(name, imageUrl)} accessibilityLabel={name} contentFit="cover" style={StyleSheet.absoluteFill} transition={200} />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(20, 14, 34, 0)', 'rgba(20, 14, 34, 0.28)']}
        locations={[0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Glass blur intensity={50} radius={radius.lg} style={styles.caption}>
        {brand ? (
          <AppText variant="label" color={colors.textSecondary}>
            {brand}
          </AppText>
        ) : null}
        <AppText variant="title" numberOfLines={2}>
          {name}
        </AppText>
      </Glass>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', overflow: 'hidden', justifyContent: 'flex-end' },
  caption: { margin: 12, paddingHorizontal: 16, paddingVertical: 14, gap: 2 },
});

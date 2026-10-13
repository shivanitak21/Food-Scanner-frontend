import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme, type Theme } from '@/theme/ThemeProvider';

type Props = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  intensity?: number;
  blur?: boolean;
  tone?: 'auto' | 'dark';
};

export function glassSurface(colors: Theme['colors']): ViewStyle {
  return {
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    boxShadow: `0 12px 30px ${colors.shadow}`,
  };
}

const darkSurface: ViewStyle = {
  backgroundColor: 'rgba(16, 12, 28, 0.42)',
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.16)',
};

export function Glass({ children, style, radius, intensity = 40, blur = false, tone = 'auto' }: Props) {
  const { colors, mode, radius: radii } = useTheme();
  const corner = radius ?? radii.lg;
  const dark = tone === 'dark';

  return (
    <View style={[dark ? darkSurface : glassSurface(colors), { borderRadius: corner }, styles.clip, style]}>
      {blur ? (
        <BlurView intensity={intensity} tint={dark || mode === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      ) : null}
      <LinearGradient
        pointerEvents="none"
        colors={[dark ? 'rgba(255, 255, 255, 0.12)' : colors.glassHighlight, 'rgba(255, 255, 255, 0)']}
        locations={[0, 0.6]}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
});

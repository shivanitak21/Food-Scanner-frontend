import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme/ThemeProvider';
import { tapHaptic } from '@/utils/haptics';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'inverse';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  fullWidth?: boolean;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  fullWidth = true,
}: Props) {
  const { colors, fonts } = useTheme();
  const inactive = disabled || loading;
  const filled = variant === 'primary';

  const palette = {
    primary: { background: 'transparent', text: colors.onPrimary, border: 'transparent' },
    secondary: { background: colors.cream, text: colors.text, border: 'transparent' },
    ghost: { background: 'transparent', text: colors.primary, border: 'transparent' },
    danger: { background: colors.avoidSoft, text: colors.avoid, border: 'transparent' },
    inverse: { background: colors.surface, text: colors.text, border: colors.border },
  }[variant];

  const content = loading ? (
    <ActivityIndicator color={palette.text} />
  ) : (
    <View style={styles.content}>
      {icon ? <Ionicons name={icon} size={18} color={palette.text} /> : null}
      <AppText style={{ color: palette.text, ...fonts.bodySemibold, fontSize: 16, letterSpacing: -0.2 }}>{label}</AppText>
    </View>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={() => {
        void tapHaptic();
        onPress();
      }}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: palette.background,
          borderColor: palette.border,
          borderRadius: 999,
          opacity: inactive ? 0.55 : pressed ? 0.9 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          overflow: 'hidden',
          paddingHorizontal: filled ? 0 : 20,
        },
      ]}
    >
      {filled ? (
        <LinearGradient
          colors={[colors.primaryStart, colors.primaryEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fill}
        >
          {content}
        </LinearGradient>
      ) : (
        content
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fill: {
    minHeight: 54,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
});

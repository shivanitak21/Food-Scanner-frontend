import type { ReactElement, ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type RefreshControlProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  edges?: readonly Edge[];
  footer?: ReactNode;
  padded?: boolean;
  refreshControl?: ReactElement<RefreshControlProps>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardOffset?: number;
};

export function Screen({
  children,
  scroll = true,
  edges = ['top', 'left', 'right'],
  footer,
  padded = true,
  refreshControl,
  contentContainerStyle,
  keyboardOffset = 0,
}: Props) {
  const { spacing } = useTheme();
  const padding = padded ? spacing.xl : 0;

  const body = scroll ? (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[{ padding, paddingBottom: spacing.huge, gap: spacing.xxl }, contentContainerStyle]}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1, padding }, contentContainerStyle]}>{children}</View>
  );

  return (
    <AppWash>
      <SafeAreaView edges={edges} style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={keyboardOffset}
          style={styles.flex}
        >
          {body}
          {footer ? (
            <View
              style={[
                styles.footer,
                {
                  paddingHorizontal: spacing.xl,
                  paddingTop: spacing.md,
                  paddingBottom: spacing.lg,
                  backgroundColor: 'transparent',
                },
              ]}
            >
              {footer}
            </View>
          ) : null}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AppWash>
  );
}

export function AppWash({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.safe, { backgroundColor: colors.background }]}>
      <LinearGradient
        pointerEvents="none"
        colors={[colors.washStart, colors.washMid, colors.washWarm]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.3 }}
        style={styles.wash}
      />
      <LinearGradient
        pointerEvents="none"
        colors={[`${colors.background}00`, `${colors.background}B3`, colors.background]}
        locations={[0, 0.55, 1]}
        style={styles.wash}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  wash: { position: 'absolute', top: 0, left: 0, right: 0, height: 460 },
  footer: {},
});

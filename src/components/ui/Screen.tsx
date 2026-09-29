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
  const { colors, spacing } = useTheme();
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
    <SafeAreaView edges={edges} style={[styles.safe, { backgroundColor: colors.background }]}>
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
                backgroundColor: colors.background,
              },
            ]}
          >
            {footer}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  footer: {},
});

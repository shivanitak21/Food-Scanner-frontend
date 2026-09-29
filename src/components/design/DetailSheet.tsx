import { useEffect, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useTheme } from '@/theme/ThemeProvider';

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function DetailSheet({ visible, title, onClose, children }: Props) {
  const { colors, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const translate = useSharedValue(reduceMotion ? 0 : 28);
  const opacity = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (!visible) return;
    opacity.value = withTiming(1, { duration: reduceMotion ? 0 : 220 });
    translate.value = reduceMotion ? 0 : withSpring(0, { damping: 22, stiffness: 220 });
  }, [opacity, reduceMotion, translate, visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translate.value }],
  }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable accessibilityRole="button" accessibilityLabel="Close details" style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={onClose}>
        <Animated.View style={sheetStyle}>
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={[
              styles.sheet,
              {
                backgroundColor: colors.background,
                borderTopLeftRadius: radius.xl,
                borderTopRightRadius: radius.xl,
                paddingBottom: Math.max(insets.bottom, 20),
              },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <AppText variant="title">{title}</AppText>
            {children}
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={styles.close}>
              <AppText variant="bodyMedium" color={colors.primary}>
                Close
              </AppText>
            </Pressable>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { paddingHorizontal: 24, paddingTop: 12, gap: 16 },
  handle: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, marginBottom: 4 },
  close: { minHeight: 44, justifyContent: 'center' },
});

import type { ReactNode } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';

import { Glass } from '@/components/ui/Glass';
import { useTheme } from '@/theme/ThemeProvider';
import { tapHaptic } from '@/utils/haptics';

type Props = {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
};

export function Card({ children, onPress, style, padded = true }: Props) {
  const { radius } = useTheme();
  const body = (
    <Glass radius={radius.lg} style={[{ padding: padded ? 18 : 0 }, style]}>
      {children}
    </Glass>
  );

  if (!onPress) return body;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        void tapHaptic();
        onPress();
      }}
      style={({ pressed }) => pressed && { opacity: 0.94, transform: [{ scale: 0.99 }] }}
    >
      {body}
    </Pressable>
  );
}

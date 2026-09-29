import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme/ThemeProvider';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  tone?: 'default' | 'avoid' | 'review';
  selection?: 'single' | 'multiple';
};

export function Chip({ label, selected = false, onPress, tone = 'default', selection = 'multiple' }: Props) {
  const { colors, radius } = useTheme();
  const selectedColor = tone === 'avoid' ? colors.avoid : tone === 'review' ? colors.review : colors.primary;
  const selectedSoft = tone === 'avoid' ? colors.avoidSoft : tone === 'review' ? colors.reviewSoft : colors.primarySoft;

  const content = (
    <AppText variant="caption" color={selected ? selectedColor : colors.textSecondary} style={styles.label}>
      {label}
    </AppText>
  );

  const style = {
    backgroundColor: selected ? selectedSoft : colors.surfaceMuted,
    borderColor: selected ? selectedColor : 'transparent',
    borderRadius: radius.pill,
  };

  if (!onPress) {
    return <Pressable disabled style={[styles.chip, style]}>{content}</Pressable>;
  }

  return (
    <Pressable
      accessibilityRole={selection === 'single' ? 'radio' : 'checkbox'}
      accessibilityState={{ checked: selected, selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, style, pressed && { opacity: 0.8 }]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
  },
});

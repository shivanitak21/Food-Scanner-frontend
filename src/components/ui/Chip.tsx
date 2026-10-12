import { Image } from 'expo-image';
import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import type { PhotoSource } from '@/constants/photos';
import { useTheme } from '@/theme/ThemeProvider';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  tone?: 'default' | 'avoid' | 'review';
  selection?: 'single' | 'multiple';
  avatar?: PhotoSource;
};

export function Chip({ label, selected = false, onPress, tone = 'default', selection = 'multiple', avatar }: Props) {
  const { colors, radius, fonts } = useTheme();
  const selectedColor = tone === 'avoid' ? colors.avoid : tone === 'review' ? colors.review : colors.primary;
  const selectedSoft = tone === 'avoid' ? colors.avoidSoft : tone === 'review' ? colors.reviewSoft : colors.primarySoft;

  const content = (
    <>
      {avatar ? <Image source={avatar} contentFit="cover" style={styles.avatar} /> : null}
      <AppText
        variant="caption"
        color={selected ? selectedColor : colors.textSecondary}
        style={[styles.label, selected ? fonts.bodySemibold : fonts.bodyMedium]}
      >
        {label}
      </AppText>
    </>
  );

  const style = {
    backgroundColor: selected ? selectedSoft : colors.glassFill,
    borderColor: selected ? selectedColor : colors.glassBorder,
    borderRadius: radius.pill,
    paddingLeft: avatar ? 5 : 14,
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
    paddingRight: 14,
    paddingVertical: 6,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  label: {
    fontSize: 13,
  },
});

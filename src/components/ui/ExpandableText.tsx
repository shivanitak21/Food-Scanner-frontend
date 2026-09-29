import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme/ThemeProvider';
import { clip } from '@/utils/presentation';

export function ExpandableText({ text, preview = 120 }: { text: string; preview?: number }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return null;
  const canExpand = cleaned.length > preview;

  return (
    <View style={styles.wrap}>
      <AppText variant="body" color={colors.textSecondary}>
        {open || !canExpand ? cleaned : clip(cleaned, preview)}
      </AppText>
      {canExpand ? (
        <Pressable accessibilityRole="button" onPress={() => setOpen((value) => !value)} hitSlop={8}>
          <AppText variant="bodyMedium" color={colors.primary}>
            {open ? 'Show less' : 'Read more'}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
});

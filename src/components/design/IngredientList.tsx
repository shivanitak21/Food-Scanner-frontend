import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme/ThemeProvider';
import type { IngredientItem } from '@/types/models';
import { ingredientCategory } from '@/utils/presentation';

export function IngredientList({
  items,
  onPress,
}: {
  items: IngredientItem[];
  onPress: (ingredient: IngredientItem) => void;
}) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;
  const visible = open ? items : items.slice(0, 5);

  return (
    <View style={styles.wrap}>
      <AppText variant="title">Ingredients</AppText>
      {visible.map((item, index) => (
        <View key={item.id}>
          {index > 0 ? <View style={[styles.rule, { backgroundColor: colors.border }]} /> : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${item.name}, ${ingredientCategory(item.name, item.details)}`}
            onPress={() => onPress(item)}
            style={styles.row}
          >
            <View style={[styles.dot, { backgroundColor: item.flagged ? colors.review : colors.sage }]} />
            <View style={styles.copy}>
              <AppText variant="bodyMedium">{item.name}</AppText>
              <AppText variant="caption" color={colors.textTertiary}>
                {ingredientCategory(item.name, item.details)}
              </AppText>
            </View>
            {item.flagged ? (
              <View style={[styles.tag, { backgroundColor: colors.reviewSoft }]}>
                <AppText variant="caption" color={colors.review}>
                  Relevant
                </AppText>
              </View>
            ) : null}
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </Pressable>
        </View>
      ))}
      {items.length > 5 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          onPress={() => setOpen((value) => !value)}
          style={styles.more}
        >
          <AppText variant="bodyMedium" color={colors.primary}>
            {open ? 'Show fewer ingredients' : `Show ${items.length - 5} more`}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 2 },
  row: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 12 },
  copy: { flex: 1, gap: 2 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  tag: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  rule: { height: StyleSheet.hairlineWidth },
  more: { minHeight: 44, justifyContent: 'center' },
});

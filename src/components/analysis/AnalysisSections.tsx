import Ionicons from '@expo/vector-icons/Ionicons';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { AppText } from '@/components/ui/AppText';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useTheme } from '@/theme/ThemeProvider';
import type { EvidenceItem, Finding, IngredientItem, NutritionItem } from '@/types/models';

export function FindingSection({ title, items }: { title: string; items: Finding[] }) {
  if (items.length === 0) return null;
  return (
    <View style={styles.section}>
      <SectionHeader title={title} />
      {items.map((item) => (
        <FindingCard key={item.id} finding={item} />
      ))}
    </View>
  );
}

function FindingCard({ finding }: { finding: Finding }) {
  const { colors } = useTheme();
  const showExplanation = finding.explanation.trim().toLowerCase() !== finding.title.trim().toLowerCase();
  return (
    <Card>
      <View style={styles.copy}>
        <AppText variant="bodyMedium">{finding.title}</AppText>
        {showExplanation ? (
          <AppText variant="body" color={colors.textSecondary}>
            {finding.explanation}
          </AppText>
        ) : null}
        {finding.evidence ? (
          <AppText variant="caption" color={colors.textTertiary}>
            {finding.evidence}
          </AppText>
        ) : null}
      </View>
    </Card>
  );
}

export function IngredientSection({
  items,
  onPress,
}: {
  items: IngredientItem[];
  onPress: (ingredient: IngredientItem) => void;
}) {
  const { colors } = useTheme();
  if (items.length === 0) return null;
  return (
    <View style={styles.section}>
      <SectionHeader title="Full ingredient list" />
      <Card padded={false}>
        {items.map((item, index) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={item.name}
            onPress={() => onPress(item)}
            style={[
              styles.ingredient,
              index < items.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
              item.flagged && { backgroundColor: colors.avoidSoft },
            ]}
          >
            <View style={styles.copy}>
              <AppText variant="bodyMedium">{item.name}</AppText>
              {item.reason ? (
                <AppText variant="caption" color={colors.textSecondary}>
                  {item.reason}
                </AppText>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </Pressable>
        ))}
      </Card>
    </View>
  );
}

export function NutritionSection({ items }: { items: NutritionItem[] }) {
  const { colors } = useTheme();
  if (items.length === 0) return null;
  return (
    <View style={styles.section}>
      <SectionHeader title="Nutrition information" />
      <Card>
        {items.map((item, index) => {
          const amount = item.unit && !item.amount.includes(item.unit) ? `${item.amount} ${item.unit}` : item.amount;
          const daily = item.dailyValuePercent !== undefined ? `${item.dailyValuePercent}% daily value` : null;
          return (
            <View
              key={item.id}
              accessible
              accessibilityLabel={[item.name, amount, daily, item.note].filter(Boolean).join(', ')}
              style={[styles.nutrient, index < items.length - 1 && styles.nutrientDivider, { borderBottomColor: colors.border }]}
            >
              <View style={styles.copy}>
                <AppText variant="bodyMedium">{item.name}</AppText>
                {item.note ? (
                  <AppText variant="caption" color={colors.textSecondary}>
                    {item.note}
                  </AppText>
                ) : null}
              </View>
              <View style={styles.amount}>
                <AppText variant="bodyMedium">{amount}</AppText>
                {daily ? (
                  <AppText variant="caption" color={colors.textTertiary}>
                    {daily}
                  </AppText>
                ) : null}
              </View>
            </View>
          );
        })}
      </Card>
    </View>
  );
}

export function EvidenceSection({ items }: { items: EvidenceItem[] }) {
  const { colors } = useTheme();
  if (items.length === 0) return null;
  return (
    <View style={styles.section}>
      <SectionHeader title="Evidence and sources" />
      {items.map((item) => {
        const openable = Boolean(item.url && /^https?:\/\//i.test(item.url));
        return (
          <Card
            key={item.id}
            onPress={
              openable
                ? () => {
                    void Linking.openURL(item.url as string);
                  }
                : undefined
            }
          >
            <View style={styles.copy}>
              <AppText variant="bodyMedium">{item.title}</AppText>
              {item.detail && item.detail !== item.title ? (
                <AppText variant="body" color={colors.textSecondary}>
                  {item.detail}
                </AppText>
              ) : null}
              {item.source ? (
                <AppText variant="caption" color={colors.textTertiary}>
                  {item.source}
                </AppText>
              ) : null}
            </View>
          </Card>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  copy: {
    gap: 4,
    flex: 1,
  },
  ingredient: {
    minHeight: 58,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nutrient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 12,
  },
  nutrientDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  amount: {
    alignItems: 'flex-end',
    gap: 2,
  },
});

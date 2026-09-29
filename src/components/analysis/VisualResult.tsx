import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { ExpandableText } from '@/components/ui/ExpandableText';
import { NutrientBar } from '@/components/ui/NutrientBar';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useTheme } from '@/theme/ThemeProvider';
import type { EvidenceItem, Finding, IngredientItem, NutritionItem } from '@/types/models';
import { formatAmount, ingredientIcon, isCalorie, nutrientIcon } from '@/utils/presentation';
import { findingLine, findingMeasure } from '@/utils/presentation';

function percentValue(finding: Finding): number | null {
  const match = `${finding.title} ${finding.explanation}`.match(/(\d+(?:[.,]\d+)?)\s*%/);
  if (!match) return null;
  const value = Number(match[1].replace(',', '.'));
  return Number.isFinite(value) ? value : null;
}

export function InsightCard({ finding }: { finding: Finding }) {
  const { colors, radius } = useTheme();
  const [open, setOpen] = useState(false);
  const measure = findingMeasure(finding);
  const tone = finding.severity === 'avoid' ? 'concern' : finding.severity === 'info' ? 'positive' : 'attention';
  const tint = tone === 'concern' ? colors.avoidSoft : tone === 'positive' ? colors.suitableSoft : colors.reviewSoft;
  const ink = tone === 'concern' ? colors.avoid : tone === 'positive' ? colors.suitable : colors.review;
  const icon =
    finding.category === 'allergen'
      ? 'alert-circle-outline'
      : finding.category === 'nutrition'
        ? nutrientIcon(finding.title)
        : 'leaf-outline';

  return (
    <Card>
      <View style={styles.insightTop}>
        <View style={[styles.icon, { backgroundColor: tint, borderRadius: radius.md }]}>
          <Ionicons name={icon} size={20} color={ink} />
        </View>
        <View style={styles.copy}>
          <AppText variant="bodyMedium">{finding.title}</AppText>
          {measure ? (
            <AppText variant="numeric" style={styles.measure}>
              {measure}
            </AppText>
          ) : null}
        </View>
      </View>
      {percentValue(finding) !== null ? (
        <NutrientBar value={percentValue(finding) as number} tone={tone === 'concern' ? 'concern' : tone === 'positive' ? 'positive' : 'attention'} />
      ) : null}
      <AppText variant="caption" color={colors.textSecondary}>
        {findingLine(finding)}
      </AppText>
      <Pressable accessibilityRole="button" accessibilityLabel={open ? 'Hide explanation' : 'View details'} onPress={() => setOpen((value) => !value)}>
        <AppText variant="bodyMedium" color={colors.primary}>
          {open ? 'Hide details' : 'View details'}
        </AppText>
      </Pressable>
      {open ? (
        <View style={styles.detail}>
          <AppText variant="body" color={colors.textSecondary}>
            {finding.explanation}
          </AppText>
          {finding.evidence ? (
            <AppText variant="caption" color={colors.textTertiary}>
              {finding.evidence}
            </AppText>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

export function NutritionDashboard({ items }: { items: NutritionItem[] }) {
  const { colors, radius } = useTheme();
  const width = useWindowDimensions().width;
  if (items.length === 0) return null;
  const calories = items.find(isCalorie);
  const rest = items.filter((item) => item !== calories);
  const cardWidth = Math.max(140, (width - 20 * 2 - 12) / 2);

  return (
    <View style={styles.section}>
      <SectionHeader title="Nutrition" />
      {calories ? (
        <Card>
          <AppText variant="label" color={colors.textSecondary}>
            {calories.name}
          </AppText>
          <AppText variant="numeric">{formatAmount(calories)}</AppText>
          {calories.note ? (
            <AppText variant="caption" color={colors.textTertiary}>
              {calories.note}
            </AppText>
          ) : null}
          {calories.dailyValuePercent !== undefined ? <NutrientBar value={calories.dailyValuePercent} /> : null}
        </Card>
      ) : null}
      <View style={styles.grid}>
        {rest.map((item) => (
          <View key={item.id} style={{ width: cardWidth }}>
            <Card>
              <View style={[styles.miniIcon, { backgroundColor: colors.primarySoft, borderRadius: radius.sm }]}>
                <Ionicons name={nutrientIcon(item.name)} size={16} color={colors.primary} />
              </View>
              <AppText variant="caption" color={colors.textSecondary}>
                {item.name}
              </AppText>
              <AppText variant="headline">{formatAmount(item)}</AppText>
              {item.dailyValuePercent !== undefined ? <NutrientBar value={item.dailyValuePercent} /> : null}
              {item.note ? (
                <AppText variant="caption" color={colors.textTertiary}>
                  {item.note}
                </AppText>
              ) : null}
            </Card>
          </View>
        ))}
      </View>
    </View>
  );
}

export function IngredientCards({
  items,
  onPress,
  limit,
}: {
  items: IngredientItem[];
  onPress: (ingredient: IngredientItem) => void;
  limit?: number;
}) {
  const { colors, radius } = useTheme();
  if (items.length === 0) return null;
  const visible = typeof limit === 'number' ? items.slice(0, limit) : items;

  return (
    <View style={styles.section}>
      <SectionHeader title="Ingredients" />
      <AppText variant="caption" color={colors.textSecondary}>
        {items.length} {items.length === 1 ? 'ingredient' : 'ingredients'}
      </AppText>
      {visible.map((item) => (
        <Pressable
          key={item.id}
          accessibilityRole="button"
          accessibilityLabel={item.name}
          onPress={() => onPress(item)}
          style={({ pressed }) => [
            styles.ingredient,
            {
              backgroundColor: item.flagged ? colors.avoidSoft : colors.surface,
              borderColor: colors.border,
              borderRadius: radius.lg,
              opacity: pressed ? 0.92 : 1,
            },
          ]}
        >
          <View style={[styles.icon, { backgroundColor: item.flagged ? colors.surface : colors.primarySoft, borderRadius: radius.md }]}>
            <Ionicons name={ingredientIcon(item.name)} size={20} color={item.flagged ? colors.avoid : colors.primary} />
          </View>
          <View style={styles.copy}>
            <AppText variant="bodyMedium">{item.name}</AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {item.flagged ? item.reason || 'Flagged for this profile' : item.details || 'Listed ingredient'}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </Pressable>
      ))}
    </View>
  );
}

export function EvidenceCards({ items }: { items: EvidenceItem[] }) {
  const { colors } = useTheme();
  if (items.length === 0) return null;
  return (
    <View style={styles.section}>
      <SectionHeader title="Evidence" />
      {items.slice(0, 4).map((item) => (
        <Card key={item.id}>
          <AppText variant="bodyMedium">{item.title}</AppText>
          {item.detail ? <ExpandableText text={item.detail} preview={90} /> : null}
          {item.source ? (
            <AppText variant="caption" color={colors.textTertiary}>
              {item.source}
            </AppText>
          ) : null}
        </Card>
      ))}
    </View>
  );
}

export function ProductHeroImage({ uri, name }: { uri?: string; name: string }) {
  const { colors, radius } = useTheme();
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.heroImage, { borderRadius: radius.xl, backgroundColor: colors.surfaceMuted }]}
        contentFit="cover"
        accessibilityLabel={name}
        transition={200}
      />
    );
  }
  return (
    <View style={[styles.heroFallback, { borderRadius: radius.xl, backgroundColor: colors.primarySoft }]}>
      <AppText variant="display" color={colors.primary}>
        {name.slice(0, 1).toUpperCase()}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  insightTop: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  icon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 2 },
  measure: { marginTop: 2 },
  detail: { gap: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  miniIcon: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  ingredient: {
    minHeight: 76,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroImage: { width: '100%', height: 220 },
  heroFallback: { width: '100%', height: 180, alignItems: 'center', justifyContent: 'center' },
});

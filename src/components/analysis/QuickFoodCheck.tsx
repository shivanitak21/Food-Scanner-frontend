import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { IngredientList } from '@/components/design/IngredientList';
import { ProductVisual } from '@/components/design/ProductVisual';
import { Appear } from '@/components/motion/Appear';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { NutrientBar } from '@/components/ui/NutrientBar';
import { useTheme } from '@/theme/ThemeProvider';
import type { IngredientItem, QuickHighlight, QuickOverall, QuickScan } from '@/types/models';

const OVERALL_TONE: Record<QuickOverall, 'positive' | 'attention' | 'concern' | 'neutral'> = {
  good: 'positive',
  review: 'attention',
  limit: 'concern',
  insufficient: 'neutral',
};

export function QuickFoodCheck({
  scan,
  onBack,
  onIngredient,
  onContext,
  onCreateProfile,
}: {
  scan: QuickScan;
  onBack: () => void;
  onIngredient: (ingredient: IngredientItem) => void;
  onContext: () => void;
  onCreateProfile: () => void;
}) {
  const { colors, radius } = useTheme();
  const tone = OVERALL_TONE[scan.overall];
  const overallColor = tone === 'concern' ? colors.avoid : tone === 'attention' ? colors.review : tone === 'positive' ? colors.suitable : colors.textSecondary;
  const overallSoft = tone === 'concern' ? colors.avoidSoft : tone === 'attention' ? colors.reviewSoft : tone === 'positive' ? colors.suitableSoft : colors.surfaceMuted;

  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} style={styles.back}>
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </Pressable>
      <Appear index={0}>
        <View style={styles.kicker}>
          <AppText variant="label" color={colors.textTertiary}>
            Quick food check
          </AppText>
        </View>
        <ProductVisual name={scan.product.name} brand={scan.product.brand} imageUrl={scan.product.imageUrl} />
      </Appear>
      <Appear index={1}>
        <View style={[styles.overall, { backgroundColor: overallSoft, borderRadius: radius.lg }]}>
          <AppText variant="label" color={overallColor}>
            Overall
          </AppText>
          <AppText variant="title" color={overallColor}>
            {scan.overallLabel}
          </AppText>
          {scan.overallDetail ? (
            <AppText variant="body" color={colors.textSecondary}>
              {scan.overallDetail}
            </AppText>
          ) : null}
        </View>
      </Appear>
      {scan.contextNotes.length > 0 ? (
        <Appear index={2}>
          <View style={styles.stack}>
            {scan.contextNotes.map((note) => (
              <AppText key={note} variant="body" color={colors.textSecondary}>
                {note}
              </AppText>
            ))}
          </View>
        </Appear>
      ) : null}
      <Appear index={3}>
        <View style={styles.stack}>
          <AppText variant="title">Nutrition highlights</AppText>
          <View style={styles.grid}>
            {scan.highlights.map((item) => (
              <HighlightCard key={item.id} item={item} />
            ))}
          </View>
        </View>
      </Appear>
      <Appear index={4}>
        <View style={styles.stack}>
          <AppText variant="title">What to know</AppText>
          {scan.whatToKnow.length > 0 ? (
            <View style={styles.wrap}>
              {scan.whatToKnow.map((item) => (
                <Chip key={item} label={item} />
              ))}
            </View>
          ) : (
            <AppText variant="body" color={colors.textSecondary}>
              No standout nutrition signals from the numbers on this package.
            </AppText>
          )}
        </View>
      </Appear>
      {scan.cautions.length > 0 ? (
        <Appear index={5}>
          <View style={styles.stack}>
            <AppText variant="title">Cautions</AppText>
            {scan.cautions.map((item) => (
              <View key={item.id} style={[styles.caution, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
                <AppText variant="headline">{item.title}</AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  {item.detail}
                </AppText>
              </View>
            ))}
          </View>
        </Appear>
      ) : null}
      <Appear index={6}>
        <IngredientList items={scan.ingredients.length ? scan.ingredients : scan.product.ingredients} onPress={onIngredient} />
      </Appear>
      <Appear index={7}>
        <View style={styles.stack}>
          <AppText variant="title">Who may want to check this</AppText>
          {scan.whoMayWantToCheck.length > 0 ? (
            scan.whoMayWantToCheck.map((item) => (
              <AppText key={item} variant="body" color={colors.textSecondary}>
                {item}
              </AppText>
            ))
          ) : (
            <AppText variant="body" color={colors.textSecondary}>
              {scan.whoEmpty}
            </AppText>
          )}
        </View>
      </Appear>
      <Appear index={8}>
        <View style={[styles.prompt, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
          <AppText variant="headline">Want a more relevant result?</AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            Age, diet, health considerations, and goals are optional.
          </AppText>
          <Button label={scan.context.hasContext ? 'Update details' : 'Make it more relevant'} variant="secondary" onPress={onContext} />
        </View>
      </Appear>
      <Appear index={9}>
        <View style={styles.stack}>
          <AppText variant="headline">Want more personalized food insights?</AppText>
          <Button label="Create my profile" onPress={onCreateProfile} />
          {scan.professionalNote ? (
            <AppText variant="caption" color={colors.textSecondary}>
              {scan.professionalNote}
            </AppText>
          ) : null}
          <AppText variant="caption" color={colors.textTertiary}>
            {scan.disclaimer}
          </AppText>
        </View>
      </Appear>
    </>
  );
}

function HighlightCard({ item }: { item: QuickHighlight }) {
  const { colors, radius } = useTheme();
  const amount = item.amount ? [item.amount, item.unit].filter(Boolean).join(' ') : item.levelLabel;
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: item.emphasized ? colors.primary : colors.border,
          borderRadius: radius.lg,
        },
      ]}
    >
      <AppText variant="caption" color={colors.textTertiary}>
        {item.name}
      </AppText>
      <AppText variant="headline">{amount}</AppText>
      <NutrientBar value={item.level === 'unknown' ? 0 : item.bar} tone={item.tone} />
      <AppText variant="caption" color={item.emphasized ? colors.primary : colors.textSecondary}>
        {item.levelLabel}
        {item.basis ? ` · ${item.basis}` : ''}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  back: { width: 44, height: 44, justifyContent: 'center' },
  kicker: { marginBottom: 4 },
  stack: { gap: 12 },
  overall: { gap: 6, padding: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: { width: '48%', flexGrow: 1, gap: 8, padding: 14, borderWidth: StyleSheet.hairlineWidth },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  caution: { gap: 4, padding: 14, borderWidth: StyleSheet.hairlineWidth },
  prompt: { gap: 10, padding: 16, borderWidth: StyleSheet.hairlineWidth },
});

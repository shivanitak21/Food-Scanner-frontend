import Ionicons from '@expo/vector-icons/Ionicons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { DetailSheet } from '@/components/design/DetailSheet';
import { FamilyReview } from '@/components/design/FamilyReview';
import { IngredientList } from '@/components/design/IngredientList';
import { NutritionBlock } from '@/components/design/NutritionBlock';
import { ProductVisual } from '@/components/design/ProductVisual';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useTheme } from '@/theme/ThemeProvider';
import type { EvidenceItem, Finding, FitStatus } from '@/types/models';
import type { RootStackParamList } from '@/types/navigation';
import { collectFindings, insightCopy } from '@/utils/presentation';

type Props = NativeStackScreenProps<RootStackParamList, 'AnalysisResult'>;

export function AnalysisResultScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const scan = route.params.scan;
  const [profileId, setProfileId] = useState(scan.familySummary[0]?.profileId ?? scan.profiles[0]?.profileId);
  const [sheet, setSheet] = useState<Finding | null>(null);
  const selected =
    scan.profiles.find((profile) => profile.profileId === profileId) ?? scan.profiles[0] ?? null;
  const member = scan.familySummary.find((item) => item.profileId === profileId) ?? scan.familySummary[0];
  const findings = useMemo(
    () =>
      selected
        ? collectFindings(selected).filter((item) => item.severity !== 'info' || item.insightType === 'HEALTH_CONTEXT')
        : [],
    [selected],
  );
  const evidence = selected?.evidence.filter((item) => item.title !== 'Limit of this screen').slice(0, 2) ?? [];
  const limitation = selected?.evidence.find((item) => /limit/i.test(item.title));

  return (
    <Screen edges={['top', 'left', 'right']}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => navigation.goBack()} style={styles.back}>
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </Pressable>
      <ProductVisual name={scan.product.name} brand={scan.product.brand} imageUrl={scan.product.imageUrl} />

      <FamilyReview members={scan.familySummary} selectedId={profileId} onSelect={setProfileId} />

      {selected && member ? (
        <View style={[styles.verdict, { backgroundColor: colors[fitTone(member.fit).soft], borderRadius: 22 }]}>
          <AppText variant="label" color={colors.textTertiary}>
            Why this matters · {member.profileName}
          </AppText>
          <AppText variant="display" style={{ color: colors[fitTone(member.fit).ink] }}>
            {member.statusLabel}
          </AppText>
          {findings.length > 0 ? (
            <View style={styles.chips}>
              {findings.slice(0, 4).map((finding) => (
                <Pressable
                  key={finding.id}
                  accessibilityRole="button"
                  accessibilityLabel={insightCopy(finding).title}
                  onPress={() => setSheet(finding)}
                  style={[styles.chip, { backgroundColor: colors.surface, borderRadius: 999 }]}
                >
                  <View style={[styles.dot, { backgroundColor: colors[fitTone(member.fit).ink] }]} />
                  <AppText variant="caption">{insightCopy(finding).title}</AppText>
                </Pressable>
              ))}
            </View>
          ) : null}
          {findings[0] ? (
            <View style={styles.recommend}>
              <AppText variant="body" color={colors.textSecondary}>
                {insightCopy(findings[0]).reason}
              </AppText>
            </View>
          ) : selected.summary ? (
            <AppText variant="body" color={colors.textSecondary}>
              {selected.summary}
            </AppText>
          ) : null}
        </View>
      ) : null}

      <NutritionBlock items={selected?.nutrition.length ? selected.nutrition : scan.product.nutrition} />
      <IngredientList
        items={selected?.ingredients.length ? selected.ingredients : scan.product.ingredients}
        onPress={(ingredient) => navigation.navigate('IngredientDetails', { ingredient, productName: scan.product.name })}
      />

      <AppText variant="caption" color={colors.textTertiary}>
        Food information for your profiles. Not a medical diagnosis.
      </AppText>

      <DetailSheet visible={Boolean(sheet)} title={sheet?.insightType === 'HEALTH_CONTEXT' ? 'Why this matters' : sheet ? insightCopy(sheet).title : 'Details'} onClose={() => setSheet(null)}>
        {sheet ? <FindingDetail finding={sheet} evidence={evidence} limitation={limitation} /> : null}
      </DetailSheet>
    </Screen>
  );
}

function fitTone(fit: FitStatus): {
  ink: 'suitable' | 'review' | 'avoid' | 'info';
  soft: 'suitableSoft' | 'reviewSoft' | 'avoidSoft' | 'infoSoft';
} {
  if (fit === 'DOES_NOT_FIT') return { ink: 'avoid', soft: 'avoidSoft' };
  if (fit === 'REVIEW') return { ink: 'review', soft: 'reviewSoft' };
  if (fit === 'INSUFFICIENT_INFORMATION') return { ink: 'info', soft: 'infoSoft' };
  return { ink: 'suitable', soft: 'suitableSoft' };
}

function FindingDetail({
  finding,
  evidence,
  limitation,
}: {
  finding: Finding;
  evidence: EvidenceItem[];
  limitation?: EvidenceItem;
}) {
  const { colors } = useTheme();
  const copy = insightCopy(finding);
  const source = evidence[0];
  const health = finding.insightType === 'HEALTH_CONTEXT';

  return (
    <View style={styles.sheet}>
      {health ? (
        <AppText variant="body" color={colors.textSecondary}>
          {finding.evidence || copy.reason}
        </AppText>
      ) : null}
      {copy.measure ? (
        <AppText variant="numeric">{copy.measure}</AppText>
      ) : null}
      <AppText variant="body" color={colors.textSecondary}>
        {copy.reason}
      </AppText>
      {source ? (
        <View style={styles.sheet}>
          <AppText variant="label" color={colors.textTertiary}>
            Evidence
          </AppText>
          <AppText variant="bodyMedium">{source.title}</AppText>
          {source.detail ? (
            <AppText variant="caption" color={colors.textSecondary}>
              {source.detail}
            </AppText>
          ) : null}
          {source.source ? (
            <AppText variant="caption" color={colors.textTertiary}>
              {source.source}
            </AppText>
          ) : null}
        </View>
      ) : null}
      {limitation?.detail ? (
        <AppText variant="caption" color={colors.textTertiary}>
          {limitation.detail}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  back: { width: 44, height: 44, justifyContent: 'center' },
  verdict: { gap: 10, marginTop: 16, padding: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 36, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  recommend: { gap: 4 },
  sheet: { gap: 8 },
});

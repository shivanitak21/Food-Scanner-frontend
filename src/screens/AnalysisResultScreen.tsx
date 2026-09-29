import Ionicons from '@expo/vector-icons/Ionicons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { DetailSheet } from '@/components/design/DetailSheet';
import { FamilyReview } from '@/components/design/FamilyReview';
import { IngredientList } from '@/components/design/IngredientList';
import { NutritionBlock } from '@/components/design/NutritionBlock';
import { ProductVisual } from '@/components/design/ProductVisual';
import { ProfileSelector } from '@/components/design/ProfileSelector';
import { StatusMark } from '@/components/design/StatusMark';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useTheme } from '@/theme/ThemeProvider';
import type { EvidenceItem, Finding } from '@/types/models';
import type { RootStackParamList } from '@/types/navigation';
import { collectFindings, insightCopy, nutrientRatio } from '@/utils/presentation';

type Props = NativeStackScreenProps<RootStackParamList, 'AnalysisResult'>;

export function AnalysisResultScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const scan = route.params.scan;
  const [profileId, setProfileId] = useState(scan.familySummary[0]?.profileId ?? scan.profiles[0]?.profileId);
  const [sheet, setSheet] = useState<Finding | null>(null);
  const selected =
    scan.profiles.find((profile) => profile.profileId === profileId) ?? scan.profiles[0] ?? null;
  const member = scan.familySummary.find((item) => item.profileId === profileId) ?? scan.familySummary[0];
  const findings = useMemo(() => (selected ? collectFindings(selected).filter((item) => item.severity !== 'info') : []), [selected]);
  const lead = findings[0];
  const leadCopy = lead ? insightCopy(lead) : null;
  const evidence = selected?.evidence.filter((item) => item.title !== 'Limit of this screen').slice(0, 2) ?? [];
  const limitation = selected?.evidence.find((item) => /limit/i.test(item.title));

  return (
    <Screen edges={['top', 'left', 'right']}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => navigation.goBack()} style={styles.back}>
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </Pressable>
      <ProductVisual name={scan.product.name} brand={scan.product.brand} imageUrl={scan.product.imageUrl} />

      <FamilyReview members={scan.familySummary} selectedId={profileId} onSelect={setProfileId} />
      {findings.length > 0 ? (
        <View style={styles.personal}>
          <AppText variant="label" color={colors.textTertiary}>
            What should I look at?
          </AppText>
          {findings.slice(0, 3).map((finding, index) => {
            const copy = insightCopy(finding);
            return (
              <Pressable key={finding.id} accessibilityRole="button" onPress={() => setSheet(finding)} style={styles.more}>
                <AppText variant="caption" color={colors.textTertiary}>
                  {String(index + 1).padStart(2, '0')}
                </AppText>
                <AppText variant="headline">{copy.title}</AppText>
                {copy.measure ? (
                  <AppText variant="body" color={colors.textSecondary}>
                    {copy.measure}
                  </AppText>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {selected && member ? (
        <View style={styles.personal}>
          <ProfileSelector members={scan.familySummary} selectedId={profileId} onSelect={setProfileId} />
          <AppText variant="display" style={styles.name}>
            {member.profileName}
          </AppText>
          <StatusMark status={selected.status} />
          {lead && leadCopy ? (
            <View style={styles.insight}>
              <AppText variant="headline">{leadCopy.title}</AppText>
              {leadCopy.measure ? <AppText variant="numeric">{leadCopy.measure}</AppText> : null}
              <MeasureBar
                ratio={
                  lead.value
                    ? nutrientRatio(leadCopy.title, Number(lead.value))
                    : selected.status === 'avoid'
                      ? 0.9
                      : 0.62
                }
                status={selected.status}
              />
              <AppText variant="body" color={colors.textSecondary}>
                {leadCopy.reason}
              </AppText>
              <Pressable accessibilityRole="button" accessibilityLabel="Why this matters" onPress={() => setSheet(lead)} style={styles.details}>
                <AppText variant="bodyMedium" color={colors.primary}>
                  Why this matters
                </AppText>
              </Pressable>
            </View>
          ) : (
            <AppText variant="body" color={colors.textSecondary}>
              No configured concern in the available data.
            </AppText>
          )}
          {findings.slice(1, 3).map((finding) => {
            const copy = insightCopy(finding);
            return (
              <Pressable key={finding.id} accessibilityRole="button" onPress={() => setSheet(finding)} style={styles.more}>
                <AppText variant="bodyMedium">{copy.title}</AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  {copy.reason}
                </AppText>
              </Pressable>
            );
          })}
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

function MeasureBar({ ratio, status }: { ratio: number; status: 'suitable' | 'review' | 'avoid' }) {
  const { colors } = useTheme();
  const width = `${Math.round(Math.max(0.08, Math.min(1, ratio)) * 100)}%` as `${number}%`;
  return (
    <View style={[styles.track, { backgroundColor: colors.cream }]}>
      <View style={[styles.fill, { width, backgroundColor: status === 'avoid' ? colors.avoid : status === 'review' ? colors.review : colors.primary }]} />
    </View>
  );
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
          Based on the health information you added to this profile. This is not a diagnosis, and it is not medical advice.
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
  personal: { gap: 10, marginTop: 12 },
  name: { fontSize: 34, lineHeight: 40 },
  insight: { gap: 8, paddingTop: 8 },
  details: { minHeight: 44, justifyContent: 'center' },
  more: { gap: 2, minHeight: 52, justifyContent: 'center' },
  track: { height: 4, borderRadius: 2, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2 },
  sheet: { gap: 8 },
});

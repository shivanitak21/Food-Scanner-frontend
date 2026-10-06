import Ionicons from '@expo/vector-icons/Ionicons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import { DetailSheet } from '@/components/design/DetailSheet';
import { FamilyReview } from '@/components/design/FamilyReview';
import { IngredientList } from '@/components/design/IngredientList';
import { NutritionBlock } from '@/components/design/NutritionBlock';
import { ProductVisual } from '@/components/design/ProductVisual';
import { WhatToKnow } from '@/components/design/WhatToKnow';
import { WhyThisMatters } from '@/components/design/WhyThisMatters';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useTheme } from '@/theme/ThemeProvider';
import type { EvidenceItem, FamilyMemberSummary, Finding } from '@/types/models';
import type { RootStackParamList } from '@/types/navigation';
import { collectFindings, insightCopy, productSignal } from '@/utils/presentation';

type Props = NativeStackScreenProps<RootStackParamList, 'AnalysisResult'>;

export function AnalysisResultScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { height } = useWindowDimensions();
  const scan = route.params.scan;
  const [profileId, setProfileId] = useState(scan.familySummary[0]?.profileId ?? scan.profiles[0]?.profileId);
  const [sheet, setSheet] = useState<Finding | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const selected = scan.profiles.find((profile) => profile.profileId === profileId) ?? scan.profiles[0] ?? null;
  const member = scan.familySummary.find((item) => item.profileId === profileId) ?? scan.familySummary[0];
  const findings = useMemo(
    () =>
      selected
        ? collectFindings(selected).filter((item) => item.severity !== 'info' || item.insightType === 'HEALTH_CONTEXT')
        : [],
    [selected],
  );
  const signal = useMemo(() => productSignal(scan), [scan]);
  const focus = findings.map((finding) => finding.nutrient || insightCopy(finding).title);
  const points = findings.slice(0, 2).map((finding) => {
    const copy = insightCopy(finding);
    return { id: finding.id, title: copy.title, measure: copy.measure, reason: copy.reason };
  });
  const evidence = selected?.evidence.filter((item) => item.title !== 'Limit of this screen').slice(0, 3) ?? [];
  const limitation = selected?.evidence.find((item) => /limit/i.test(item.title));

  const openProfile = (id: string) => {
    setProfileId(id);
    setProfileOpen(true);
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => navigation.goBack()} style={styles.back}>
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </Pressable>
      <ProductVisual name={scan.product.name} brand={scan.product.brand} imageUrl={scan.product.imageUrl} />

      <FamilyReview members={scan.familySummary} selectedId={profileId} onSelect={openProfile} />

      {signal ? <WhatToKnow signal={signal} /> : null}

      {member ? (
        <WhyThisMatters
          name={member.profileName}
          points={points}
          onExplain={findings[0] ? () => setSheet(findings[0]) : undefined}
        />
      ) : null}

      <NutritionBlock items={selected?.nutrition.length ? selected.nutrition : scan.product.nutrition} focus={focus} />
      <IngredientList
        items={selected?.ingredients.length ? selected.ingredients : scan.product.ingredients}
        onPress={(ingredient) => navigation.navigate('IngredientDetails', { ingredient, productName: scan.product.name })}
      />

      {evidence.length > 0 ? (
        <View style={styles.sources}>
          <AppText variant="label" color={colors.textTertiary}>
            Sources
          </AppText>
          {evidence.map((item) => (
            <AppText key={item.id} variant="caption" color={colors.textSecondary}>
              {[item.title, item.source].filter(Boolean).join(' · ')}
            </AppText>
          ))}
        </View>
      ) : null}

      <AppText variant="caption" color={colors.textTertiary}>
        Food information for your profiles. Not a medical diagnosis.
      </AppText>

      <DetailSheet
        visible={profileOpen && Boolean(member)}
        title={member?.profileName ?? 'Profile'}
        onClose={() => setProfileOpen(false)}
      >
        {member && selected ? (
          <ScrollView style={{ maxHeight: height * 0.62 }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheet}>
            <ProfileDetail member={member} findings={findings} evidence={evidence} limitation={limitation} />
          </ScrollView>
        ) : null}
      </DetailSheet>

      <DetailSheet
        visible={Boolean(sheet)}
        title={sheet?.insightType === 'HEALTH_CONTEXT' ? 'Why this matters' : sheet ? insightCopy(sheet).title : 'Details'}
        onClose={() => setSheet(null)}
      >
        {sheet ? <FindingDetail finding={sheet} evidence={evidence} limitation={limitation} /> : null}
      </DetailSheet>
    </Screen>
  );
}

function ProfileDetail({
  member,
  findings,
  evidence,
  limitation,
}: {
  member: FamilyMemberSummary;
  findings: Finding[];
  evidence: EvidenceItem[];
  limitation?: EvidenceItem;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.sheet}>
      <AppText variant="title">{member.statusLabel}</AppText>
      {findings.length > 0 ? (
        <View style={styles.sheet}>
          <AppText variant="label" color={colors.textTertiary}>
            Top concerns
          </AppText>
          {findings.slice(0, 4).map((finding) => {
            const copy = insightCopy(finding);
            return (
              <View key={finding.id} style={styles.point}>
                <AppText variant="headline">{copy.title}</AppText>
                {copy.measure ? (
                  <AppText variant="caption" color={colors.textSecondary}>
                    {copy.measure}
                  </AppText>
                ) : null}
                <AppText variant="body" color={colors.textSecondary}>
                  {copy.reason}
                </AppText>
              </View>
            );
          })}
        </View>
      ) : (
        <AppText variant="body" color={colors.textSecondary}>
          {member.headline || member.statusLabel}
        </AppText>
      )}
      {evidence[0] ? (
        <View style={styles.sheet}>
          <AppText variant="label" color={colors.textTertiary}>
            Evidence
          </AppText>
          <AppText variant="bodyMedium">{evidence[0].title}</AppText>
          {evidence[0].detail ? (
            <AppText variant="caption" color={colors.textSecondary}>
              {evidence[0].detail}
            </AppText>
          ) : null}
          {evidence[0].source ? (
            <AppText variant="caption" color={colors.textTertiary}>
              {evidence[0].source}
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
      {copy.measure ? <AppText variant="numeric">{copy.measure}</AppText> : null}
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
  sources: { gap: 6 },
  sheet: { gap: 12 },
  point: { gap: 2 },
});

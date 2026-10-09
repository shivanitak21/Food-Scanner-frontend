import Ionicons from '@expo/vector-icons/Ionicons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import { QuickFoodCheck } from '@/components/analysis/QuickFoodCheck';
import { DetailSheet } from '@/components/design/DetailSheet';
import { FamilyReview } from '@/components/design/FamilyReview';
import { IngredientList } from '@/components/design/IngredientList';
import { NutritionBlock } from '@/components/design/NutritionBlock';
import { ProductVisual } from '@/components/design/ProductVisual';
import { WhyThisMatters } from '@/components/design/WhyThisMatters';
import { Appear } from '@/components/motion/Appear';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useTheme } from '@/theme/ThemeProvider';
import type { EvidenceItem, FamilyMemberSummary, FamilyScan, Finding } from '@/types/models';
import type { RootStackParamList } from '@/types/navigation';
import { collectFindings, insightCopy } from '@/utils/presentation';
import { beginProfile } from '@/utils/profileEntry';

type Props = NativeStackScreenProps<RootStackParamList, 'AnalysisResult'>;

export function AnalysisResultScreen({ navigation, route }: Props) {
  const quick = route.params.quick;
  if (quick) {
    return (
      <Screen edges={['top', 'left', 'right']}>
        <QuickFoodCheck
          scan={quick}
          onBack={() => navigation.goBack()}
          onIngredient={(ingredient) => navigation.navigate('IngredientDetails', { ingredient, productName: quick.product.name })}
          onContext={() =>
            navigation.navigate('QuickContext', {
              productId: quick.productId,
              scanType: quick.scanType,
              context: quick.context,
            })
          }
          onCreateProfile={() => beginProfile(navigation, quick.profileDraft)}
        />
      </Screen>
    );
  }
  if (!route.params.scan) return null;
  return <FamilyAnalysis navigation={navigation} scan={route.params.scan} />;
}

function FamilyAnalysis({ navigation, scan }: { navigation: Props['navigation']; scan: FamilyScan }) {
  const { colors } = useTheme();
  const { height } = useWindowDimensions();
  const [profileId, setProfileId] = useState(scan.familySummary[0]?.profileId ?? scan.profiles[0]?.profileId);
  const [sheet, setSheet] = useState<Finding | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const selected = scan.profiles.find((profile) => profile.profileId === profileId) ?? scan.profiles[0] ?? null;
  const member = scan.familySummary.find((item) => item.profileId === profileId) ?? scan.familySummary[0];
  const findings = useMemo(
    () =>
      selected
        ? collectFindings(selected).filter((item) => item.severity !== 'info' || item.insightType === 'HEALTH_CONTEXT')
        : [],
    [selected],
  );
  const focus = findings.map((finding) => finding.nutrient || insightCopy(finding).title);
  const points = findings.slice(0, 3).map((finding) => {
    const copy = insightCopy(finding);
    return { id: finding.id, title: copy.title, measure: copy.measure, reason: copy.reason };
  });
  const evidence = selected?.evidence.filter((item) => item.title !== 'Limit of this screen').slice(0, 4) ?? [];
  const limitation = selected?.evidence.find((item) => /limit/i.test(item.title));

  return (
    <Screen edges={['top', 'left', 'right']}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => navigation.goBack()} style={styles.back}>
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </Pressable>
      <Appear index={0}>
        <ProductVisual name={scan.product.name} brand={scan.product.brand} imageUrl={scan.product.imageUrl} />
      </Appear>
      <Appear index={1}>
        <FamilyReview members={scan.familySummary} selectedId={profileId} onSelect={setProfileId} />
      </Appear>

      <Appear key={`${profileId ?? 'profile'}-nutrition`} index={2}>
        <View style={styles.stack}>
          {member ? (
            <Pressable accessibilityRole="button" accessibilityLabel={`${member.profileName} details`} onPress={() => setProfileOpen(true)}>
              <AppText variant="caption" color={colors.primary}>
                Profile details
              </AppText>
            </Pressable>
          ) : null}
          <NutritionBlock items={selected?.nutrition.length ? selected.nutrition : scan.product.nutrition} focus={focus} />
        </View>
      </Appear>
      <Appear key={`${profileId ?? 'profile'}-cautions`} index={3}>
        <Cautions findings={findings} onPress={setSheet} />
      </Appear>
      {member ? (
        <Appear key={`${profileId ?? 'profile'}-why`} index={4}>
          <WhyThisMatters
            name={member.profileName}
            points={points}
            onExplain={findings[0] ? () => setSheet(findings[0]) : undefined}
          />
        </Appear>
      ) : null}
      <Appear key={`${profileId ?? 'profile'}-ingredients`} index={5}>
        <IngredientList
          items={selected?.ingredients.length ? selected.ingredients : scan.product.ingredients}
          onPress={(ingredient) => navigation.navigate('IngredientDetails', { ingredient, productName: scan.product.name })}
        />
      </Appear>
      <Appear key={`${profileId ?? 'profile'}-evidence`} index={6}>
        <View style={styles.stack}>
          {evidence.length > 0 ? (
            <View style={styles.sources}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: evidenceOpen }}
                onPress={() => setEvidenceOpen((value) => !value)}
                style={styles.sourceHead}
              >
                <AppText variant="title">Evidence</AppText>
                <Ionicons name={evidenceOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textTertiary} />
              </Pressable>
              {(evidenceOpen ? evidence : evidence.slice(0, 1)).map((item) => (
                <AppText key={item.id} variant="caption" color={colors.textSecondary}>
                  {[item.title, item.source].filter(Boolean).join(' · ')}
                </AppText>
              ))}
            </View>
          ) : null}
          <AppText variant="caption" color={colors.textTertiary}>
            Food information for your profiles. Not a medical diagnosis.
          </AppText>
        </View>
      </Appear>

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

function Cautions({ findings, onPress }: { findings: Finding[]; onPress: (finding: Finding) => void }) {
  const { colors, radius } = useTheme();
  return (
    <View style={styles.stack}>
      <AppText variant="title">Cautions</AppText>
      {findings.length === 0 ? (
        <AppText variant="body" color={colors.textSecondary}>
          No cautions for this profile.
        </AppText>
      ) : (
        findings.map((finding) => {
          const copy = insightCopy(finding);
          const severe = finding.severity === 'avoid';
          return (
            <Pressable
              key={finding.id}
              accessibilityRole="button"
              accessibilityLabel={copy.title}
              onPress={() => onPress(finding)}
              style={[styles.caution, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}
            >
              <View style={[styles.badge, { backgroundColor: severe ? colors.avoidSoft : colors.reviewSoft }]}>
                <Ionicons name="warning-outline" size={16} color={severe ? colors.avoid : colors.review} />
              </View>
              <View style={styles.copy}>
                <AppText variant="headline">{copy.title}</AppText>
                <AppText variant="caption" color={colors.textSecondary} numberOfLines={2}>
                  {copy.reason}
                </AppText>
              </View>
            </Pressable>
          );
        })
      )}
    </View>
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
  stack: { gap: 12 },
  sources: { gap: 6 },
  sourceHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  caution: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderWidth: StyleSheet.hairlineWidth },
  badge: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 2 },
  sheet: { gap: 12 },
  point: { gap: 2 },
});

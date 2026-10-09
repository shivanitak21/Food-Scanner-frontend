import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { EATING_OPTIONS } from '@/constants/profileOptions';
import { refineQuickScan } from '@/services/api/scansApi';
import { useTheme } from '@/theme/ThemeProvider';
import type { DietPreference, HealthConsideration, QuickContextInput } from '@/types/models';
import type { RootStackParamList } from '@/types/navigation';
import { ageFromDateOfBirth } from '@/utils/age';
import { getErrorMessage } from '@/utils/errors';

type Props = NativeStackScreenProps<RootStackParamList, 'QuickContext'>;

const HEALTH = [
  { id: 'none', label: 'None' },
  { id: 'diabetes', label: 'Diabetes' },
  { id: 'high_blood_pressure', label: 'High blood pressure' },
  { id: 'high_cholesterol', label: 'High cholesterol' },
  { id: 'other', label: 'Other' },
] as const;

const WATCH = [
  { id: 'sugar', label: 'Sugar' },
  { id: 'sodium', label: 'Sodium' },
  { id: 'saturated_fat', label: 'Saturated fat' },
  { id: 'calories', label: 'Calories' },
  { id: 'protein', label: 'Protein' },
  { id: 'fiber', label: 'Fiber' },
];

const GOALS = [
  { id: 'balanced', label: 'Balanced nutrition' },
  { id: 'more_protein', label: 'More protein' },
  { id: 'lower_sugar', label: 'Lower sugar' },
  { id: 'lower_sodium', label: 'Lower sodium' },
];

export function QuickContextScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const current = route.params.context;
  const [ageMode, setAgeMode] = useState<'dob' | 'age'>(current?.dateOfBirth ? 'dob' : current?.age !== null && current?.age !== undefined ? 'age' : 'dob');
  const [dateOfBirth, setDateOfBirth] = useState(current?.dateOfBirth ?? '');
  const [age, setAge] = useState(current?.age === null || current?.age === undefined ? '' : String(current.age));
  const [eating, setEating] = useState<string[]>(current?.eating ?? []);
  const [health, setHealth] = useState<string>(current?.healthConditions[0] ?? 'none');
  const [watch, setWatch] = useState<string[]>(current?.thingsToWatch ?? []);
  const [goals, setGoals] = useState<string[]>(current?.goals ?? []);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const toggle = (list: string[], id: string, exclusive?: string) => {
    if (exclusive && id === exclusive) return [id];
    const without = list.filter((item) => item !== id && item !== exclusive);
    return list.includes(id) ? without : [...without, id];
  };

  const apply = async () => {
    const context = buildContext({ ageMode, dateOfBirth, age, eating, health, watch, goals });
    if (context.error) {
      setError(context.error);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const quick = await refineQuickScan({
        productId: route.params.productId,
        scanType: route.params.scanType,
        context: context.value,
      });
      navigation.navigate('AnalysisResult', { quick });
    } catch (reason) {
      setError(getErrorMessage(reason));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen
      edges={['left', 'right', 'bottom']}
      footer={
        <View style={styles.footer}>
          <Button label="See result" onPress={() => void apply()} loading={submitting} />
          <Button label="Skip" variant="ghost" onPress={() => navigation.goBack()} />
        </View>
      }
    >
      <View style={styles.stack}>
        <AppText variant="label" color={colors.textTertiary}>
          Optional
        </AppText>
        <AppText variant="title">Want a more relevant result?</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Skip anything. A result is still shown from the product itself.
        </AppText>
        {error ? (
          <AppText variant="caption" color={colors.avoid}>
            {error}
          </AppText>
        ) : null}

        <AppText variant="headline">Age / DOB</AppText>
        <View style={styles.wrap}>
          <Chip label="Date of birth" selected={ageMode === 'dob'} selection="single" onPress={() => setAgeMode('dob')} />
          <Chip label="Age" selected={ageMode === 'age'} selection="single" onPress={() => setAgeMode('age')} />
        </View>
        {ageMode === 'dob' ? (
          <TextField label="Date of birth" value={dateOfBirth} onChangeText={setDateOfBirth} placeholder="YYYY-MM-DD" autoCapitalize="none" />
        ) : (
          <TextField label="Age" value={age} onChangeText={setAge} keyboardType="number-pad" />
        )}

        <AppText variant="headline">Diet</AppText>
        <View style={styles.wrap}>
          {EATING_OPTIONS.map((option) => (
            <Chip
              key={option.id}
              label={option.label}
              selected={eating.includes(option.id)}
              onPress={() => setEating((currentEating) => toggle(currentEating, option.id, 'non-vegetarian'))}
            />
          ))}
        </View>

        <AppText variant="headline">Health considerations</AppText>
        <View style={styles.wrap}>
          {HEALTH.map((option) => (
            <Chip key={option.id} label={option.label} selected={health === option.id} selection="single" onPress={() => setHealth(option.id)} />
          ))}
        </View>

        <AppText variant="headline">Things to watch</AppText>
        <View style={styles.wrap}>
          {WATCH.map((option) => (
            <Chip key={option.id} label={option.label} selected={watch.includes(option.id)} onPress={() => setWatch((currentWatch) => toggle(currentWatch, option.id))} />
          ))}
        </View>

        <AppText variant="headline">Goals</AppText>
        <View style={styles.wrap}>
          {GOALS.map((option) => (
            <Chip key={option.id} label={option.label} selected={goals.includes(option.id)} onPress={() => setGoals((currentGoals) => toggle(currentGoals, option.id))} />
          ))}
        </View>
      </View>
    </Screen>
  );
}

function buildContext(input: {
  ageMode: 'dob' | 'age';
  dateOfBirth: string;
  age: string;
  eating: string[];
  health: string;
  watch: string[];
  goals: string[];
}): { value: QuickContextInput; error: string | null } {
  let age: number | null = null;
  let dateOfBirth: string | null = null;
  if (input.ageMode === 'dob' && input.dateOfBirth.trim()) {
    const parsed = ageFromDateOfBirth(input.dateOfBirth.trim());
    if (parsed === null) return { value: {}, error: 'Use a real date as YYYY-MM-DD, or leave it blank.' };
    dateOfBirth = input.dateOfBirth.trim();
    age = parsed;
  }
  if (input.ageMode === 'age' && input.age.trim()) {
    const parsed = Number(input.age.trim());
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 120) {
      return { value: {}, error: 'Enter an age from 0 to 120, or leave it blank.' };
    }
    age = parsed;
  }
  const selected = EATING_OPTIONS.filter((option) => input.eating.includes(option.id));
  const diet: DietPreference = selected.some((option) => option.diet === 'vegan')
    ? 'vegan'
    : selected.some((option) => option.diet === 'vegetarian')
      ? 'vegetarian'
      : 'none';
  const healthConditions = input.health === 'none' ? [] : [input.health as HealthConsideration];
  return {
    error: null,
    value: {
      age,
      dateOfBirth,
      diet,
      dietaryPreferences: selected.map((option) => option.preference).filter((item): item is string => Boolean(item)),
      healthConditions,
      goals: input.goals,
      thingsToWatch: input.watch,
      eating: input.eating,
    },
  };
}

const styles = StyleSheet.create({
  stack: { gap: 12, paddingBottom: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  footer: { gap: 8 },
});

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { AppText } from '@/components/ui/AppText';
import { TextField } from '@/components/ui/TextField';
import {
  ALLERGY_OPTIONS,
  EATING_OPTIONS,
  GOAL_OPTIONS,
  LIMIT_OPTIONS,
  WHO_OPTIONS,
  allergyLabel,
  limitLabel,
} from '@/constants/profileOptions';
import { useTheme } from '@/theme/ThemeProvider';
import type { LifeStage, Profile, ProfileInput, ProfileRole } from '@/types/models';
import { ageFromDateOfBirth, ageGroupFromAge } from '@/utils/age';
import { ApiError, getErrorMessage } from '@/utils/errors';

const schema = z.object({
  name: z.string().trim().min(1, 'Enter a name').max(60, 'Use 60 characters or fewer'),
  lifeStage: z.enum(['me', 'adult', 'child', 'teen', 'baby', 'pregnancy', 'breastfeeding', 'senior', 'other']),
  ageMode: z.enum(['dob', 'age']),
  dateOfBirth: z.string(),
  age: z.string(),
  eating: z.array(z.string()),
  allergies: z.array(z.string()),
  limits: z.array(z.string()),
  goals: z.array(z.string()).max(3, 'Choose up to 3 goals'),
  notes: z.string().max(280, 'Use 280 characters or fewer'),
});

type FormValues = z.infer<typeof schema>;

const STEPS = ['Who', 'Eating', 'Allergies', 'Watch', 'Goals', 'Health'] as const;

function inferStage(profile?: Profile | null): LifeStage {
  if (profile?.lifeStage) return profile.lifeStage;
  if (!profile) return 'adult';
  if (profile.role === 'self') return 'me';
  if (profile.role === 'baby' || profile.ageGroup === 'baby') return 'baby';
  if (profile.ageGroup === 'teen') return 'teen';
  if (profile.ageGroup === 'older_adult') return 'senior';
  if (profile.role === 'child' || profile.ageGroup === 'child') return 'child';
  if (profile.role === 'adult') return 'adult';
  return 'other';
}

function inferEating(profile?: Profile | null): string[] {
  const selected = new Set<string>();
  if (profile?.diet === 'vegan') selected.add('vegan');
  if (profile?.diet === 'vegetarian') selected.add('vegetarian');
  for (const option of EATING_OPTIONS) {
    if (!option.preference) continue;
    if (profile?.dietaryPreferences.some((item) => item.toLowerCase() === option.preference?.toLowerCase())) {
      selected.add(option.id);
    }
  }
  return [...selected];
}

function inferAgeMode(profile?: Profile | null): 'dob' | 'age' {
  if (profile?.dateOfBirth) return 'dob';
  if (profile?.age !== null && profile?.age !== undefined) return 'age';
  return 'dob';
}

function toValues(profile?: Profile | null): FormValues {
  return {
    name: profile?.name ?? '',
    lifeStage: inferStage(profile),
    ageMode: inferAgeMode(profile),
    dateOfBirth: profile?.dateOfBirth ?? '',
    age: profile?.age === null || profile?.age === undefined ? '' : String(profile.age),
    eating: inferEating(profile),
    allergies: profile?.allergies ?? [],
    limits: profile?.limits ?? [],
    goals: profile?.goals ?? [],
    notes: profile?.notes ?? '',
  };
}

type Props = {
  initial?: Profile | null;
  allowedRoles: ProfileRole[];
  submitLabel: string;
  submitting?: boolean;
  deleting?: boolean;
  onSubmit: (input: ProfileInput) => Promise<void>;
  onDelete?: () => void;
  report?: {
    detail: string;
    onPress: (input: ProfileInput) => Promise<void>;
  };
};

export function ProfileForm({
  initial,
  allowedRoles,
  submitLabel,
  submitting = false,
  deleting = false,
  onSubmit,
  onDelete,
  report,
}: Props) {
  const { colors } = useTheme();
  const [step, setStep] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    setError,
    reset,
    trigger,
    formState: { errors },
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toValues(initial),
  });

  useEffect(() => {
    reset(toValues(initial));
  }, [initial, reset]);

  const who = WHO_OPTIONS.filter((option) => option.id !== 'me' || allowedRoles.includes('self'));
  const ageMode = watch('ageMode');
  const dateOfBirth = watch('dateOfBirth');
  const calculatedAge = ageMode === 'dob' ? ageFromDateOfBirth(dateOfBirth) : null;

  const buildInput = (values: FormValues): ProfileInput | null => {
    let age: number | null = null;
    let dateOfBirth: string | null = null;
    if (values.ageMode === 'dob') {
      const text = values.dateOfBirth.trim();
      if (text) {
        age = ageFromDateOfBirth(text);
        if (age === null) {
          setError('dateOfBirth', { message: 'Use a real date as YYYY-MM-DD' });
          setStep(0);
          return null;
        }
        dateOfBirth = text;
      }
    } else {
      const ageText = values.age.trim();
      if (ageText) {
        const parsed = Number(ageText);
        if (!Number.isInteger(parsed) || parsed < 0 || parsed > 120) {
          setError('age', { message: 'Enter an age from 0 to 120, or leave it blank' });
          setStep(0);
          return null;
        }
        age = parsed;
      }
    }
    const stage = WHO_OPTIONS.find((option) => option.id === values.lifeStage) ?? WHO_OPTIONS[1];
    const eating = EATING_OPTIONS.filter((option) => values.eating.includes(option.id));
    const diet = eating.some((option) => option.diet === 'vegan')
      ? 'vegan'
      : eating.some((option) => option.diet === 'vegetarian')
        ? 'vegetarian'
        : 'none';
    const dietaryPreferences = eating
      .map((option) => option.preference)
      .filter((item): item is string => Boolean(item));
    return {
      name: values.name.trim(),
      role: stage.role,
      ageGroup: age === null ? stage.ageGroup : ageGroupFromAge(age),
      age,
      dateOfBirth,
      diet,
      dietaryPreferences,
      allergies: values.allergies,
      limits: values.limits,
      goals: values.goals.slice(0, 3),
      lifeStage: stage.id,
      notes: values.notes.trim() ? values.notes.trim() : null,
      isPrimary: stage.role === 'self',
    };
  };

  const save = (intent: 'save' | 'report') =>
    handleSubmit(async (values) => {
      setFormError(null);
      const input = buildInput(values);
      if (!input) return;
      try {
        if (intent === 'report' && report) await report.onPress(input);
        else await onSubmit(input);
      } catch (error) {
        if (error instanceof ApiError) setFormError(error.message);
        else setFormError(getErrorMessage(error));
      }
    });

  const next = async () => {
    if (step === 0) {
      const valid = await trigger(['name', 'lifeStage']);
      if (!valid) return;
      const values = watch();
      if (values.ageMode === 'dob' && values.dateOfBirth.trim() && ageFromDateOfBirth(values.dateOfBirth) === null) {
        setError('dateOfBirth', { message: 'Use a real date as YYYY-MM-DD' });
        return;
      }
      if (values.ageMode === 'age' && values.age.trim()) {
        const parsed = Number(values.age.trim());
        if (!Number.isInteger(parsed) || parsed < 0 || parsed > 120) {
          setError('age', { message: 'Enter an age from 0 to 120, or leave it blank' });
          return;
        }
      }
    }
    setStep((value) => Math.min(value + 1, STEPS.length - 1));
  };

  return (
    <View style={styles.form}>
      <AppText variant="label" color={colors.textTertiary}>
        {STEPS[step]} · {step + 1} of {STEPS.length}
      </AppText>
      {formError ? (
        <AppText variant="caption" color={colors.avoid}>
          {formError}
        </AppText>
      ) : null}

      {step === 0 ? (
        <View style={styles.block}>
          <AppText variant="display">Who is this for?</AppText>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField label="Name" value={value} onBlur={onBlur} onChangeText={onChange} autoComplete="name" error={errors.name?.message} />
            )}
          />
          <Controller
            control={control}
            name="lifeStage"
            render={({ field: { value, onChange } }) => (
              <View style={styles.wrap}>
                {who.map((option) => (
                  <Chip key={option.id} label={option.label} selected={value === option.id} selection="single" onPress={() => onChange(option.id)} />
                ))}
              </View>
            )}
          />
          <Controller
            control={control}
            name="ageMode"
            render={({ field: { value, onChange } }) => (
              <View style={styles.wrap}>
                <Chip label="Date of birth" selected={value === 'dob'} selection="single" onPress={() => onChange('dob')} />
                <Chip label="Age" selected={value === 'age'} selection="single" onPress={() => onChange('age')} />
              </View>
            )}
          />
          {ageMode === 'dob' ? (
            <Controller
              control={control}
              name="dateOfBirth"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label="Date of birth"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="numbers-and-punctuation"
                  placeholder="YYYY-MM-DD"
                  error={errors.dateOfBirth?.message}
                />
              )}
            />
          ) : (
            <Controller
              control={control}
              name="age"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField label="Age" value={value} onBlur={onBlur} onChangeText={onChange} keyboardType="number-pad" error={errors.age?.message} />
              )}
            />
          )}
          {calculatedAge !== null ? (
            <AppText variant="caption" color={colors.textSecondary}>
              {`Age ${calculatedAge}`}
            </AppText>
          ) : null}
        </View>
      ) : null}

      {step === 1 ? (
        <ChoiceStep
          title="How do they eat?"
          hint="Choose every style that applies. Vegetarian and vegan change the ingredient check."
          control={control}
          name="eating"
          options={EATING_OPTIONS.map((option) => ({ value: option.id, label: option.label }))}
          exclusive="non-vegetarian"
        />
      ) : null}

      {step === 2 ? (
        <ChoiceStep
          title="Allergies"
          hint="These are checked against the ingredient list. A listed allergen means the product doesn't fit."
          control={control}
          name="allergies"
          tone="avoid"
          options={ALLERGY_OPTIONS.map((value) => ({ value, label: allergyLabel(value) }))}
        />
      ) : null}

      {step === 3 ? (
        <ChoiceStep
          title="Things to watch"
          hint="Choose what should change the review when it shows up on the package."
          control={control}
          name="limits"
          tone="review"
          options={LIMIT_OPTIONS.map((value) => ({ value, label: limitLabel(value) }))}
        />
      ) : null}

      {step === 4 ? (
        <ChoiceStep
          title="Food goals"
          hint="Choose up to 3. Goals shape what we highlight. They do not create a medical conclusion."
          control={control}
          name="goals"
          max={3}
          options={GOAL_OPTIONS.map((value) => ({ value, label: value }))}
        />
      ) : null}

      {step === 5 ? (
        <View style={styles.block}>
          <AppText variant="display">Optional health context</AppText>
          <AppText variant="body" color={colors.textSecondary}>
            Share health information only if you want food insights to consider it. The app will not diagnose a condition.
          </AppText>
          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField label="Health note, optional" value={value} onBlur={onBlur} onChangeText={onChange} error={errors.notes?.message} />
            )}
          />
          <Button label={submitLabel} onPress={() => void save('save')()} loading={submitting} />
          {report ? (
            <Button label="Upload a health report" variant="secondary" onPress={() => void save('report')()} />
          ) : null}
          <AppText variant="caption" color={colors.textTertiary}>
            {report?.detail ?? 'You can skip this and add it later.'}
          </AppText>
          {onDelete ? <Button label="Remove profile" variant="danger" onPress={onDelete} loading={deleting} icon="trash-outline" /> : null}
        </View>
      ) : (
        <View style={styles.nav}>
          {step > 0 ? <Button label="Back" variant="secondary" onPress={() => setStep((value) => value - 1)} /> : null}
          <Button label="Continue" onPress={() => void next()} />
        </View>
      )}
    </View>
  );
}

function ChoiceStep({
  title,
  hint,
  control,
  name,
  options,
  tone = 'default',
  max,
  exclusive,
}: {
  title: string;
  hint: string;
  control: ReturnType<typeof useForm<FormValues>>['control'];
  name: 'eating' | 'allergies' | 'limits' | 'goals';
  options: { value: string; label: string }[];
  tone?: 'default' | 'avoid' | 'review';
  max?: number;
  exclusive?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.block}>
      <AppText variant="display">{title}</AppText>
      <AppText variant="body" color={colors.textSecondary}>
        {hint}
      </AppText>
      <Controller
        control={control}
        name={name}
        render={({ field: { value, onChange } }) => (
          <View style={styles.wrap}>
            {options.map((option) => {
              const selected = value.some((item) => item.toLowerCase() === option.value.toLowerCase());
              return (
                <Chip
                  key={option.value}
                  label={option.label}
                  tone={tone}
                  selected={selected}
                  onPress={() => {
                    if (selected) {
                      onChange(value.filter((item) => item.toLowerCase() !== option.value.toLowerCase()));
                      return;
                    }
                    if (exclusive && option.value === exclusive) {
                      onChange([option.value]);
                      return;
                    }
                    const withoutExclusive = exclusive ? value.filter((item) => item !== exclusive) : value;
                    if (max && withoutExclusive.length >= max) return;
                    onChange([...withoutExclusive, option.value]);
                  }}
                />
              );
            })}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 18 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  block: { gap: 12 },
  nav: { gap: 10 },
});

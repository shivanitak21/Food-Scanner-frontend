import Ionicons from '@expo/vector-icons/Ionicons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { AppText } from '@/components/ui/AppText';
import { TextField } from '@/components/ui/TextField';
import {
  AGE_GROUP_OPTIONS,
  ALLERGY_OPTIONS,
  DIET_OPTIONS,
  LIMIT_OPTIONS,
  PREFERENCE_OPTIONS,
  ROLE_OPTIONS,
} from '@/constants/profileOptions';
import { useTheme } from '@/theme/ThemeProvider';
import type { Profile, ProfileInput, ProfileRole } from '@/types/models';
import { ApiError, getErrorMessage } from '@/utils/errors';

const schema = z.object({
  name: z.string().trim().min(1, 'Enter a name').max(60, 'Use 60 characters or fewer'),
  role: z.enum(['self', 'adult', 'child', 'baby', 'other']),
  ageGroup: z.enum(['baby', 'child', 'teen', 'adult', 'older_adult']).nullable(),
  age: z.string(),
  diet: z.enum(['none', 'vegetarian', 'vegan']),
  allergies: z.array(z.string()),
  limits: z.array(z.string()),
  dietaryPreferences: z.array(z.string()),
  notes: z.string().max(280, 'Use 280 characters or fewer'),
});

type FormValues = z.infer<typeof schema>;

const fieldMap: Record<string, keyof FormValues> = {
  name: 'name',
  role: 'role',
  age: 'age',
  ageGroup: 'ageGroup',
  age_group: 'ageGroup',
  diet: 'diet',
  notes: 'notes',
  allergies: 'allergies',
  limits: 'limits',
  dietaryPreferences: 'dietaryPreferences',
  dietary_preferences: 'dietaryPreferences',
};

function unique(items: string[]): string[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function toValues(profile?: Profile | null, fallbackRole: ProfileRole = 'adult'): FormValues {
  return {
    name: profile?.name ?? '',
    role: profile?.role ?? fallbackRole,
    ageGroup: profile?.ageGroup ?? null,
    age: profile?.age === null || profile?.age === undefined ? '' : String(profile.age),
    diet: profile?.diet ?? 'none',
    allergies: profile?.allergies ?? [],
    limits: profile?.limits ?? [],
    dietaryPreferences: profile?.dietaryPreferences ?? [],
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
  const { colors, radius } = useTheme();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toValues(initial, allowedRoles[0] ?? 'adult'),
  });

  useEffect(() => {
    reset(toValues(initial, allowedRoles[0] ?? 'adult'));
  }, [allowedRoles, initial, reset]);

  const submit = (intent: 'save' | 'report') =>
    handleSubmit(async (values) => {
    setFormError(null);
    const ageText = values.age.trim();
    let age: number | null = null;
    if (ageText) {
      const parsed = Number(ageText);
      if (!Number.isInteger(parsed) || parsed < 0 || parsed > 120) {
        setError('age', { message: 'Enter an age from 0 to 120, or leave it blank' });
        return;
      }
      age = parsed;
    }

    const input: ProfileInput = {
      name: values.name.trim(),
      role: values.role,
      ageGroup: values.ageGroup,
      age,
      diet: values.diet,
      dietaryPreferences: values.dietaryPreferences,
      allergies: values.allergies,
      limits: values.limits,
      notes: initial?.notes ?? null,
      isPrimary: values.role === 'self',
    };

    try {
      if (intent === 'report' && report) await report.onPress(input);
      else await onSubmit(input);
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors) {
        let matched = false;
        for (const [key, message] of Object.entries(error.fieldErrors)) {
          const field = fieldMap[key];
          if (!field || field === 'allergies' || field === 'limits' || field === 'dietaryPreferences') continue;
          setError(field, { message });
          matched = true;
        }
        if (!matched) setFormError(error.message);
        return;
      }
      setFormError(getErrorMessage(error));
    }
  });

  return (
    <View style={styles.form}>
      {formError ? (
        <AppText variant="caption" color={colors.avoid}>
          {formError}
        </AppText>
      ) : null}

      <SectionTitle title="Name" />
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Name"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            autoComplete="name"
            error={errors.name?.message}
          />
        )}
      />

      {report ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Report"
          onPress={() => void submit('report')()}
          style={[styles.report, { backgroundColor: colors.cream, borderRadius: radius.md }]}
        >
          <Ionicons name="document-text-outline" size={22} color={colors.primary} />
          <View style={styles.reportCopy}>
            <AppText variant="headline">Report</AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {report.detail}
            </AppText>
          </View>
        </Pressable>
      ) : null}

      <FieldLabel label="Who they are" hint="This names the person. Age group is what changes the product review." />
      <Controller
        control={control}
        name="role"
        render={({ field: { value, onChange } }) => (
          <View style={styles.wrap}>
            {ROLE_OPTIONS.filter((option) => allowedRoles.includes(option.value)).map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                selected={value === option.value}
                selection="single"
                onPress={() => onChange(option.value)}
              />
            ))}
          </View>
        )}
      />

      <FieldLabel label="Age group" hint="Baby and child change the review, including honey, added sugar, salt, and caffeine. Adult, teen, and older adult do not add an age finding." />
      <Controller
        control={control}
        name="ageGroup"
        render={({ field: { value, onChange } }) => (
          <View style={styles.wrap}>
            <Chip label="Not set" selected={value === null} selection="single" onPress={() => onChange(null)} />
            {AGE_GROUP_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                selected={value === option.value}
                selection="single"
                onPress={() => onChange(option.value)}
              />
            ))}
          </View>
        )}
      />

      <Controller
        control={control}
        name="age"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Age, optional"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            keyboardType="number-pad"
            error={errors.age?.message}
          />
        )}
      />
      <AppText variant="caption" color={colors.textSecondary}>
        Under 1 and under 2 change the review when the age group is not already baby or child.
      </AppText>

      <SectionTitle title="Diet" hint="Vegetarian and vegan change the result when those ingredients are listed." />
      <Controller
        control={control}
        name="diet"
        render={({ field: { value, onChange } }) => (
          <View style={styles.wrap}>
            {DIET_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                selected={value === option.value}
                selection="single"
                onPress={() => onChange(option.value)}
              />
            ))}
          </View>
        )}
      />

      <MultiField
        controlName="allergies"
        label="Allergies"
        hint="A listed allergen marks the product Important for this person."
        options={ALLERGY_OPTIONS}
        tone="avoid"
        control={control}
      />
      <MultiField
        controlName="limits"
        label="Things to limit"
        hint="Sugar, sodium, saturated fat, caffeine, and sweeteners change the review when they are on the product."
        options={LIMIT_OPTIONS}
        tone="review"
        control={control}
      />
      <MultiField
        controlName="dietaryPreferences"
        label="Other preferences"
        hint="Gluten-free, nut-free, halal, kosher, and organic change the review. Low sugar and low sodium count as limits."
        options={PREFERENCE_OPTIONS}
        control={control}
      />

      <Button label={submitLabel} onPress={() => void submit('save')()} loading={submitting} />
      {onDelete ? (
        <Button label="Remove profile" variant="danger" onPress={onDelete} loading={deleting} icon="trash-outline" />
      ) : null}
    </View>
  );
}

function SectionTitle({ title, hint }: { title: string; hint?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.block}>
      <AppText variant="headline">{title}</AppText>
      {hint ? (
        <AppText variant="caption" color={colors.textSecondary}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

function FieldLabel({ label, hint }: { label: string; hint?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.block}>
      <AppText variant="label" color={colors.textSecondary}>
        {label}
      </AppText>
      {hint ? (
        <AppText variant="caption" color={colors.textSecondary}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

function MultiField({
  controlName,
  label,
  hint,
  options,
  tone = 'default',
  control,
}: {
  controlName: 'allergies' | 'limits' | 'dietaryPreferences';
  label: string;
  hint?: string;
  options: string[];
  tone?: 'default' | 'avoid' | 'review';
  control: ReturnType<typeof useForm<FormValues>>['control'];
}) {
  return (
    <View style={styles.block}>
      <SectionTitle title={label} hint={hint} />
      <Controller
        control={control}
        name={controlName}
        render={({ field: { value, onChange } }) => (
          <View style={styles.wrap}>
            {unique([...options, ...value]).map((option) => (
              <Chip
                key={option}
                label={option}
                tone={tone}
                selected={value.some((item) => item.toLowerCase() === option.toLowerCase())}
                onPress={() => {
                  const exists = value.some((item) => item.toLowerCase() === option.toLowerCase());
                  onChange(exists ? value.filter((item) => item.toLowerCase() !== option.toLowerCase()) : [...value, option]);
                }}
              />
            ))}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  block: {
    gap: 10,
  },
  report: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 76,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  reportCopy: {
    flex: 1,
    gap: 2,
  },
});

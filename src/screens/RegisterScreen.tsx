import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { z } from 'zod';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { register as registerAccount } from '@/services/api/authApi';
import { useAuthStore } from '@/state/authStore';
import { useSettingsStore } from '@/state/settingsStore';
import { useTheme } from '@/theme/ThemeProvider';
import type { AuthStackParamList } from '@/types/navigation';
import { ApiError, getErrorMessage } from '@/utils/errors';

const schema = z
  .object({
    name: z.string().trim().min(1, 'Enter your name').max(60, 'Use 60 characters or fewer'),
    email: z.email('Enter a valid email'),
    password: z.string().min(8, 'Use at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;
type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const setSession = useAuthStore((state) => state.setSession);
  const exitGuest = useSettingsStore((state) => state.exitGuest);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    setSubmitting(true);
    try {
      const session = await registerAccount({
        name: values.name,
        email: values.email,
        password: values.password,
      });
      await setSession(session.user, session.token);
      exitGuest();
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors) {
        const known = ['name', 'email', 'password'] as const;
        let matched = false;
        for (const field of known) {
          const message = error.fieldErrors[field];
          if (message) {
            setError(field, { message });
            matched = true;
          }
        }
        if (!matched) setFormError(error.message);
      } else {
        setFormError(getErrorMessage(error));
      }
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <View style={styles.header}>
        <AppText variant="title">Create your account</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Your food profiles stay with your account. Analysis stays on the server.
        </AppText>
      </View>
      {formError ? (
        <AppText variant="caption" color={colors.avoid}>
          {formError}
        </AppText>
      ) : null}
      <Controller
        control={control}
        name="name"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextField label="Name" value={value} onChangeText={onChange} onBlur={onBlur} autoComplete="name" error={errors.name?.message} />
        )}
      />
      <Controller
        control={control}
        name="email"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextField
            label="Email"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            error={errors.email?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextField
            label="Password"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            error={errors.password?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextField
            label="Confirm password"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            secureTextEntry
            textContentType="newPassword"
            error={errors.confirmPassword?.message}
          />
        )}
      />
      <Button label="Create account" onPress={() => void submit()} loading={submitting} />
      <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Login')} style={styles.link}>
        <AppText variant="bodyMedium" color={colors.primary}>
          I already have an account
        </AppText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
    marginBottom: 8,
  },
  link: {
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
});

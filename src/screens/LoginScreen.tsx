import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { z } from 'zod';

import { AppText } from '@/components/ui/AppText';
import { BrandMark } from '@/components/ui/BrandMark';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { login } from '@/services/api/authApi';
import { useAuthStore } from '@/state/authStore';
import { useSettingsStore } from '@/state/settingsStore';
import { useTheme } from '@/theme/ThemeProvider';
import type { AuthStackParamList } from '@/types/navigation';
import { ApiError, getErrorMessage } from '@/utils/errors';

const schema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters'),
});

type FormValues = z.infer<typeof schema>;
type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const setSession = useAuthStore((state) => state.setSession);
  const enterGuest = useSettingsStore((state) => state.enterGuest);
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
    defaultValues: { email: '', password: '' },
  });

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    setSubmitting(true);
    try {
      const session = await login(values);
      await setSession(session.user, session.token);
      exitGuest();
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors) {
        if (error.fieldErrors.email) setError('email', { message: error.fieldErrors.email });
        if (error.fieldErrors.password) setError('password', { message: error.fieldErrors.password });
        if (!error.fieldErrors.email && !error.fieldErrors.password) setFormError(error.message);
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
        <BrandMark showWordmark />
        <AppText variant="title">Welcome back</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Know what's inside.
        </AppText>
      </View>
      {formError ? (
        <AppText variant="caption" color={colors.avoid}>
          {formError}
        </AppText>
      ) : null}
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
            autoComplete="password"
            textContentType="password"
            error={errors.password?.message}
          />
        )}
      />
      <Button label="Sign in" onPress={() => void submit()} loading={submitting} />
      <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Register')} style={styles.link}>
        <AppText variant="bodyMedium" color={colors.primary}>
          Create an account
        </AppText>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={enterGuest} style={styles.link}>
        <AppText variant="bodyMedium" color={colors.textSecondary}>
          Scan without an account
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

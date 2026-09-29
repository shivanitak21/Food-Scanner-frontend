import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { API_URL } from '@/constants/config';
import { fetchHealth } from '@/services/api/healthApi';
import { useTheme } from '@/theme/ThemeProvider';
import { getErrorMessage } from '@/utils/errors';

export function ApiStatus() {
  const { colors } = useTheme();
  const health = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    retry: false,
    staleTime: 15_000,
    enabled: API_URL.length > 0,
  });

  const detail = !API_URL
    ? 'Set EXPO_PUBLIC_API_URL in .env and restart Expo.'
    : health.isPending
      ? 'Checking the API…'
      : health.isError
        ? getErrorMessage(health.error)
        : `Connected. Health check returned ${health.data.status}.`;

  return (
    <Card>
      <View style={styles.copy}>
        <AppText variant="bodyMedium">Backend</AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          {API_URL || 'No API address'}
        </AppText>
        <AppText variant="caption" color={health.isError ? colors.avoid : colors.textSecondary}>
          {detail}
        </AppText>
      </View>
      <Button label="Check again" variant="secondary" fullWidth={false} onPress={() => void health.refetch()} />
    </Card>
  );
}

const styles = StyleSheet.create({
  copy: {
    gap: 4,
    marginBottom: 12,
  },
});

import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/theme/ThemeProvider';

export function LoadingState({ message }: { message: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap} accessibilityRole="progressbar" accessibilityLabel={message}>
      <AppText variant="body" color={colors.textSecondary} style={styles.center}>
        {message}
      </AppText>
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={icon} size={26} color={colors.primary} />
      </View>
      <AppText variant="headline" style={styles.center}>
        {title}
      </AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.center}>
        {message}
      </AppText>
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} fullWidth={false} /> : null}
    </View>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try again',
  actionLabel,
  onAction,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={[styles.icon, { backgroundColor: colors.avoidSoft }]}>
        <Ionicons name="cloud-offline-outline" size={26} color={colors.avoid} />
      </View>
      <AppText variant="headline" style={styles.center}>
        {title}
      </AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.center}>
        {message}
      </AppText>
      {onRetry ? <Button label={retryLabel} onPress={onRetry} fullWidth={false} icon="refresh" /> : null}
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} variant="secondary" fullWidth={false} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 28,
    paddingHorizontal: 12,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  center: {
    textAlign: 'center',
  },
});

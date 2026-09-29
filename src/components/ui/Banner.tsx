import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme/ThemeProvider';

export function Banner({ message, tone = 'info' }: { message: string; tone?: 'info' | 'warning' }) {
  const { colors, radius } = useTheme();
  const background = tone === 'warning' ? colors.reviewSoft : colors.infoSoft;
  const foreground = tone === 'warning' ? colors.review : colors.info;

  return (
    <View style={[styles.banner, { backgroundColor: background, borderRadius: radius.md }]}>
      <Ionicons name={tone === 'warning' ? 'alert-circle-outline' : 'information-circle-outline'} size={18} color={foreground} />
      <AppText variant="caption" color={foreground} style={styles.text}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    alignItems: 'flex-start',
  },
  text: {
    flex: 1,
  },
});

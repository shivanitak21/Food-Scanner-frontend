import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme/ThemeProvider';
import type { RootStackParamList } from '@/types/navigation';
import { ingredientCategory } from '@/utils/presentation';

type Props = NativeStackScreenProps<RootStackParamList, 'IngredientDetails'>;

export function IngredientDetailsScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { ingredient, productName } = route.params;
  const category = ingredientCategory(ingredient.name, ingredient.details);

  return (
    <View style={[styles.fill, { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 20) }]}>
      <View style={[styles.handle, { backgroundColor: colors.border }]} />
      {productName ? (
        <AppText variant="label" color={colors.textTertiary}>
          {productName}
        </AppText>
      ) : null}
      <AppText variant="display">{ingredient.name}</AppText>
      <AppText variant="body" color={colors.textSecondary}>
        {category}
      </AppText>
      <Block label="What is it?" body="Listed in this product’s ingredients." />
      <Block
        label="Why you're seeing it"
        body={ingredient.flagged ? ingredient.reason || 'Relevant to this profile.' : 'Part of the ingredient list.'}
      />
      <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => navigation.goBack()} style={styles.close}>
        <AppText variant="bodyMedium" color={colors.primary}>
          Close
        </AppText>
      </Pressable>
    </View>
  );
}

function Block({ label, body }: { label: string; body: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.block}>
      <AppText variant="label" color={colors.textTertiary}>
        {label}
      </AppText>
      <AppText variant="body">{body}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, paddingHorizontal: 24, paddingTop: 12, gap: 12 },
  handle: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, marginBottom: 8 },
  block: { gap: 6, paddingTop: 8 },
  close: { minHeight: 44, justifyContent: 'center', marginTop: 8 },
});

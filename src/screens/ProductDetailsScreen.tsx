import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { IngredientList } from '@/components/design/IngredientList';
import { NutritionBlock } from '@/components/design/NutritionBlock';
import { ProductVisual } from '@/components/design/ProductVisual';
import { Screen } from '@/components/ui/Screen';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { useProduct } from '@/hooks/useFoodData';
import type { RootStackParamList } from '@/types/navigation';
import { getErrorMessage } from '@/utils/errors';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetails'>;

export function ProductDetailsScreen({ navigation, route }: Props) {
  const { productId, product: initial } = route.params;
  const query = useProduct(productId);
  const product = query.data ?? initial;

  if (!product && query.isLoading) return <LoadingState message="Product" />;
  if (!product) {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <ErrorState
          title="Product unavailable"
          message={query.isError ? getErrorMessage(query.error) : 'This scan did not include a product record.'}
          onRetry={query.isError ? () => void query.refetch() : undefined}
        />
      </Screen>
    );
  }

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <ProductVisual name={product.name} brand={product.brand} imageUrl={product.imageUrl} />
      <NutritionBlock items={product.nutrition} />
      <IngredientList
        items={product.ingredients}
        onPress={(ingredient) => navigation.navigate('IngredientDetails', { ingredient, productName: product.name })}
      />
    </Screen>
  );
}

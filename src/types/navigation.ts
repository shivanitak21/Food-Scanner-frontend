import type { NavigatorScreenParams } from '@react-navigation/native';

import type { FamilyScan, IngredientItem, Product } from '@/types/models';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  History: undefined;
  Family: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<MainTabParamList> | undefined;
  BarcodeScanner: undefined;
  LabelCamera: { barcode?: string; productName?: string } | undefined;
  HealthContext: { profileId: string };
  AnalysisResult: { scan: FamilyScan };
  ProductDetails: { productId?: string; product?: Product };
  IngredientDetails: { ingredient: IngredientItem; productName?: string };
  UserProfile: undefined;
  FamilyMemberForm: { profileId?: string };
};

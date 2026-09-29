import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthNavigator } from '@/navigation/AuthNavigator';
import { MainTabs } from '@/navigation/MainTabs';
import { AnalysisResultScreen } from '@/screens/AnalysisResultScreen';
import { BarcodeScannerScreen } from '@/screens/BarcodeScannerScreen';
import { FamilyMemberFormScreen } from '@/screens/FamilyMemberFormScreen';
import { HealthContextScreen } from '@/screens/HealthContextScreen';
import { IngredientDetailsScreen } from '@/screens/IngredientDetailsScreen';
import { LabelCameraScreen } from '@/screens/LabelCameraScreen';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { ProductDetailsScreen } from '@/screens/ProductDetailsScreen';
import { UserProfileScreen } from '@/screens/UserProfileScreen';
import { useAuthStore } from '@/state/authStore';
import { useSettingsStore } from '@/state/settingsStore';
import { useTheme } from '@/theme/ThemeProvider';
import type { RootStackParamList } from '@/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { colors, fonts, mode } = useTheme();
  const status = useAuthStore((state) => state.status);
  const hasCompletedOnboarding = useSettingsStore((state) => state.hasCompletedOnboarding);

  const navigationTheme = {
    ...(mode === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(mode === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
      notification: colors.avoid,
    },
  };

  if (!hasCompletedOnboarding) {
    return <OnboardingScreen />;
  }

  if (status !== 'authenticated') {
    return (
      <NavigationContainer theme={navigationTheme}>
        <AuthNavigator />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontFamily: fonts.bodySemibold, fontSize: 17 },
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="BarcodeScanner" component={BarcodeScannerScreen} options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="LabelCamera" component={LabelCameraScreen} options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="AnalysisResult" component={AnalysisResultScreen} options={{ headerShown: false, animation: 'fade_from_bottom' }} />
        <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} options={{ title: '' }} />
        <Stack.Screen
          name="IngredientDetails"
          component={IngredientDetailsScreen}
          options={{ presentation: 'formSheet', headerShown: false }}
        />
        <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: 'Your profile' }} />
        <Stack.Screen name="FamilyMemberForm" component={FamilyMemberFormScreen} options={{ title: 'Family member' }} />
        <Stack.Screen name="HealthContext" component={HealthContextScreen} options={{ title: 'Report' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

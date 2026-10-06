import { QueryClientProvider } from '@tanstack/react-query';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFonts } from 'expo-font';
import * as SplashScreenNative from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { usePersistedStoresReady } from '@/hooks/useHydration';
import { queryClient } from '@/lib/queryClient';
import { RootNavigator } from '@/navigation/RootNavigator';
import { SplashScreen } from '@/screens/SplashScreen';
import { useAuthStore } from '@/state/authStore';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

SplashScreenNative.preventAutoHideAsync().catch(() => {
  // The native splash can already be hidden during fast refresh.
});

function AppShell() {
  const { mode, colors } = useTheme();
  const hydrated = usePersistedStoresReady();
  const status = useAuthStore((state) => state.status);
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const [minTimeDone, setMinTimeDone] = useState(false);
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
    PlusJakartaSans_400Regular: require('@expo-google-fonts/plus-jakarta-sans/400Regular/PlusJakartaSans_400Regular.ttf'),
    PlusJakartaSans_500Medium: require('@expo-google-fonts/plus-jakarta-sans/500Medium/PlusJakartaSans_500Medium.ttf'),
    PlusJakartaSans_600SemiBold: require('@expo-google-fonts/plus-jakarta-sans/600SemiBold/PlusJakartaSans_600SemiBold.ttf'),
    PlusJakartaSans_700Bold: require('@expo-google-fonts/plus-jakarta-sans/700Bold/PlusJakartaSans_700Bold.ttf'),
  });

  useEffect(() => {
    void bootstrap();
    const timer = setTimeout(() => setMinTimeDone(true), 1900);
    return () => clearTimeout(timer);
  }, [bootstrap]);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreenNative.hideAsync().catch(() => undefined);
    }
  }, [fontsLoaded]);

  const ready = fontsLoaded && hydrated && status !== 'booting' && minTimeDone;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      {ready ? <RootNavigator /> : <SplashScreen />}
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AppShell />
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

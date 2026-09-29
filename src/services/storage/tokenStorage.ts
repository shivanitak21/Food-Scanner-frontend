import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'foodlens.auth.token';

async function canUseSecureStore(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function saveToken(token: string): Promise<void> {
  if (await canUseSecureStore()) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    return;
  }
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  try {
    if (await canUseSecureStore()) {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    }
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function clearToken(): Promise<void> {
  try {
    if (await canUseSecureStore()) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch {
    // Continue to the fallback store so a partial write cannot keep a session alive.
  }
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch {
    // The next launch will treat a missing token as signed out.
  }
}

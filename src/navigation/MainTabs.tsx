import Ionicons from '@expo/vector-icons/Ionicons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';

import { FamilyMembersScreen } from '@/screens/FamilyMembersScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { ScanHistoryScreen } from '@/screens/ScanHistoryScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { useTheme } from '@/theme/ThemeProvider';
import type { MainTabParamList } from '@/types/navigation';

const Tab = createBottomTabNavigator<MainTabParamList>();

const icons: Record<keyof MainTabParamList, { active: keyof typeof Ionicons.glyphMap; idle: keyof typeof Ionicons.glyphMap }> = {
  Home: { active: 'home', idle: 'home-outline' },
  History: { active: 'time', idle: 'time-outline' },
  Family: { active: 'people', idle: 'people-outline' },
  Settings: { active: 'settings', idle: 'settings-outline' },
};

export function MainTabs() {
  const { colors, fonts } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopWidth: 0,
          elevation: 0,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          ...fonts.bodyMedium,
          fontSize: 11,
        },
        tabBarIconStyle: {
          width: 32,
          height: 28,
        },
        tabBarIcon: ({ color, focused, size }) => {
          const iconSize = Math.min(size ?? 22, 22);
          return (
            <View
              style={{
                width: 32,
                height: 28,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? colors.primarySoft : 'transparent',
              }}
            >
              <Ionicons
                name={focused ? icons[route.name].active : icons[route.name].idle}
                color={color}
                size={iconSize}
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="History" component={ScanHistoryScreen} options={{ tabBarLabel: 'History' }} />
      <Tab.Screen name="Family" component={FamilyMembersScreen} options={{ tabBarLabel: 'Family' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: 'Settings' }} />
    </Tab.Navigator>
  );
}

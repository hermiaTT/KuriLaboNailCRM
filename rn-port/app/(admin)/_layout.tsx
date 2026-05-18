import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icons, TabBarIcon } from '../../components/ui';
import { colors } from '../../constants/theme';

/**
 * Admin-side tab bar.
 *
 * 5 tabs (Home, Users, Schedule, Slots, Upload). The 6th admin route
 * (`inspiration`) is hidden via `href: null` — it's reached from the
 * dashboard or upload screen.
 */
export default function AdminTabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.inkFaint,
        tabBarStyle: {
          backgroundColor: 'rgba(251,244,229,0.96)',
          borderTopWidth: 1,
          borderTopColor: colors.creamHair,
          borderStyle: 'dashed',
          height: 64 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 6,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarItemStyle: { alignItems: 'center', justifyContent: 'center' },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} icon={(c, s) => <Icons.Sparkle color={c} size={s}/>} label="Home"/>
          ),
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Clients',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} icon={(c, s) => <Icons.User color={c} size={s}/>} label="Clients"/>
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Visits',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} icon={(c, s) => <Icons.Calendar color={c} size={s}/>} label="Visits"/>
          ),
        }}
      />
      <Tabs.Screen
        name="slots"
        options={{
          title: 'Slots',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} icon={(c, s) => <Icons.Edit color={c} size={s}/>} label="Slots"/>
          ),
        }}
      />
      <Tabs.Screen
        name="upload"
        options={{
          title: 'Upload',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} icon={(c, s) => <Icons.Plus color={c} size={s}/>} label="Upload"/>
          ),
        }}
      />
      <Tabs.Screen name="inspiration" options={{ href: null }} />
    </Tabs>
  );
}

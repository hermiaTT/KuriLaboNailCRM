import { Tabs } from 'expo-router';

import { NavTabIcon, TabBarBackground } from '../../components/ui';
import { colors, radius } from '../../constants/theme';

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        tabBarBackground: () => <TabBarBackground />,
        tabBarShowLabel: false,
        tabBarItemStyle: {
          alignItems: 'center',
          justifyContent: 'center',
          height: 56,
          paddingTop: 0,
        },
        tabBarIconStyle: {
          alignItems: 'center',
          justifyContent: 'center',
          height: 38,
          marginTop: 0,
        },
        tabBarStyle: {
          position: 'absolute',
          marginHorizontal: 6,
          marginBottom: 18,
          height: 76,
          paddingTop: 10,
          paddingBottom: 10,
          borderTopWidth: 0,
          borderRadius: radius.xl,
          backgroundColor: 'transparent',
          elevation: 0,
          shadowOpacity: 0,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <NavTabIcon focused={focused} icon="⌂" label="Home" />,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
          tabBarIcon: ({ focused }) => <NavTabIcon focused={focused} icon="☺" label="Users" />,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Appts',
          tabBarIcon: ({ focused }) => <NavTabIcon focused={focused} icon="◷" label="Appts" />,
        }}
      />
      <Tabs.Screen
        name="slots"
        options={{
          title: 'Slots',
          tabBarIcon: ({ focused }) => <NavTabIcon focused={focused} icon="▣" label="Slots" />,
        }}
      />
      <Tabs.Screen
        name="upload"
        options={{
          title: 'Upload',
          tabBarIcon: ({ focused }) => <NavTabIcon focused={focused} icon="+" label="Upload" />,
        }}
      />
      <Tabs.Screen name="inspiration" options={{ href: null }} />
    </Tabs>
  );
}

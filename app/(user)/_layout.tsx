import { Tabs } from 'expo-router';

import { NavTabIcon, TabBarBackground } from '../../components/ui';
import { colors, radius } from '../../constants/theme';

export default function UserLayout() {
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
          marginHorizontal: 8,
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
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <NavTabIcon focused={focused} icon="☺" label="Profile" />,
        }}
      />
      <Tabs.Screen
        name="collection"
        options={{
          title: 'Collection',
          tabBarIcon: ({ focused }) => <NavTabIcon focused={focused} icon="♡" label="Saved" />,
        }}
      />
      <Tabs.Screen
        name="inspiration"
        options={{
          title: 'Inspo',
          tabBarIcon: ({ focused }) => <NavTabIcon focused={focused} icon="✿" label="Library" />,
        }}
      />
      <Tabs.Screen
        name="book"
        options={{
          title: 'Book',
          tabBarIcon: ({ focused }) => <NavTabIcon focused={focused} icon="▣" label="Book" />,
        }}
      />
      <Tabs.Screen name="appointments" options={{ href: null }} />
    </Tabs>
  );
}

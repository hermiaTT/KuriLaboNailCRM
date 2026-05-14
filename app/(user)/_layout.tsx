import { Tabs } from 'expo-router';
import { Text } from 'react-native';

import { colors, radius } from '../../constants/theme';

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{ color: focused ? colors.ink : colors.muted, fontSize: 16, fontWeight: '800' }}>
      {label}
    </Text>
  );
}

export default function UserLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarStyle: {
          marginHorizontal: 18,
          marginBottom: 18,
          height: 70,
          borderTopWidth: 0,
          borderRadius: radius.xl,
          backgroundColor: colors.white,
          shadowColor: '#ec9fb2',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.14,
          shadowRadius: 18,
          elevation: 4,
        },
      }}
    >
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="P" />,
        }}
      />
      <Tabs.Screen
        name="collection"
        options={{
          title: 'Collection',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="C" />,
        }}
      />
      <Tabs.Screen
        name="inspiration"
        options={{
          title: 'Inspo',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="I" />,
        }}
      />
      <Tabs.Screen
        name="book"
        options={{
          title: 'Book',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="B" />,
        }}
      />
      <Tabs.Screen name="appointments" options={{ href: null }} />
    </Tabs>
  );
}

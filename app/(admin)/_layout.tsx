import { Tabs } from 'expo-router';
import { Text } from 'react-native';

import { colors, radius } from '../../constants/theme';

function AdminIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{ color: focused ? colors.ink : colors.muted, fontSize: 15, fontWeight: '900' }}>
      {label}
    </Text>
  );
}

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
        tabBarStyle: {
          marginHorizontal: 14,
          marginBottom: 18,
          height: 70,
          borderTopWidth: 0,
          borderRadius: radius.xl,
          backgroundColor: colors.white,
          shadowColor: '#7dbde0',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.16,
          shadowRadius: 18,
          elevation: 4,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <AdminIcon focused={focused} label="D" />,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
          tabBarIcon: ({ focused }) => <AdminIcon focused={focused} label="U" />,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Appts',
          tabBarIcon: ({ focused }) => <AdminIcon focused={focused} label="A" />,
        }}
      />
      <Tabs.Screen
        name="slots"
        options={{
          title: 'Slots',
          tabBarIcon: ({ focused }) => <AdminIcon focused={focused} label="S" />,
        }}
      />
      <Tabs.Screen
        name="upload"
        options={{
          title: 'Upload',
          tabBarIcon: ({ focused }) => <AdminIcon focused={focused} label="+" />,
        }}
      />
      <Tabs.Screen name="inspiration" options={{ href: null }} />
    </Tabs>
  );
}

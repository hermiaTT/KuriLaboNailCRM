import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icons, TabBarIcon } from '../../components/ui';
import { colors } from '../../constants/theme';

/**
 * User-side tab bar.
 *
 * Visual rules (Design.md §6.5):
 * - Translucent cream background, dashed top border, no shadow.
 * - 4 items max, 64×48 each, with line icons + mono label.
 * - Active tab gets a wobble pill behind the icon — handled by
 *   `<TabBarIcon focused/>`.
 */
export default function UserTabsLayout() {
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
        tabBarItemStyle: {
          alignItems: 'center',
          justifyContent: 'center',
        },
      }}
    >
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} icon={(c, s) => <Icons.Home color={c} size={s}/>} label="Home"/>
          ),
        }}
      />
      <Tabs.Screen
        name="collection"
        options={{
          title: 'Saved',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} icon={(c, s) => <Icons.Heart color={c} size={s}/>} label="Saved"/>
          ),
        }}
      />
      <Tabs.Screen
        name="inspiration"
        options={{
          title: 'Inspo',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} icon={(c, s) => <Icons.Sparkle color={c} size={s}/>} label="Inspo"/>
          ),
        }}
      />
      <Tabs.Screen
        name="book"
        options={{
          title: 'Book',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} icon={(c, s) => <Icons.Calendar color={c} size={s}/>} label="Book"/>
          ),
        }}
      />
      <Tabs.Screen name="appointments" options={{ href: null }} />
    </Tabs>
  );
}

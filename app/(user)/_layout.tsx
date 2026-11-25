import { t, useLanguage } from '../../shared/i18n';
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
  useLanguage();
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
          title: t('Home'),
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} icon={(c, s) => <Icons.Home color={c} size={s}/>} label={t('Home')}/>
          ),
        }}
      />
      <Tabs.Screen
        name="collection"
        options={{
          title: t('Collection'),
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} icon={(c, s) => <Icons.Heart color={c} size={s}/>} label={t('Past')}/>
          ),
        }}
      />
      <Tabs.Screen
        name="inspiration"
        options={{
          title: t('Inspo'),
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} icon={(c, s) => <Icons.Sparkle color={c} size={s}/>} label={t('Inspo')}/>
          ),
        }}
      />
      <Tabs.Screen
        name="book"
        options={{
          title: t('Book'),
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} icon={(c, s) => <Icons.Calendar color={c} size={s}/>} label={t('Book')}/>
          ),
        }}
      />
      <Tabs.Screen name="appointments" options={{ href: null }} />
      <Tabs.Screen name="edit-profile" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
    </Tabs>
  );
}

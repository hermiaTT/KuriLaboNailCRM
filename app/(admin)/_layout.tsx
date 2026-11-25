import { t, useLanguage } from '../../shared/i18n';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icons, TabBarIcon } from '../../components/ui';
import { colors } from '../../constants/theme';

/**
 * Admin-side tab bar.
 *
 * 5 tabs (Home, Users, Schedule, Slots, Upload). `inspiration` and
 * `client/[id]` are hidden via `href: null` — reached from the
 * dashboard/upload screen and the client list, respectively.
 */
export default function AdminTabsLayout() {
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
        tabBarItemStyle: { alignItems: 'center', justifyContent: 'center' },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t('Home'),
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} icon={(c, s) => <Icons.Sparkle color={c} size={s}/>} label={t('Home')}/>
          ),
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: t('Clients'),
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} icon={(c, s) => <Icons.User color={c} size={s}/>} label={t('Clients')}/>
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: t('Visits'),
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} icon={(c, s) => <Icons.Calendar color={c} size={s}/>} label={t('Visits')}/>
          ),
        }}
      />
      <Tabs.Screen
        name="slots"
        options={{
          title: t('Slots'),
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} icon={(c, s) => <Icons.Edit color={c} size={s}/>} label={t('Slots')}/>
          ),
        }}
      />
      <Tabs.Screen
        name="upload"
        options={{
          title: t('Upload'),
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} icon={(c, s) => <Icons.Plus color={c} size={s}/>} label={t('Upload')}/>
          ),
        }}
      />
      <Tabs.Screen
        name="inspiration"
        options={{
          title: t('Gallery'),
          href: null,
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} icon={(c, s) => <Icons.Photos color={c} size={s}/>} label={t('Gallery')}/>
          ),
        }}
      />
      <Tabs.Screen name="client/[id]" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="create-appointment" options={{ href: null }} />
      <Tabs.Screen name="services" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}

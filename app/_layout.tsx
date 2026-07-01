import { DMMono_500Medium } from '@expo-google-fonts/dm-mono';
import { Fraunces_400Regular } from '@expo-google-fonts/fraunces';
import { Nunito_400Regular } from '@expo-google-fonts/nunito';
import { PatrickHand_400Regular } from '@expo-google-fonts/patrick-hand';
import {
  Quicksand_400Regular,
  Quicksand_500Medium,
  Quicksand_600SemiBold,
  Quicksand_700Bold,
} from '@expo-google-fonts/quicksand';
import { SpecialElite_400Regular } from '@expo-google-fonts/special-elite';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { View } from 'react-native';

import { Wobble } from '../components/ui';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { colors } from '../constants/theme';

function RootNavigator() {
  const { session, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === '(auth)';

    if (!session) {
      if (!inAuth) router.replace('/(auth)/login');
    } else if (profile) {
      if (inAuth) {
        router.replace(profile.role === 'admin' ? '/(admin)/dashboard' : '/(user)/profile');
      }
    }
  }, [session, profile, loading, segments]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <Wobble />
      <StatusBar style="dark" backgroundColor={colors.cream} />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colors.cream },
          headerShown: false,
        }}
      />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpecialElite_400Regular,
    Quicksand_400Regular,
    Quicksand_500Medium,
    Quicksand_600SemiBold,
    Quicksand_700Bold,
    DMMono_500Medium,
    PatrickHand_400Regular,
    Fraunces_400Regular,
    Nunito_400Regular,
  });

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

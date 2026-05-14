import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { colors } from '../constants/theme';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" backgroundColor={colors.softPink} />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colors.softPink },
          headerShown: false,
        }}
      />
    </>
  );
}

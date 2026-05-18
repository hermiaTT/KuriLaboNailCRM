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
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { Wobble } from '../components/ui';
import { colors } from '../constants/theme';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    // Default set
    SpecialElite_400Regular,
    Quicksand_400Regular,
    Quicksand_500Medium,
    Quicksand_600SemiBold,
    Quicksand_700Bold,
    DMMono_500Medium,
    // Alt sets (only required if you ship the font-set switcher)
    PatrickHand_400Regular,
    Fraunces_400Regular,
    Nunito_400Regular,
  });

  if (!fontsLoaded) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      {/* Mount once — provides the SVG wobble filter defs to every
          HandRect / HandChip / HandButton in the tree. */}
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

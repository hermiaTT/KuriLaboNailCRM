import type { ReactNode } from 'react';
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '../../constants/theme';

const backgroundImage = require('../../assets/background.png');

interface ScreenContainerProps {
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  scroll?: boolean;
  safeAreaEdges?: Array<'top' | 'right' | 'bottom' | 'left'>;
}

export function ScreenContainer({
  children,
  contentStyle,
  scroll = true,
  safeAreaEdges = ['top', 'left', 'right'],
}: ScreenContainerProps) {
  const content = <View style={[styles.content, contentStyle]}>{children}</View>;

  const screenContent = (
    <SafeAreaView style={styles.safeArea} edges={safeAreaEdges}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );

  return (
    <ImageBackground
      imageStyle={styles.backgroundImage}
      resizeMode="repeat"
      source={backgroundImage}
      style={styles.background}
    >
      {screenContent}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: colors.softPink,
  },
  backgroundImage: {
    opacity: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingBottom: 36,
  },
  content: {
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
});

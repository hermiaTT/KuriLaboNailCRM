import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { ScreenContainer } from './ScreenContainer';

interface AppScreenProps {
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  scroll?: boolean;
}

export function AppScreen({ children, contentStyle, scroll = true }: AppScreenProps) {
  return (
    <ScreenContainer contentStyle={contentStyle} scroll={scroll}>
      {children}
    </ScreenContainer>
  );
}

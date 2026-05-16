import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { KuriCard } from './KuriCard';

interface SoftCardProps {
  children: ReactNode;
  blue?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function SoftCard({ children, style, blue = false }: SoftCardProps) {
  return <KuriCard style={style} tone={blue ? 'blue' : 'white'}>{children}</KuriCard>;
}

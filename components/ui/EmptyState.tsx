import { StyleSheet, Text } from 'react-native';

import { colors, typography } from '../../constants/theme';
import { SoftCard } from './SoftCard';

interface EmptyStateProps {
  title: string;
  message: string;
}

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <SoftCard blue>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </SoftCard>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: '800',
  },
  message: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 23,
  },
});

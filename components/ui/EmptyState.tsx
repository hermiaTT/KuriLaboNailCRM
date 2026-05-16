import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, spacing, typography } from '../../constants/theme';
import { KuriCard } from './KuriCard';
import { KuriButton } from './KuriButton';

interface EmptyStateProps {
  actionLabel?: string;
  title: string;
  message: string;
  onActionPress?: () => void;
}

export function EmptyState({ actionLabel, message, onActionPress, title }: EmptyStateProps) {
  return (
    <KuriCard tone="blue">
      <View style={styles.mark}>
        <Text style={styles.markText}>KL</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel ? (
        <KuriButton onPress={onActionPress} variant="ghost">
          {actionLabel}
        </KuriButton>
      ) : null}
    </KuriCard>
  );
}

const styles = StyleSheet.create({
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 52,
    height: 52,
    borderRadius: 20,
    backgroundColor: colors.white,
  },
  markText: {
    color: colors.pastelPink,
    fontFamily: fonts.titleBold,
    fontSize: typography.small,
  },
  title: {
    color: colors.ink,
    fontFamily: fonts.titleBold,
    fontSize: typography.heading,
  },
  message: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: typography.body,
    lineHeight: 23,
    marginBottom: spacing.xs,
  },
});

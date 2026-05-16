import { Text } from 'react-native';

import { colors, fonts, typography } from '../../constants/theme';
import { SectionTitle } from './SectionTitle';

interface SectionHeaderProps {
  title: string;
  eyebrow?: string;
  action?: string;
}

export function SectionHeader({ title, eyebrow, action }: SectionHeaderProps) {
  return (
    <SectionTitle
      action={action ? <Text style={styles.action}>{action}</Text> : null}
      eyebrow={eyebrow}
      title={title}
    />
  );
}

const styles = {
  action: {
    color: colors.babyBlue,
    fontFamily: fonts.bodyBold,
    fontSize: typography.small,
  },
} as const;

import { StyleSheet, Text, TextInput } from 'react-native';

import { AppScreen } from '../../components/ui/AppScreen';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { SoftCard } from '../../components/ui/SoftCard';
import { colors, radius, spacing, typography } from '../../constants/theme';

export default function AdminUploadScreen() {
  return (
    <AppScreen>
      <SectionHeader eyebrow="Images" title="Upload placeholder" />
      <SoftCard>
        <Text style={styles.cardTitle}>Collection image</Text>
        <TextInput placeholder="Select user" placeholderTextColor={colors.muted} style={styles.input} />
        <TextInput placeholder="Date" placeholderTextColor={colors.muted} style={styles.input} />
        <TextInput
          multiline
          placeholder="Description or tags"
          placeholderTextColor={colors.muted}
          style={[styles.input, styles.textArea]}
        />
        <PrimaryButton>Choose image later</PrimaryButton>
      </SoftCard>
      <SoftCard blue>
        <Text style={styles.copy}>
          Backend storage and image picker logic will be added in a later phase.
        </Text>
      </SoftCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  cardTitle: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: '900',
  },
  input: {
    minHeight: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.softGray,
    color: colors.ink,
    fontSize: 16,
    paddingHorizontal: spacing.md,
  },
  textArea: {
    minHeight: 108,
    paddingTop: spacing.md,
    textAlignVertical: 'top',
  },
  copy: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 23,
  },
});

import { LANGUAGES, t, useLanguage, type Language } from '../shared/i18n';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../constants/theme';


export function LanguagePicker({ value, onChange, disabled = false }: {
  value: Language; onChange: (value: Language) => void; disabled?: boolean;
}) {
  useLanguage();
  return <View style={styles.container}>
    <Text style={styles.label}>{t('Language')}</Text>
    <View style={styles.options} accessibilityRole="radiogroup">
      {LANGUAGES.map((item) => <Pressable key={item.value} disabled={disabled} accessibilityRole="radio"
        accessibilityState={{ checked: value === item.value, disabled }}
        onPress={() => onChange(item.value)} style={[styles.option, value === item.value && styles.selected, disabled && styles.disabled]}>
        <Text style={styles.text}>{item.label}</Text>
      </Pressable>)}
    </View>
  </View>;
}
const styles = StyleSheet.create({
  container: { gap: 8, alignSelf: 'stretch' },
  label: { fontFamily: fonts.body, color: colors.ink, fontSize: 14 },
  options: { flexDirection: 'row', gap: 10 },
  option: { flex: 1, alignItems: 'center', padding: 12, borderRadius: radius.md, backgroundColor: colors.creamCard, borderWidth: 1, borderColor: colors.creamHair },
  selected: { backgroundColor: colors.pinkSoft, borderColor: colors.pinkInk },
  disabled: { opacity: 0.5 },
  text: { fontFamily: fonts.body, color: colors.ink, fontSize: 14 },
});

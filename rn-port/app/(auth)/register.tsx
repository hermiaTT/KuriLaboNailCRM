import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ConfettiBg,
  Doodle,
  EyebrowTitle,
  Field,
  HandButton,
  HandRect,
  Icons,
} from '../../components/ui';
import {
  colors,
  fonts,
  letterSpacing,
  radius,
  spacing,
  typeScale,
} from '../../constants/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ConfettiBg intensity={0.35}/>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + spacing.md,
            paddingBottom: insets.bottom + spacing.xxl,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back */}
          <View style={styles.row}>
            <Pressable onPress={() => router.back()} style={styles.back}>
              <Icons.ChevL color={colors.ink}/>
              <Text style={styles.backText}>back</Text>
            </Pressable>
          </View>

          <EyebrowTitle
            eyebrow="new here?"
            title="Create profile"
            trailing={<Doodle kind="sparkle" size={20} color={colors.coral} style={{ transform: [{ rotate: '-12deg' }] }}/>}
          />

          <View style={styles.row}>
            <Text style={styles.tagline}>
              We’ll save your favorite styles and visits so Kuri can pick up right where you left off.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.row}>
            <HandRect padding={20} radius={radius.lg}>
              <View style={{ gap: 12 }}>
                <Field placeholder="Name" value={name} onChangeText={setName}/>
                <Field placeholder="Email" autoCapitalize="none"
                  keyboardType="email-address" value={email} onChangeText={setEmail}/>
                <Field placeholder="Phone" keyboardType="phone-pad" value={phone} onChangeText={setPhone}/>
                <Field placeholder="Password" secureTextEntry value={password} onChangeText={setPassword}/>
              </View>

              <View style={styles.terms}>
                <View style={styles.check}><Text style={styles.checkText}>✓</Text></View>
                <Text style={styles.termsText}>
                  By creating a profile, you agree to KuriLabo’s cozy little terms.
                </Text>
              </View>

              <View style={{ marginTop: 18 }}>
                <HandButton
                  color={colors.pinkInk}
                  full
                  size="lg"
                  onPress={() => router.replace('/(user)/profile')}
                >
                  Create profile →
                </HandButton>
              </View>
            </HandRect>
          </View>

          {/* Sign in link */}
          <View style={styles.row}>
            <Pressable onPress={() => router.replace('/(auth)/login')} style={styles.linkBtn}>
              <Text style={styles.linkText}>Already have a profile? </Text>
              <Text style={[styles.linkText, { color: colors.pinkInk }]}>Sign in →</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
  backText: {
    fontFamily: fonts.mono, fontSize: typeScale.meta, color: colors.ink,
    letterSpacing: letterSpacing.meta, textTransform: 'uppercase',
  },
  tagline: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkSoft,
    lineHeight: 22,
  },
  terms: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 16,
  },
  check: {
    width: 18, height: 18, borderRadius: 5,
    backgroundColor: colors.blueInk,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  checkText: { color: colors.white, fontSize: 11, fontWeight: '600' },
  termsText: { flex: 1, fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, lineHeight: 17 },

  linkBtn: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 12 },
  linkText: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft },
});

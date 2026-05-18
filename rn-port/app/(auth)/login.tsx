import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  BrushHighlight,
  ConfettiBg,
  Doodle,
  Field,
  HandButton,
  HandRect,
  ScribbleUnderline,
} from '../../components/ui';
import {
  colors,
  fonts,
  letterSpacing,
  radius,
  spacing,
  typeScale,
} from '../../constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ConfettiBg intensity={0.4}/>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.center}>
          {/* Brand mark */}
          <View style={styles.brand}>
            <BrushHighlight color={colors.blue} opacity={0.65} paddingHorizontal={22} paddingVertical={8}>
              <View style={{ flexDirection: 'row' }}>
                <Text style={styles.brandText}>KuriLabo</Text>
                <Text style={[styles.brandText, { color: colors.pinkInk }]}>.</Text>
              </View>
            </BrushHighlight>
            <View style={styles.tagline}>
              <Text style={styles.taglineText}>Soft nails, easy booking,</Text>
              <Text style={styles.taglineText}>cozy memories.</Text>
            </View>
            <ScribbleUnderline color={colors.pinkInk} width={56} height={6} style={{ marginTop: 14 }}/>
          </View>

          {/* Form card */}
          <HandRect padding={20} radius={radius.lg} style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.welcome}>Welcome back</Text>
              <Doodle kind="heart" size={20} color={colors.pink} style={{ transform: [{ rotate: '-10deg' }] }}/>
            </View>

            <View style={{ gap: 12, marginTop: 14 }}>
              <Field
                placeholder="Email"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              <Field
                placeholder="Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <View style={{ gap: 10, marginTop: 18 }}>
              <HandButton
                color={colors.pinkInk}
                full
                onPress={() => router.replace('/(user)/profile')}
              >
                Continue as User
              </HandButton>
              <HandButton
                color={colors.blueInk}
                full
                onPress={() => router.replace('/(admin)/dashboard')}
              >
                Continue as Admin
              </HandButton>
            </View>

            <Pressable style={styles.forgot}>
              <Text style={styles.forgotText}>forgot password?</Text>
            </Pressable>
          </HandRect>

          {/* Register link */}
          <Pressable onPress={() => router.push('/(auth)/register')} style={styles.linkBtn}>
            <Text style={styles.linkText}>New here? </Text>
            <Text style={[styles.linkText, { color: colors.pinkInk }]}>Create a profile →</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  brand: { alignItems: 'center' },
  brandText: {
    fontFamily: fonts.display,
    fontSize: 34,
    color: colors.ink,
    letterSpacing: letterSpacing.display,
  },
  tagline: { marginTop: 14, alignItems: 'center' },
  taglineText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkSoft,
    fontStyle: 'italic',
  },

  card: { width: '100%', maxWidth: 360 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  welcome: {
    fontFamily: fonts.display, fontSize: typeScale.section, color: colors.ink,
    letterSpacing: letterSpacing.display,
  },
  forgot: { marginTop: 14, alignSelf: 'center' },
  forgotText: {
    fontFamily: fonts.mono, fontSize: typeScale.meta, color: colors.inkSoft,
    letterSpacing: letterSpacing.meta, textTransform: 'uppercase',
  },

  linkBtn: { flexDirection: 'row', paddingVertical: 8 },
  linkText: {
    fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft,
  },
});

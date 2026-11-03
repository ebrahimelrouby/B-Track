import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTranslation } from 'react-i18next';
import { useColors, ColorPalette, Spacing, Typography } from '@/theme';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/auth.store';
import { AuthNavigationProp } from '@/navigation/types';
import { isValidPhoneNumber, normalizePhoneNumber } from '@/utils/phone';

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid email'),
  phoneNumber: z.string().optional().refine(
    (v) => !v || isValidPhoneNumber(v),
    'Enter a valid phone number with country code, e.g. +966501234567 or +201001234567'
  ),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must include an uppercase letter')
    .regex(/[0-9]/, 'Must include a number'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});
type FormData = z.infer<typeof schema>;

export default function RegisterScreen() {
  const navigation = useNavigation<AuthNavigationProp>();
  const { setAuth } = useAuthStore();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const user = await authApi.register({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber ? normalizePhoneNumber(data.phoneNumber) : undefined,
        password: data.password,
      });
      setAuth(user);
    } catch (err: any) {
      const message = err.response?.data?.message ?? t('auth.register.failedMsg');
      Alert.alert(t('common.error'), message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.logo}>B-TRACK</Text>
          <View style={styles.logoDot} />
        </View>

        <Text style={styles.title}>{t('auth.register.title')}</Text>
        <Text style={styles.subtitle}>{t('auth.register.subtitle')}</Text>

        <View style={styles.row}>
          <View style={styles.half}>
            <Controller
              control={control}
              name="firstName"
              render={({ field: { onChange, value, ref } }) => (
                <Input
                  ref={ref}
                  label={t('auth.register.firstName')}
                  placeholder={t('auth.register.firstNamePlaceholder')}
                  autoCapitalize="words"
                  onChangeText={onChange}
                  value={value}
                  error={errors.firstName?.message}
                />
              )}
            />
          </View>
          <View style={[styles.half, { marginStart: Spacing.sm }]}>
            <Controller
              control={control}
              name="lastName"
              render={({ field: { onChange, value, ref } }) => (
                <Input
                  ref={ref}
                  label={t('auth.register.lastName')}
                  placeholder={t('auth.register.lastNamePlaceholder')}
                  autoCapitalize="words"
                  onChangeText={onChange}
                  value={value}
                  error={errors.lastName?.message}
                />
              )}
            />
          </View>
        </View>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value, ref } }) => (
            <Input
              ref={ref}
              label={t('auth.register.email')}
              placeholder={t('auth.login.emailPlaceholder')}
              keyboardType="email-address"
              autoCapitalize="none"
              onChangeText={onChange}
              value={value}
              error={errors.email?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="phoneNumber"
          render={({ field: { onChange, value, ref } }) => (
            <Input
              ref={ref}
              label={t('auth.register.phoneNumber')}
              placeholder={t('auth.register.phoneNumberPlaceholder')}
              keyboardType="numbers-and-punctuation"
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={onChange}
              value={value}
              error={errors.phoneNumber?.message}
            />
          )}
        />
        <Text style={styles.phoneHint}>{t('auth.register.phoneNumberHint')}</Text>

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value, ref } }) => (
            <Input
              ref={ref}
              label={t('auth.register.password')}
              placeholder={t('auth.register.passwordPlaceholder')}
              secureTextEntry={!showPassword}
              textContentType="oneTimeCode"
              onChangeText={onChange}
              value={value}
              error={errors.password?.message}
              rightElement={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                  <Text style={styles.eyeText}>{showPassword ? t('common.hide') : t('common.show')}</Text>
                </TouchableOpacity>
              }
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, value, ref } }) => (
            <Input
              ref={ref}
              label={t('auth.register.confirmPassword')}
              placeholder={t('auth.register.confirmPasswordPlaceholder')}
              secureTextEntry={!showPassword}
              textContentType="oneTimeCode"
              onChangeText={onChange}
              value={value}
              error={errors.confirmPassword?.message}
            />
          )}
        />

        <Button
          title={t('auth.register.createBtn')}
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          fullWidth
          style={styles.submitButton}
        />

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>{t('auth.register.haveAccount')} </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>{t('auth.register.logIn')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.terms}>{t('auth.register.terms')}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function getStyles(c: ColorPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    scroll: { flexGrow: 1, padding: Spacing['2xl'] },
    header: { alignItems: 'center', marginTop: Spacing['2xl'], marginBottom: Spacing['2xl'] },
    logo: {
      fontSize: Typography['2xl'],
      fontWeight: Typography.extrabold,
      color: c.textPrimary,
      letterSpacing: 6,
    },
    logoDot: {
      width: 8, height: 8, borderRadius: 4, backgroundColor: c.primary, marginTop: Spacing.xs,
    },
    phoneHint: {
      fontSize: Typography.xs,
      color: c.textTertiary,
      marginTop: -Spacing.sm,
      marginBottom: Spacing.base,
    },
    title: {
      fontSize: Typography.xl,
      fontWeight: Typography.bold,
      color: c.textPrimary,
      marginBottom: Spacing.xs,
    },
    subtitle: {
      fontSize: Typography.base,
      color: c.textSecondary,
      marginBottom: Spacing.xl,
    },
    row: { flexDirection: 'row' },
    half: { flex: 1 },
    submitButton: { marginTop: Spacing.md },
    loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xl },
    loginText: { color: c.textSecondary, fontSize: Typography.base },
    loginLink: { color: c.primary, fontSize: Typography.base, fontWeight: Typography.semibold },
    terms: {
      fontSize: Typography.xs,
      color: c.textTertiary,
      textAlign: 'center',
      marginTop: Spacing.base,
      lineHeight: 18,
    },
    eyeButton: { paddingHorizontal: Spacing.base },
    eyeText: { color: c.textTertiary, fontSize: Typography.sm },
  });
}

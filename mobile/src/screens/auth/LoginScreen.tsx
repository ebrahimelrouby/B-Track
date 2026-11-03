import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, Alert, I18nManager,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTranslation } from 'react-i18next';
import { useColors, ColorPalette, Spacing, Typography, Radius } from '@/theme';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/auth.store';
import { AuthNavigationProp } from '@/navigation/types';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

export default function LoginScreen() {
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
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const user = await authApi.login(data);
      setAuth(user);
    } catch (err: any) {
      const message = err.response?.data?.message ?? t('auth.login.failedMsg');
      // Alongside the alert, mark the form invalid so the failure is still visible
      // once the dialog is dismissed. The server doesn't say which field was wrong,
      // so the password field (not email) carries the message.
      setError('password', { type: 'server', message });
      Alert.alert(t('auth.login.failedTitle'), message);
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

        <View style={styles.form}>
          <Text style={styles.title}>{t('auth.login.title')}</Text>
          <Text style={styles.subtitle}>{t('auth.login.subtitle')}</Text>

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value, ref } }) => (
              <Input
                ref={ref}
                label={t('auth.login.email')}
                placeholder={t('auth.login.emailPlaceholder')}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onChangeText={onChange}
                value={value}
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value, ref } }) => (
              <Input
                ref={ref}
                label={t('auth.login.password')}
                placeholder={t('auth.login.passwordPlaceholder')}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onChangeText={onChange}
                value={value}
                error={errors.password?.message}
                rightElement={
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    <Text style={styles.eyeText}>{showPassword ? t('common.hide') : t('common.show')}</Text>
                  </TouchableOpacity>
                }
              />
            )}
          />

          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotRow}
          >
            <Text style={styles.forgotText}>{t('auth.login.forgotPassword')}</Text>
          </TouchableOpacity>

          <Button
            title={t('auth.login.loginBtn')}
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            fullWidth
            style={styles.loginButton}
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('common.or')}</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>{t('auth.login.noAccount')} </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.signupLink}>{t('auth.login.signUp')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function getStyles(c: ColorPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    scroll: { flexGrow: 1, padding: Spacing['2xl'] },
    header: { alignItems: 'center', marginTop: Spacing['3xl'], marginBottom: Spacing['3xl'] },
    logo: {
      fontSize: Typography['3xl'],
      fontWeight: Typography.extrabold,
      color: c.textPrimary,
      letterSpacing: 6,
    },
    logoDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: c.primary,
      marginTop: Spacing.xs,
    },
    form: { flex: 1 },
    title: {
      fontSize: Typography['2xl'],
      fontWeight: Typography.bold,
      color: c.textPrimary,
      marginBottom: Spacing.xs,
    },
    subtitle: {
      fontSize: Typography.base,
      color: c.textSecondary,
      marginBottom: Spacing['2xl'],
    },
    forgotRow: { alignItems: I18nManager.isRTL ? 'flex-start' : 'flex-end', marginTop: -Spacing.sm, marginBottom: Spacing.base },
    forgotText: { fontSize: Typography.sm, color: c.primary },
    loginButton: { marginTop: Spacing.md },
    divider: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.xl },
    dividerLine: { flex: 1, height: 1, backgroundColor: c.surfaceBorder },
    dividerText: { color: c.textTertiary, fontSize: Typography.sm, marginHorizontal: Spacing.base },
    signupRow: { flexDirection: 'row', justifyContent: 'center' },
    signupText: { color: c.textSecondary, fontSize: Typography.base },
    signupLink: { color: c.primary, fontSize: Typography.base, fontWeight: Typography.semibold },
    eyeButton: { paddingHorizontal: Spacing.base },
    eyeText: { color: c.textTertiary, fontSize: Typography.sm },
  });
}

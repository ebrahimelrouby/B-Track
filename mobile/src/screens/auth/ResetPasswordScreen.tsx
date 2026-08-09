import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useColors, ColorPalette, Spacing, Typography } from '@/theme';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { authApi } from '@/api/auth.api';
import { AuthNavigationProp, AuthStackParamList } from '@/navigation/types';

type FormData = { code: string; newPassword: string; confirmPassword: string };

export default function ResetPasswordScreen() {
  const navigation = useNavigation<AuthNavigationProp>();
  const route = useRoute<RouteProp<AuthStackParamList, 'ResetPassword'>>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [showPassword, setShowPassword] = useState(false);

  const schema = z.object({
    code: z.string().regex(/^\d{6}$/, t('resetPassword.codeRequired')),
    newPassword: z.string().min(8, t('resetPassword.passwordMinLength')),
    confirmPassword: z.string(),
  }).refine((d) => d.newPassword === d.confirmPassword, {
    message: t('resetPassword.passwordMismatch'),
    path: ['confirmPassword'],
  });

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const { method, contact } = route.params;
      await authApi.resetPassword(
        method === 'email'
          ? { email: contact, code: data.code.trim(), newPassword: data.newPassword }
          : { phoneNumber: contact, code: data.code.trim(), newPassword: data.newPassword }
      );
    } catch (err: any) {
      const message = err.response?.data?.message ?? t('resetPassword.errorMsg');
      Alert.alert(t('resetPassword.errorTitle'), message);
      return;
    }
    Alert.alert(
      t('resetPassword.successTitle'),
      t('resetPassword.successMsg'),
      [{ text: t('resetPassword.successBtn'), onPress: () => navigation.navigate('Login') }]
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t('resetPassword.title')}</Text>
        <Text style={styles.subtitle}>{t('resetPassword.subtitle', { contact: route.params.contact })}</Text>

        <Controller
          control={control}
          name="code"
          render={({ field: { onChange, value, ref } }) => (
            <Input
              ref={ref}
              label={t('resetPassword.code')}
              placeholder={t('resetPassword.codePlaceholder')}
              keyboardType="number-pad"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="oneTimeCode"
              maxLength={6}
              onChangeText={onChange}
              value={value}
              error={errors.code?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="newPassword"
          render={({ field: { onChange, value, ref } }) => (
            <Input
              ref={ref}
              label={t('resetPassword.newPassword')}
              placeholder={t('resetPassword.newPasswordPlaceholder')}
              secureTextEntry={!showPassword}
              textContentType="oneTimeCode"
              onChangeText={onChange}
              value={value}
              error={errors.newPassword?.message}
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
              label={t('resetPassword.confirmPassword')}
              placeholder={t('resetPassword.confirmPasswordPlaceholder')}
              secureTextEntry={!showPassword}
              textContentType="oneTimeCode"
              onChangeText={onChange}
              value={value}
              error={errors.confirmPassword?.message}
            />
          )}
        />

        <Button
          title={t('resetPassword.submitBtn')}
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          fullWidth
          style={{ marginTop: Spacing.md }}
        />

        <Button
          title={t('forgotPassword.backToLogin')}
          variant="ghost"
          onPress={() => navigation.navigate('Login')}
          fullWidth
          style={{ marginTop: Spacing.md }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function getStyles(c: ColorPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    scroll: { flexGrow: 1, padding: Spacing['2xl'] },
    title: {
      fontSize: Typography['2xl'],
      fontWeight: Typography.bold,
      color: c.textPrimary,
      marginTop: Spacing.xl,
      marginBottom: Spacing.sm,
    },
    subtitle: {
      fontSize: Typography.base,
      color: c.textSecondary,
      marginBottom: Spacing['2xl'],
      lineHeight: 22,
    },
    eyeButton: { paddingHorizontal: Spacing.base },
    eyeText: { color: c.textTertiary, fontSize: Typography.sm },
  });
}

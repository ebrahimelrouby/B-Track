import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useColors, ColorPalette, Radius, Spacing, Typography } from '@/theme';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { authApi } from '@/api/auth.api';
import { AuthNavigationProp } from '@/navigation/types';
import { isValidPhoneNumber, normalizePhoneNumber } from '@/utils/phone';

type Method = 'email' | 'sms';
type FormData = { contact: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<AuthNavigationProp>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [method, setMethod] = useState<Method>('email');

  const schema = z.object({
    contact: z.string().refine(
      (v) => (method === 'email' ? EMAIL_RE.test(v) : isValidPhoneNumber(v)),
      method === 'email' ? t('forgotPassword.validEmail') : t('forgotPassword.validPhone')
    ),
  });

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  function selectMethod(next: Method) {
    setMethod(next);
    reset({ contact: '' });
  }

  const onSubmit = async (data: FormData) => {
    const contact = method === 'email' ? data.contact.trim() : normalizePhoneNumber(data.contact);
    try {
      await authApi.forgotPassword(
        method === 'email' ? { email: contact } : { phoneNumber: contact }
      );
    } catch {
      // The endpoint always succeeds server-side to avoid leaking whether an
      // account exists — only network-level failures land here.
      Alert.alert(t('forgotPassword.errorTitle'), t('forgotPassword.errorMsg'));
      return;
    }
    Alert.alert(
      method === 'email' ? t('forgotPassword.checkTitleEmail') : t('forgotPassword.checkTitleSms'),
      t('forgotPassword.checkMsg', { contact }),
      [{ text: t('forgotPassword.checkBtn'), onPress: () => navigation.navigate('ResetPassword', { method, contact }) }]
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + Spacing.xl }]}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('forgotPassword.title')}</Text>
        <Text style={styles.subtitle}>
          {method === 'email' ? t('forgotPassword.subtitleEmail') : t('forgotPassword.subtitleSms')}
        </Text>

        <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.toggleOption, method === 'email' && styles.toggleOptionActive]}
            onPress={() => selectMethod('email')}
          >
            <Text style={[styles.toggleText, method === 'email' && styles.toggleTextActive]}>
              {t('forgotPassword.methodEmail')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleOption, method === 'sms' && styles.toggleOptionActive]}
            onPress={() => selectMethod('sms')}
          >
            <Text style={[styles.toggleText, method === 'sms' && styles.toggleTextActive]}>
              {t('forgotPassword.methodSms')}
            </Text>
          </TouchableOpacity>
        </View>

        <Controller
          control={control}
          name="contact"
          render={({ field: { onChange, value, ref } }) => (
            <Input
              ref={ref}
              label={method === 'email' ? t('forgotPassword.email') : t('forgotPassword.phoneNumber')}
              placeholder={method === 'email' ? t('forgotPassword.emailPlaceholder') : t('forgotPassword.phoneNumberPlaceholder')}
              keyboardType={method === 'email' ? 'email-address' : 'numbers-and-punctuation'}
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={onChange}
              value={value}
              error={errors.contact?.message}
            />
          )}
        />

        <Button
          title={t('forgotPassword.sendBtn')}
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          fullWidth
          style={{ marginTop: Spacing.md }}
        />

        <Button
          title={t('forgotPassword.backToLogin')}
          variant="ghost"
          onPress={() => navigation.goBack()}
          fullWidth
          style={{ marginTop: Spacing.md }}
        />
      </View>
    </View>
  );
}

function getStyles(c: ColorPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    content: { padding: Spacing['2xl'] },
    title: {
      fontSize: Typography['2xl'],
      fontWeight: Typography.bold,
      color: c.textPrimary,
      marginBottom: Spacing.sm,
    },
    subtitle: {
      fontSize: Typography.base,
      color: c.textSecondary,
      marginBottom: Spacing.xl,
      lineHeight: 22,
    },
    toggle: {
      flexDirection: 'row',
      backgroundColor: c.surfaceElevated,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      padding: 4,
      marginBottom: Spacing.base,
    },
    toggleOption: {
      flex: 1,
      paddingVertical: Spacing.sm,
      borderRadius: Radius.md - 4,
      alignItems: 'center',
    },
    toggleOptionActive: {
      backgroundColor: c.primary,
    },
    toggleText: {
      fontSize: Typography.sm,
      fontWeight: Typography.medium,
      color: c.textSecondary,
    },
    toggleTextActive: {
      color: c.textInverse,
      fontWeight: Typography.semibold,
    },
  });
}

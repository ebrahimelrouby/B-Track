import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, I18nManager } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTranslation } from 'react-i18next';

import { useColors, ColorPalette, Spacing, Typography, Radius } from '@/theme';
import { useAuthStore } from '@/store/auth.store';
import { AiNavigationProp } from '@/navigation/types';

type Nav = AiNavigationProp;

const CONSENT_POINTS = [
  { icon: 'eye-off-outline', text: 'Photos are analyzed once and never stored permanently unless you choose to save results.' },
  { icon: 'lock-outline', text: 'Your photos are sent securely to our AI provider for analysis only.' },
  { icon: 'shield-check-outline', text: 'No nude, sexual, or inappropriate images. This feature is for fitness assessment only.' },
  { icon: 'delete-outline', text: 'You can delete your analysis and any associated data at any time.' },
  { icon: 'information-outline', text: 'Results are estimates — not medical diagnoses. Consult a professional for precise assessment.' },
];

export default function AiBodyFatConsentScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const { user } = useAuthStore();
  const { t } = useTranslation();

  const [consentGiven, setConsentGiven] = useState(false);

  const profile = user as unknown as {
    heightCm?: number;
    weightKg?: number;
    gender?: string;
    trainingExperience?: string;
    fitnessGoal?: string;
  };

  const handleContinue = () => {
    navigation.navigate('AiBodyFatPhoto', {
      consentGiven: true,
      heightCm: profile?.heightCm,
      weightKg: profile?.weightKg,
      gender: profile?.gender,
      trainingExperience: profile?.trainingExperience,
      goal: profile?.fitnessGoal,
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name={I18nManager.isRTL ? "arrow-right" : "arrow-left"} size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('aiBodyFatConsent.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Icon name="body-scan" size={40} color={colors.primary} />
          </View>
          <Text style={styles.heroTitle}>{t('aiBodyFatConsent.subtitle')}</Text>
          <Text style={styles.heroText}>
            Our AI analyzes photos to estimate your body fat percentage range.
            This takes about 30 seconds and provides a rough estimate based on visual analysis.
          </Text>
        </View>

        <View style={styles.privacyCard}>
          <Text style={styles.sectionTitle}>{t('aiBodyFatConsent.privacyTitle')}</Text>
          {CONSENT_POINTS.map((point, i) => (
            <View key={i} style={styles.pointRow}>
              <Icon name={point.icon} size={18} color={colors.primary} />
              <Text style={styles.pointText}>{point.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.disclaimerCard}>
          <Icon name="alert-circle-outline" size={20} color={colors.warning} />
          <View style={{ flex: 1 }}>
            <Text style={styles.disclaimerTitle}>{t('aiBodyFatConsent.medicalDisclaimer')}</Text>
            <Text style={styles.disclaimerText}>
              This is not a medical tool. Results are AI estimates with a typical margin of ±3–5%.
              For accurate measurements, consult a certified fitness professional or use DEXA scanning.
            </Text>
          </View>
        </View>

        <View style={styles.consentRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.consentLabel}>{t('aiBodyFatConsent.consentBody')}</Text>
            <Text style={styles.consentSub}>{t('aiBodyFatConsent.consentTerms')}</Text>
          </View>
          <Switch
            value={consentGiven}
            onValueChange={setConsentGiven}
            trackColor={{ true: colors.primaryDim, false: colors.surfaceBorder }}
            thumbColor={consentGiven ? colors.primary : colors.textTertiary}
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.base }]}>
        <TouchableOpacity
          style={[styles.cancelBtn, { flex: 1 }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelBtnText}>{t('aiBodyFatConsent.cancelBtn')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.continueBtn, { flex: 2 }, !consentGiven && styles.btnDisabled]}
          onPress={handleContinue}
          disabled={!consentGiven}
        >
          <Icon name="camera-outline" size={18} color={colors.textInverse} />
          <Text style={styles.continueBtnText}>{t('aiBodyFatConsent.continueBtn')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function getStyles(c: ColorPalette) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
      borderBottomWidth: 1, borderBottomColor: c.surfaceBorder,
    },
    backBtn: { padding: Spacing.sm },
    headerTitle: { fontSize: Typography.base, fontWeight: Typography.bold, color: c.textPrimary },

    scroll: { padding: Spacing.base, gap: Spacing.base },

    heroCard: {
      backgroundColor: c.surface, borderRadius: Radius.lg,
      borderWidth: 1, borderColor: c.surfaceBorder,
      padding: Spacing.xl, alignItems: 'center', gap: Spacing.md,
    },
    heroIcon: {
      width: 80, height: 80, borderRadius: 40,
      backgroundColor: c.primaryDim, alignItems: 'center', justifyContent: 'center',
    },
    heroTitle: {
      fontSize: Typography.lg, fontWeight: Typography.bold, color: c.textPrimary, textAlign: 'center',
    },
    heroText: {
      fontSize: Typography.sm, color: c.textSecondary, textAlign: 'center', lineHeight: 22,
    },

    privacyCard: {
      backgroundColor: c.surface, borderRadius: Radius.lg,
      borderWidth: 1, borderColor: c.surfaceBorder,
      padding: Spacing.base, gap: Spacing.md,
    },
    sectionTitle: { fontSize: Typography.sm, fontWeight: Typography.bold, color: c.textPrimary },
    pointRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
    pointText: { flex: 1, fontSize: Typography.sm, color: c.textSecondary, lineHeight: 20 },

    disclaimerCard: {
      flexDirection: 'row', gap: Spacing.sm,
      backgroundColor: c.warning + '15', borderRadius: Radius.lg,
      borderWidth: 1, borderColor: c.warning + '40',
      padding: Spacing.base, alignItems: 'flex-start',
    },
    disclaimerTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: c.warning, marginBottom: 4 },
    disclaimerText: { fontSize: Typography.xs, color: c.textSecondary, lineHeight: 18 },

    consentRow: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.base,
      backgroundColor: c.surface, borderRadius: Radius.lg,
      borderWidth: 1, borderColor: c.surfaceBorder, padding: Spacing.base,
    },
    consentLabel: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: c.textPrimary },
    consentSub: { fontSize: Typography.xs, color: c.textTertiary, marginTop: 2 },

    footer: {
      flexDirection: 'row', gap: Spacing.sm, padding: Spacing.base,
      borderTopWidth: 1, borderTopColor: c.surfaceBorder, backgroundColor: c.background,
    },
    cancelBtn: {
      paddingVertical: Spacing.md, borderRadius: Radius.lg,
      borderWidth: 1, borderColor: c.surfaceBorder, alignItems: 'center',
    },
    cancelBtnText: { fontSize: Typography.base, fontWeight: Typography.medium, color: c.textSecondary },
    continueBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: Spacing.sm, backgroundColor: c.primary, borderRadius: Radius.lg, paddingVertical: Spacing.md,
    },
    btnDisabled: { opacity: 0.4 },
    continueBtnText: { fontSize: Typography.base, fontWeight: Typography.bold, color: c.textInverse },
  });
}

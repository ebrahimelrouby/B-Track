import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

import { useColors, ColorPalette, Spacing, Typography, Radius } from '@/theme';
import Button from '@/components/common/Button';

export default function UpgradeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [selectedPlan, setSelectedPlan] = useState('annual');
  const [purchasing, setPurchasing] = useState(false);
  const { t } = useTranslation();

  const PLANS = [
    {
      id: 'monthly',
      label: t('upgrade.planMonthly'),
      price: '$9.99',
      period: t('upgrade.periodMonth'),
      productId: 'com.btrack.premium.monthly',
      badge: null,
    },
    {
      id: 'annual',
      label: t('upgrade.planAnnual'),
      price: '$59.99',
      period: t('upgrade.periodYear'),
      productId: 'com.btrack.premium.annual',
      badge: t('upgrade.saveBadge'),
    },
  ];

  const FEATURES = [
    { icon: 'infinite', label: t('upgrade.featUnlimitedPlans') },
    { icon: 'dumbbell', label: t('upgrade.featUnlimitedExercises') },
    { icon: 'chart-line', label: t('upgrade.featAnalytics') },
    { icon: 'history', label: t('upgrade.featFullHistory') },
    { icon: 'robot', label: t('upgrade.featAiCoach') },
    { icon: 'watch', label: t('upgrade.featAppleWatch') },
    { icon: 'camera', label: t('upgrade.featPhotos') },
    { icon: 'food', label: t('upgrade.featMeals') },
    { icon: 'download', label: t('upgrade.featExport') },
  ];

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      // TODO: Integrate react-native-iap here
      // await requestSubscription({ sku: selectedPlan === 'annual' ? IAP_PRODUCTS.PREMIUM_ANNUAL_IOS : IAP_PRODUCTS.PREMIUM_MONTHLY_IOS });
      Alert.alert(t('upgrade.purchaseTitle'), 'IAP integration required. See docs/IAP_SETUP.md');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <ScrollView
      style={[styles.root, { paddingTop: insets.top }]}
      contentContainerStyle={styles.scroll}
    >
      {/* Header */}
      <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
        <Icon name="close" size={24} color={colors.textSecondary} />
      </TouchableOpacity>

      <View style={styles.badge}>
        <Text style={styles.badgeText}>{t('upgrade.badge')}</Text>
      </View>

      <Text style={styles.title}>{t('upgrade.title')}</Text>
      <Text style={styles.subtitle}>{t('upgrade.subtitle')}</Text>

      {/* Plan selector */}
      <View style={styles.planRow}>
        {PLANS.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            style={[styles.planCard, selectedPlan === plan.id && styles.planCardSelected]}
            onPress={() => setSelectedPlan(plan.id)}
          >
            {plan.badge && (
              <View style={styles.planBadge}>
                <Text style={styles.planBadgeText}>{plan.badge}</Text>
              </View>
            )}
            <Text style={styles.planLabel}>{plan.label}</Text>
            <Text style={styles.planPrice}>{plan.price}</Text>
            <Text style={styles.planPeriod}>{plan.period}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Features */}
      <View style={styles.features}>
        {FEATURES.map((f) => (
          <View key={f.label} style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Icon name={f.icon} size={16} color={colors.primary} />
            </View>
            <Text style={styles.featureLabel}>{f.label}</Text>
          </View>
        ))}
      </View>

      {/* CTA */}
      <Button
        title={t('upgrade.ctaBtn', { price: PLANS.find((p) => p.id === selectedPlan)?.price })}
        onPress={handlePurchase}
        loading={purchasing}
        fullWidth
        style={styles.ctaButton}
      />

      <TouchableOpacity style={styles.restoreButton} onPress={() => Alert.alert(t('upgrade.restoreTitle'), t('upgrade.restoreMsg'))}>
        <Text style={styles.restoreText}>{t('upgrade.restoreBtn')}</Text>
      </TouchableOpacity>

      <Text style={styles.legalText}>{t('upgrade.legalText')}</Text>
    </ScrollView>
  );
}

function getStyles(c: ColorPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    scroll: { padding: Spacing['2xl'] },

    closeButton: { alignSelf: 'flex-end', marginBottom: Spacing.base },

    badge: {
      alignSelf: 'center',
      backgroundColor: c.primaryDim,
      borderWidth: 1,
      borderColor: c.primary,
      borderRadius: Radius.full,
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.xs,
      marginBottom: Spacing.base,
    },
    badgeText: { fontSize: Typography.xs, fontWeight: Typography.bold, color: c.primary, letterSpacing: 2 },

    title: {
      fontSize: Typography['2xl'],
      fontWeight: Typography.bold,
      color: c.textPrimary,
      textAlign: 'center',
      marginBottom: Spacing.sm,
    },
    subtitle: {
      fontSize: Typography.base,
      color: c.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: Spacing.xl,
    },

    planRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
    planCard: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      padding: Spacing.base,
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
    },
    planCardSelected: { borderColor: c.primary, backgroundColor: c.primaryDim },
    planBadge: {
      position: 'absolute',
      top: 0,
      right: 0,
      backgroundColor: c.primary,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
      borderBottomLeftRadius: Radius.sm,
    },
    planBadgeText: { fontSize: Typography.xs, fontWeight: Typography.bold, color: c.textInverse },
    planLabel: { fontSize: Typography.sm, color: c.textSecondary, fontWeight: Typography.medium, marginBottom: Spacing.xs },
    planPrice: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: c.textPrimary },
    planPeriod: { fontSize: Typography.xs, color: c.textTertiary },

    features: { gap: Spacing.md, marginBottom: Spacing.xl },
    featureRow: { flexDirection: 'row', alignItems: 'center' },
    featureIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: c.primaryDim,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
    },
    featureLabel: { fontSize: Typography.base, color: c.textPrimary },

    ctaButton: { marginBottom: Spacing.md },
    restoreButton: { alignItems: 'center', marginBottom: Spacing.base },
    restoreText: { fontSize: Typography.sm, color: c.textTertiary },

    legalText: {
      fontSize: Typography.xs,
      color: c.textTertiary,
      textAlign: 'center',
      lineHeight: 18,
      marginBottom: Spacing['2xl'],
    },
  });
}

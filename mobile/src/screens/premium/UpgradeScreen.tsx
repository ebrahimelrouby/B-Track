import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, I18nManager } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { useIAP, ErrorCode } from 'react-native-iap';

import { useColors, ColorPalette, Spacing, Typography, Radius } from '@/theme';
import Button from '@/components/common/Button';
import { IAP_PRODUCTS } from '@/constants/config';
import { subscriptionApi } from '@/api/subscription.api';
import { useAuthStore } from '@/store/auth.store';
import { displayPrice } from './displayPrice';

type PlanId = 'monthly' | 'annual';

export default function UpgradeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('annual');
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const { t } = useTranslation();
  const setEntitlements = useAuthStore((s) => s.setEntitlements);
  const queryClient = useQueryClient();
  const purchaseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPurchaseTimeout = () => {
    if (purchaseTimeoutRef.current) {
      clearTimeout(purchaseTimeoutRef.current);
      purchaseTimeoutRef.current = null;
    }
  };

  useEffect(() => clearPurchaseTimeout, []);

  // After a real server-verified purchase, write to both the store (for
  // synchronous reads) and the query cache `AppNavigator` owns — otherwise a
  // later refetch of ['entitlements'] has nothing new to reconcile against
  // and could appear to race with what we just set.
  const applyEntitlements = (entitlements: Awaited<ReturnType<typeof subscriptionApi.verifyPurchase>>) => {
    setEntitlements(entitlements);
    queryClient.setQueryData(['entitlements'], entitlements);
  };

  const {
    connected,
    subscriptions,
    getSubscriptions,
    requestSubscription,
    currentPurchase,
    currentPurchaseError,
    finishTransaction,
    availablePurchases,
    getAvailablePurchases,
  } = useIAP();

  const monthlySku = Platform.OS === 'ios' ? IAP_PRODUCTS.PREMIUM_MONTHLY_IOS : IAP_PRODUCTS.PREMIUM_MONTHLY_ANDROID;
  const annualSku = Platform.OS === 'ios' ? IAP_PRODUCTS.PREMIUM_ANNUAL_IOS : IAP_PRODUCTS.PREMIUM_ANNUAL_ANDROID;

  useEffect(() => {
    if (connected) getSubscriptions({ skus: [monthlySku, annualSku] });
  }, [connected]);

  const PLANS = [
    {
      id: 'monthly' as const,
      label: t('upgrade.planMonthly'),
      price: displayPrice(subscriptions.find((s) => s.productId === monthlySku), '$9.99'),
      period: t('upgrade.periodMonth'),
      sku: monthlySku,
      badge: null,
    },
    {
      id: 'annual' as const,
      label: t('upgrade.planAnnual'),
      price: displayPrice(subscriptions.find((s) => s.productId === annualSku), '$59.99'),
      period: t('upgrade.periodYear'),
      sku: annualSku,
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
    // Some purchase flows (e.g. iOS Ask to Buy pending approval, or a sheet
    // dismissal react-native-iap doesn't surface as currentPurchaseError) never
    // fire either listener — without this, the button would stay stuck
    // "purchasing" forever with no way to retry short of restarting the app.
    clearPurchaseTimeout();
    purchaseTimeoutRef.current = setTimeout(() => {
      setPurchasing(false);
      Alert.alert(
        t('upgrade.purchaseTitle'),
        'This is taking longer than expected. If you approved the purchase elsewhere (e.g. Ask to Buy), use "Restore Purchases" once it\'s approved.'
      );
    }, 30_000);
    try {
      const sku = selectedPlan === 'annual' ? annualSku : monthlySku;
      if (Platform.OS === 'android') {
        const product = subscriptions.find((s) => s.productId === sku) as any;
        const offerToken = product?.subscriptionOfferDetails?.[0]?.offerToken;
        if (!offerToken) throw new Error('This plan is not available for purchase right now.');
        await requestSubscription({ subscriptionOffers: [{ sku, offerToken }] });
      } else {
        await requestSubscription({ sku });
      }
    } catch (e: any) {
      clearPurchaseTimeout();
      setPurchasing(false);
      Alert.alert(t('upgrade.purchaseTitle'), e?.message ?? 'Purchase failed. Please try again.');
    }
  };

  // Purchase completed natively — verify server-side (never trust the client's
  // own copy of the receipt for anything) before reflecting premium locally.
  useEffect(() => {
    if (!currentPurchase) return;
    clearPurchaseTimeout();
    (async () => {
      try {
        const isIos = Platform.OS === 'ios';
        const plan: PlanId = currentPurchase.productId === annualSku ? 'annual' : 'monthly';
        const entitlements = await subscriptionApi.verifyPurchase({
          platform: isIos ? 'ios' : 'android',
          plan,
          purchaseToken: currentPurchase.purchaseToken,
          receiptData: isIos ? currentPurchase.transactionReceipt : undefined,
        });
        await finishTransaction({ purchase: currentPurchase, isConsumable: false });
        applyEntitlements(entitlements);
        setPurchasing(false);
        Alert.alert(t('upgrade.purchaseTitle'), t('upgrade.purchaseSuccessMsg'));
        navigation.goBack();
      } catch (e: any) {
        setPurchasing(false);
        Alert.alert(t('upgrade.purchaseTitle'), e?.response?.data?.message ?? 'Could not verify your purchase. Please contact support.');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPurchase]);

  useEffect(() => {
    if (!currentPurchaseError) return;
    clearPurchaseTimeout();
    setPurchasing(false);
    // The user closing the native purchase sheet isn't an error worth alerting on.
    if (currentPurchaseError.code === ErrorCode.E_USER_CANCELLED) return;
    Alert.alert(t('upgrade.purchaseTitle'), currentPurchaseError.message);
  }, [currentPurchaseError]);

  const handleRestore = async () => {
    setRestoring(true);
    try {
      await getAvailablePurchases();
    } catch {
      setRestoring(false);
      Alert.alert(t('upgrade.restoreTitle'), 'Could not restore purchases.');
    }
  };

  useEffect(() => {
    if (!restoring || availablePurchases.length === 0) return;
    (async () => {
      const isIos = Platform.OS === 'ios';
      let succeeded = 0;
      let failed = 0;
      for (const purchase of availablePurchases) {
        try {
          const plan: PlanId = purchase.productId === annualSku ? 'annual' : 'monthly';
          const entitlements = await subscriptionApi.verifyPurchase({
            platform: isIos ? 'ios' : 'android',
            plan,
            purchaseToken: purchase.purchaseToken,
            receiptData: isIos ? purchase.transactionReceipt : undefined,
          });
          applyEntitlements(entitlements);
          succeeded += 1;
        } catch {
          // Keep restoring the rest even if one purchase fails to re-verify —
          // but count it, so the final message doesn't falsely claim success.
          failed += 1;
        }
      }
      setRestoring(false);
      if (succeeded > 0) {
        Alert.alert(t('upgrade.restoreTitle'), t('upgrade.restoreMsg'));
      } else if (failed > 0) {
        Alert.alert(t('upgrade.restoreTitle'), 'Could not restore your purchases. Please try again or contact support.');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availablePurchases]);

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

      <TouchableOpacity style={styles.restoreButton} onPress={handleRestore} disabled={restoring}>
        <Text style={styles.restoreText}>{restoring ? t('upgrade.restoring') : t('upgrade.restoreBtn')}</Text>
      </TouchableOpacity>

      <Text style={styles.legalText}>{t('upgrade.legalText')}</Text>
    </ScrollView>
  );
}

function getStyles(c: ColorPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    scroll: { padding: Spacing['2xl'] },

    closeButton: { alignSelf: I18nManager.isRTL ? 'flex-start' : 'flex-end', marginBottom: Spacing.base },

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
      end: 0,
      backgroundColor: c.primary,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
      borderEndStartRadius: Radius.sm,
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
      marginEnd: Spacing.md,
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

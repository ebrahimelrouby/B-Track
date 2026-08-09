import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, I18nManager } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTranslation } from 'react-i18next';

import { useColors, ColorPalette, Spacing, Typography, Radius } from '@/theme';
import { aiApi } from '@/api/ai.api';
import { AiBodyFatEstimate } from '@/types';
import { AiStackParamList } from '@/navigation/types';

type RouteProps = RouteProp<AiStackParamList, 'AiBodyFatResult'>;

// Rough body fat category labels
function getCategory(min: number, gender?: string): string {
  const isFemale = gender?.toLowerCase() === 'female';
  if (isFemale) {
    if (min < 14) return 'Essential Fat';
    if (min < 21) return 'Athletic';
    if (min < 25) return 'Fitness';
    if (min < 32) return 'Acceptable';
    return 'Obese';
  } else {
    if (min < 6) return 'Essential Fat';
    if (min < 14) return 'Athletic';
    if (min < 18) return 'Fitness';
    if (min < 25) return 'Acceptable';
    return 'Obese';
  }
}

function getCategoryColor(category: string, colors: ColorPalette): string {
  const map: Record<string, string> = {
    'Essential Fat': colors.error,
    'Athletic': colors.primary,
    'Fitness': colors.success,
    'Acceptable': colors.warning,
    'Obese': colors.error,
  };
  return map[category] ?? colors.textSecondary;
}

export default function AiBodyFatResultScreen() {
  const navigation = useNavigation<any>();
  const { params } = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const getCategoryLabel = (cat: string) => ({
    'Essential Fat': t('aiBodyFatResult.catEssential'),
    'Athletic': t('aiBodyFatResult.catAthletic'),
    'Fitness': t('aiBodyFatResult.catFitness'),
    'Acceptable': t('aiBodyFatResult.catAcceptable'),
    'Obese': t('aiBodyFatResult.catObese'),
  }[cat] ?? cat);

  const [estimate] = useState<AiBodyFatEstimate | null>(
    () => queryClient.getQueryData<AiBodyFatEstimate>(['ai-body-fat-result', params.estimateId]) ?? null,
  );

  const saveMutation = useMutation({
    mutationFn: () => aiApi.saveBodyFatEstimate(params.estimateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-body-fat-history'] });
      Alert.alert(t('aiBodyFatResult.savedTitle'), t('aiBodyFatResult.savedMsg'), [
        { text: t('common.ok'), onPress: () => navigation.goBack() },
      ]);
    },
    onError: () => Alert.alert(t('common.error'), t('aiBodyFatResult.saveError')),
  });

  const handleDiscard = () => {
    Alert.alert(
      t('aiBodyFatResult.discardTitle'),
      t('aiBodyFatResult.discardMsg'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('aiBodyFatResult.discardBtn'),
          style: 'destructive',
          onPress: () => {
            aiApi.deleteBodyFatEstimate(params.estimateId);
            navigation.goBack();
          },
        },
      ],
    );
  };

  if (!estimate) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{t('aiBodyFatResult.notFound')}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.retryBtn}>
          <Text style={styles.retryBtnText}>{t('aiBodyFatResult.goBack')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const category = getCategory(estimate.minBodyFatPct, estimate.gender);
  const categoryColor = getCategoryColor(category, colors);
  const confidencePct = Math.round((estimate.confidenceScore ?? 0) * 100);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name={I18nManager.isRTL ? "arrow-right" : "arrow-left"} size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('aiBodyFatResult.title')}</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('AiBodyFatHistory')}
          style={styles.backBtn}
        >
          <Icon name="history" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 110 }]}
      >
        <View style={styles.resultHero}>
          <Text style={styles.rangeLabel}>{t('aiBodyFatResult.rangeLabel')}</Text>
          <Text style={styles.rangeValue}>
            {estimate.minBodyFatPct.toFixed(1)}% – {estimate.maxBodyFatPct.toFixed(1)}%
          </Text>
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '22', borderColor: categoryColor + '60' }]}>
            <Text style={[styles.categoryText, { color: categoryColor }]}>{getCategoryLabel(category)}</Text>
          </View>
          <Text style={styles.confidenceText}>{t('aiBodyFatResult.confidence', { pct: confidencePct })}</Text>

          <TouchableOpacity
            style={[styles.scanBtn, { borderColor: colors.primary + '60', backgroundColor: colors.primary + '14' }]}
            onPress={() => navigation.navigate('BodyScanVisualization', {
              minBodyFatPct: estimate.minBodyFatPct,
              maxBodyFatPct: estimate.maxBodyFatPct,
              gender: estimate.gender,
              category,
            })}
          >
            <Icon name="human-male-board" size={18} color={colors.primary} />
            <Text style={[styles.scanBtnText, { color: colors.primary }]}>{t('aiBodyFatResult.viewScan')}</Text>
            <Icon name="chevron-right" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {(estimate.visualObservations?.length ?? 0) > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Icon name="eye-outline" size={16} color={colors.primary} />
              <Text style={styles.cardTitle}>{t('aiBodyFatResult.obsTitle')}</Text>
            </View>
            {estimate.visualObservations!.map((obs, i) => (
              <View key={i} style={styles.bulletRow}>
                <View style={[styles.bullet, { backgroundColor: colors.primary }]} />
                <Text style={styles.bulletText}>{obs}</Text>
              </View>
            ))}
          </View>
        )}

        {(estimate.recommendations?.length ?? 0) > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Icon name="lightning-bolt" size={16} color={colors.primary} />
              <Text style={styles.cardTitle}>{t('aiBodyFatResult.recsTitle')}</Text>
            </View>
            {estimate.recommendations!.map((rec, i) => (
              <View key={i} style={styles.bulletRow}>
                <View style={[styles.bullet, { backgroundColor: colors.success }]} />
                <Text style={styles.bulletText}>{rec}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.disclaimerCard}>
          <Icon name="alert-circle-outline" size={16} color={colors.warning} />
          <Text style={styles.disclaimerText}>
            This is an AI estimate with ±3–5% typical margin of error. It is NOT a medical measurement.
            Results depend heavily on photo quality, lighting, and clothing.
            Consult a certified professional for precise assessment.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.base }]}>
        <TouchableOpacity style={styles.discardBtn} onPress={handleDiscard}>
          <Icon name="trash-can-outline" size={16} color={colors.error} />
          <Text style={styles.discardBtnText}>{t('aiBodyFatResult.discardBtn')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, saveMutation.isPending && { opacity: 0.6 }]}
          onPress={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending
            ? <ActivityIndicator color={colors.textInverse} size="small" />
            : <Icon name="bookmark-outline" size={18} color={colors.textInverse} />}
          <Text style={styles.saveBtnText}>{t('aiBodyFatResult.saveBtn')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function getStyles(c: ColorPalette) {
  return StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background, gap: Spacing.base },
    errorText: { fontSize: Typography.base, color: c.textSecondary },
    retryBtn: { backgroundColor: c.primary, borderRadius: Radius.md, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm },
    retryBtnText: { color: c.textInverse, fontWeight: Typography.bold },

    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
      borderBottomWidth: 1, borderBottomColor: c.surfaceBorder,
    },
    backBtn: { padding: Spacing.sm },
    headerTitle: { fontSize: Typography.base, fontWeight: Typography.bold, color: c.textPrimary },

    scroll: { padding: Spacing.base, gap: Spacing.base },

    resultHero: {
      backgroundColor: c.surface, borderRadius: Radius.lg,
      borderWidth: 1, borderColor: c.surfaceBorder,
      padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm,
    },
    rangeLabel: { fontSize: Typography.sm, color: c.textSecondary },
    rangeValue: { fontSize: 40, fontWeight: Typography.bold, color: c.textPrimary },
    categoryBadge: {
      paddingHorizontal: Spacing.xl, paddingVertical: Spacing.xs,
      borderRadius: Radius.full, borderWidth: 1,
    },
    categoryText: { fontSize: Typography.sm, fontWeight: Typography.bold },
    confidenceText: { fontSize: Typography.xs, color: c.textTertiary },
    scanBtn: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      borderWidth: 1, borderRadius: Radius.lg,
      paddingVertical: Spacing.sm, paddingHorizontal: Spacing.base,
      marginTop: Spacing.xs,
    },
    scanBtnText: { flex: 1, fontSize: Typography.sm, fontWeight: Typography.semibold },

    card: {
      backgroundColor: c.surface, borderRadius: Radius.lg,
      borderWidth: 1, borderColor: c.surfaceBorder, padding: Spacing.base, gap: Spacing.sm,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    cardTitle: { fontSize: Typography.sm, fontWeight: Typography.bold, color: c.textPrimary },
    bulletRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
    bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
    bulletText: { flex: 1, fontSize: Typography.sm, color: c.textSecondary, lineHeight: 22 },

    disclaimerCard: {
      flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start',
      backgroundColor: c.warning + '12', borderRadius: Radius.lg,
      borderWidth: 1, borderColor: c.warning + '40', padding: Spacing.base,
    },
    disclaimerText: { flex: 1, fontSize: Typography.xs, color: c.textSecondary, lineHeight: 18 },

    footer: {
      flexDirection: 'row', gap: Spacing.sm, padding: Spacing.base,
      borderTopWidth: 1, borderTopColor: c.surfaceBorder, backgroundColor: c.background,
    },
    discardBtn: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
      paddingVertical: Spacing.md, paddingHorizontal: Spacing.base,
      borderRadius: Radius.lg, borderWidth: 1, borderColor: c.error + '60',
    },
    discardBtnText: { fontSize: Typography.sm, fontWeight: Typography.medium, color: c.error },
    saveBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: Spacing.sm, backgroundColor: c.primary, borderRadius: Radius.lg, paddingVertical: Spacing.md,
    },
    saveBtnText: { fontSize: Typography.base, fontWeight: Typography.bold, color: c.textInverse },
  });
}

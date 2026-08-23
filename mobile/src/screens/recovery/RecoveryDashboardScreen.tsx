import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Sleep uses the AutoSleep-inspired purple palette instead of the generic score colour
const SLEEP_PURPLE = '#8B5CF6';
const SLEEP_DIM    = '#7C3AED20';

import { useTranslation } from 'react-i18next';

import { useColors, ColorPalette, Spacing, Typography, Radius, TAB_BAR_PADDING } from '@/theme';
import { HealthNavigationProp } from '@/navigation/types';
import { recoveryApi } from '@/api/recovery.api';
import { useAuthStore } from '@/store/auth.store';
import {
  RecoveryLevel, RecoveryScore, RecoveryCheckIn, RecoveryComponent, RecommendationType,
} from '@/types';

const DISCLAIMER =
  'This recovery score is an estimate for fitness tracking only and is not medical advice.';

const W = Dimensions.get('window').width;

// ─── Level config ─────────────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<RecoveryLevel, { label: string; color: string; icon: string }> = {
  READY_FOR_HEAVY_TRAINING:      { label: 'Ready for Heavy Training',      color: '#22C55E', icon: 'lightning-bolt' },
  READY_FOR_NORMAL_TRAINING:     { label: 'Ready for Normal Training',     color: '#4ADE80', icon: 'check-circle' },
  MODERATE_TRAINING_RECOMMENDED: { label: 'Moderate Training Recommended', color: '#F59E0B', icon: 'alert-circle' },
  LIGHT_ACTIVITY_RECOMMENDED:    { label: 'Light Activity Recommended',    color: '#F97316', icon: 'walk' },
  REST_RECOMMENDED:              { label: 'Rest Recommended Today',        color: '#EF4444', icon: 'sleep' },
};

const REC_ICONS: Record<RecommendationType, string> = {
  TRAINING:  'dumbbell',
  SLEEP:     'moon-waning-crescent',
  HYDRATION: 'water',
  NUTRITION: 'food-apple',
  GENERAL:   'lightbulb-outline',
};

function levelColor(level: RecoveryLevel, colors: ColorPalette): string {
  return LEVEL_CONFIG[level]?.color ?? colors.primary;
}

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score, level, size, colors }: {
  score: number; level: RecoveryLevel; size: number; colors: ColorPalette;
}) {
  const sw  = 16;
  const r   = (size - sw) / 2;
  const cx  = size / 2;
  const c   = 2 * Math.PI * r;
  const off = c * (1 - Math.min(score, 100) / 100);
  const col = levelColor(level, colors);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={cx} cy={cx} r={r} stroke={colors.surfaceElevated} strokeWidth={sw} fill="none" />
        <Circle
          cx={cx} cy={cx} r={r}
          stroke={col} strokeWidth={sw} fill="none"
          strokeDasharray={c} strokeDashoffset={off}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cx})`}
        />
      </Svg>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 44, fontWeight: Typography.extrabold, color: col, lineHeight: 50 }}>
          {score}
        </Text>
        <Text style={{ fontSize: Typography.xs, color: colors.textTertiary, marginTop: 2 }}>/ 100</Text>
      </View>
    </View>
  );
}

// ─── Component Row ────────────────────────────────────────────────────────────

const COMPONENT_META: { key: keyof RecoveryScore['components']; icon: string; label: string; weight: string }[] = [
  { key: 'sleep',              icon: 'moon-waning-crescent', label: 'Sleep',              weight: '35%' },
  { key: 'trainingLoad',       icon: 'dumbbell',             label: 'Training Load',      weight: '25%' },
  { key: 'heartRecovery',      icon: 'heart-pulse',          label: 'Heart Recovery',     weight: '20%' },
  { key: 'hydration',          icon: 'water',                label: 'Hydration',          weight: '10%' },
  { key: 'subjectiveWellness', icon: 'emoticon-outline',     label: 'Wellness',           weight: '10%' },
];

function ComponentBar({ component, meta, colors }: {
  component: RecoveryComponent;
  meta: (typeof COMPONENT_META)[0];
  colors: ColorPalette;
}) {
  const { t } = useTranslation();
  const pct       = component.score / 100;
  const isUnknown = component.status === 'UNKNOWN';
  const isSleep   = meta.key === 'sleep';
  const barColor  = isUnknown
    ? colors.textTertiary
    : isSleep
      ? SLEEP_PURPLE
      : component.score >= 70 ? '#22C55E' : component.score >= 55 ? '#F59E0B' : '#EF4444';

  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={[cbStyles.iconBox, { backgroundColor: isSleep ? SLEEP_DIM : barColor + '20' }]}>
          <Icon name={meta.icon} size={14} color={barColor} />
        </View>
        <Text style={[cbStyles.label, { color: colors.textPrimary }]}>{t(`recoveryDetails.${
          meta.key === 'sleep' ? 'compSleep' :
          meta.key === 'trainingLoad' ? 'compTraining' :
          meta.key === 'heartRecovery' ? 'compHeart' :
          meta.key === 'hydration' ? 'compHydration' : 'compWellness'
        }`)}</Text>
        <Text style={[cbStyles.weight, { color: colors.textTertiary }]}>{meta.weight}</Text>
        <View style={{ flex: 1 }} />
        <Text style={[cbStyles.score, { color: isUnknown ? colors.textTertiary : colors.textPrimary }]}>
          {isUnknown ? '—' : component.score}
        </Text>
      </View>
      <View style={[cbStyles.track, { backgroundColor: colors.surfaceElevated }]}>
        {!isUnknown && (
          <View style={[cbStyles.fill, { width: `${pct * 100}%`, backgroundColor: barColor }]} />
        )}
        {isUnknown && (
          <View style={[cbStyles.fill, { width: '100%', backgroundColor: colors.surfaceElevated }]}>
            <Text style={{ fontSize: 9, color: colors.textTertiary, textAlign: 'center', lineHeight: 8 }}>
              {t('recoveryDashboard.noData')}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const cbStyles = StyleSheet.create({
  iconBox: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  label:   { fontSize: Typography.sm, fontWeight: Typography.medium },
  weight:  { fontSize: Typography.xs },
  score:   { fontSize: Typography.sm, fontWeight: Typography.bold, minWidth: 24, textAlign: 'right' },
  track:   { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill:    { height: 6, borderRadius: 3 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function RecoveryDashboardScreen() {
  const navigation = useNavigation<HealthNavigationProp>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { entitlements } = useAuthStore();
  const qc = useQueryClient();
  const { t } = useTranslation();

  const getLevelLabel = (key: RecoveryLevel): string => ({
    READY_FOR_HEAVY_TRAINING:      t('recoveryDashboard.levelHeavy'),
    READY_FOR_NORMAL_TRAINING:     t('recoveryDashboard.levelNormal'),
    MODERATE_TRAINING_RECOMMENDED: t('recoveryDashboard.levelModerate'),
    LIGHT_ACTIVITY_RECOMMENDED:    t('recoveryDashboard.levelLight'),
    REST_RECOMMENDED:              t('recoveryDashboard.levelRest'),
  }[key] ?? key);

  const getCompLabel = (key: string): string => ({
    sleep:              t('recoveryDetails.compSleep'),
    trainingLoad:       t('recoveryDetails.compTraining'),
    heartRecovery:      t('recoveryDetails.compHeart'),
    hydration:          t('recoveryDetails.compHydration'),
    subjectiveWellness: t('recoveryDetails.compWellness'),
  }[key] ?? key);

  const { data: score, isLoading, isRefetching, refetch } = useQuery<RecoveryScore>({
    queryKey: ['recovery-today'],
    queryFn:  recoveryApi.getToday,
  });

  const { data: checkIn } = useQuery<RecoveryCheckIn | null>({
    queryKey: ['recovery-check-in-today'],
    queryFn:  recoveryApi.getTodayCheckIn,
  });

  const recalcMut = useMutation({
    mutationFn: recoveryApi.recalculate,
    onSuccess: (data) => {
      qc.setQueryData(['recovery-today'], data);
    },
  });

  useFocusEffect(
    React.useCallback(() => { refetch(); }, [refetch])
  );

  const levelCfg = score ? LEVEL_CONFIG[score.recoveryLevel as RecoveryLevel] : null;
  const col = score ? levelColor(score.recoveryLevel as RecoveryLevel, colors) : colors.primary;

  return (
    <ScrollView
      style={[styles.root, { paddingTop: insets.top }]}
      contentContainerStyle={[styles.scroll, { paddingBottom: TAB_BAR_PADDING }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isLoading || isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t('recoveryDashboard.title')}</Text>
          <Text style={styles.subtitle}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('RecoveryHistory')}>
            <Icon name="history" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('RecoverySettings')}>
            <Icon name="cog-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Score Ring Card ─────────────────────────────────────────────────── */}
      {score ? (
        <>
          <View style={styles.ringCard}>
            <ScoreRing score={score.recoveryScore} level={score.recoveryLevel} size={170} colors={colors} />

            <View style={[styles.levelBadge, { backgroundColor: col + '20' }]}>
              <Icon name={levelCfg!.icon} size={14} color={col} />
              <Text style={[styles.levelText, { color: col }]}>{getLevelLabel(score.recoveryLevel as RecoveryLevel)}</Text>
            </View>

            {/* Confidence */}
            <Text style={styles.confidenceText}>
              {Math.round(score.confidence * 100)}{t('recoveryDashboard.confidence')}
              {score.missingData.length > 0 && ` · ${t('recoveryDashboard.missingData')}`}
            </Text>

            {/* Recalculate */}
            <TouchableOpacity
              style={styles.recalcBtn}
              onPress={() => recalcMut.mutate()}
              disabled={recalcMut.isPending}
            >
              <Icon name="refresh" size={13} color={colors.primary} />
              <Text style={styles.recalcText}>
                {recalcMut.isPending ? t('recoveryDashboard.recalculating') : t('recoveryDashboard.recalculate')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Top recommendation card ──────────────────────────────────────── */}
          {score.recommendations[0] && (
            <TouchableOpacity
              style={styles.recCard}
              onPress={() => navigation.navigate('RecoveryDetails', { date: score.date })}
              activeOpacity={0.8}
            >
              <View style={[styles.recIconBox, { backgroundColor: col + '20' }]}>
                <Icon name={REC_ICONS[score.recommendations[0].type as RecommendationType] ?? 'lightbulb-outline'} size={18} color={col} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.recTitle}>{score.recommendations[0].title}</Text>
                <Text style={styles.recDesc} numberOfLines={2}>{score.recommendations[0].description}</Text>
              </View>
              <Icon name="chevron-right" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}

          {/* ── Component breakdown ──────────────────────────────────────────── */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('RecoveryDetails', { date: score.date })}
            activeOpacity={0.85}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{t('recoveryDashboard.componentBreakdown')}</Text>
              <Icon name="chevron-right" size={16} color={colors.textTertiary} />
            </View>
            <View style={{ gap: Spacing.base }}>
              {COMPONENT_META.map(meta => (
                <ComponentBar
                  key={meta.key}
                  component={score.components[meta.key]}
                  meta={meta}
                  colors={colors}
                />
              ))}
            </View>
          </TouchableOpacity>

          {/* ── Daily Check-In CTA ──────────────────────────────────────────── */}
          {!checkIn ? (
            <TouchableOpacity
              style={[styles.checkInCard, { borderColor: colors.primary + '50' }]}
              onPress={() => navigation.navigate('RecoveryCheckIn', { date: score.date })}
              activeOpacity={0.8}
            >
              <View style={[styles.checkInIconBox, { backgroundColor: colors.primaryDim }]}>
                <Icon name="clipboard-check-outline" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.checkInTitle}>{t('recoveryDashboard.completeCheckIn')}</Text>
                <Text style={styles.checkInSub}>{t('recoveryDashboard.checkInDesc')}</Text>
              </View>
              <View style={[styles.checkInPill, { backgroundColor: colors.primary }]}>
                <Text style={styles.checkInPillText}>{t('recoveryDashboard.checkInTime')}</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.checkInCard, { borderColor: '#22C55E50' }]}
              onPress={() => navigation.navigate('RecoveryCheckIn', { date: score.date })}
              activeOpacity={0.8}
            >
              <View style={[styles.checkInIconBox, { backgroundColor: '#22C55E20' }]}>
                <Icon name="check-circle" size={22} color="#22C55E" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.checkInTitle, { color: '#22C55E' }]}>{t('recoveryDashboard.checkInComplete')}</Text>
                <Text style={styles.checkInSub}>
                  {t('recoveryDashboard.checkInStatus', { energy: checkIn.energyLevel, soreness: checkIn.sorenessLevel })}
                </Text>
              </View>
              <Icon name="pencil-outline" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          )}

          {/* ── Missing data warnings ──────────────────────────────────────── */}
          {score.missingData.length > 0 && (
            <View style={styles.missingCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Icon name="information-outline" size={15} color={colors.warning} />
                <Text style={[styles.missingTitle, { color: colors.warning }]}>{t('recoveryDashboard.limitedData')}</Text>
              </View>
              {score.missingData.map((m: string, i: number) => (
                <Text key={i} style={styles.missingItem}>· {m}</Text>
              ))}
            </View>
          )}

          {/* ── AI Insights (Premium) ──────────────────────────────────────── */}
          {entitlements?.isPremium ? (
            <View style={[styles.card, { borderColor: colors.primary + '30' }]}>
              <View style={styles.cardHeader}>
                <View style={styles.aiIconBox}>
                  <Icon name="brain" size={14} color={colors.primary} />
                </View>
                <Text style={[styles.cardTitle, { color: colors.primary }]}>{t('recoveryDashboard.aiInsight')}</Text>
              </View>
              <Text style={styles.aiInsightText}>
                Your recovery is usually higher after days when you log 8+ hours of sleep.
                Your hydration consistently improves recovery by 8–12 points on training days.
              </Text>
              <Text style={styles.aiDisclaimer}>{t('recoveryDashboard.aiInsightNote')}</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.premiumCard} activeOpacity={0.8}>
              <Icon name="crown" size={16} color="#F59E0B" />
              <View style={{ flex: 1 }}>
                <Text style={styles.premiumTitle}>{t('recoveryDashboard.unlockAiTitle')}</Text>
                <Text style={styles.premiumSub}>{t('recoveryDashboard.unlockAiDesc')}</Text>
              </View>
              <Icon name="chevron-right" size={16} color="#F59E0B" />
            </TouchableOpacity>
          )}

          {/* ── Disclaimer ────────────────────────────────────────────────── */}
          <Text style={styles.disclaimer}>{t('healthHub.recoveryDisclaimer')}</Text>
        </>
      ) : (
        <View style={styles.loadingState}>
          <Icon name="heart-pulse" size={48} color={colors.textTertiary} />
          <Text style={styles.loadingText}>{t('recoveryDashboard.calculating')}</Text>
        </View>
      )}
    </ScrollView>
  );
}

function getStyles(c: ColorPalette) {
  return StyleSheet.create({
    root:   { flex: 1, backgroundColor: c.background },
    scroll: { padding: Spacing.base, gap: Spacing.md },

    header: {
      flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
      paddingTop: Spacing.sm, marginBottom: Spacing.xs,
    },
    title:    { fontSize: Typography.xl, fontWeight: Typography.bold, color: c.textPrimary },
    subtitle: { fontSize: Typography.sm, color: c.textTertiary, marginTop: 2 },
    iconBtn:  {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: c.surfaceElevated,
      alignItems: 'center', justifyContent: 'center',
    },

    ringCard: {
      backgroundColor: c.surface, borderRadius: Radius.lg,
      borderWidth: 1, borderColor: c.surfaceBorder,
      padding: Spacing.xl, alignItems: 'center', gap: Spacing.md,
    },
    levelBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: Spacing.md, paddingVertical: 6,
      borderRadius: Radius.full,
    },
    levelText: { fontSize: Typography.sm, fontWeight: Typography.semibold },
    confidenceText: { fontSize: Typography.xs, color: c.textTertiary },
    recalcBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingHorizontal: Spacing.md, paddingVertical: 6,
      borderRadius: Radius.full,
      backgroundColor: c.primaryDim,
    },
    recalcText: { fontSize: Typography.xs, color: c.primary, fontWeight: Typography.medium },

    recCard: {
      backgroundColor: c.surface, borderRadius: Radius.lg,
      borderWidth: 1, borderColor: c.surfaceBorder,
      padding: Spacing.base, flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    },
    recIconBox: { width: 38, height: 38, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    recTitle:   { fontSize: Typography.sm, fontWeight: Typography.bold, color: c.textPrimary },
    recDesc:    { fontSize: Typography.xs, color: c.textSecondary, marginTop: 2, lineHeight: 16 },

    card: {
      backgroundColor: c.surface, borderRadius: Radius.lg,
      borderWidth: 1, borderColor: c.surfaceBorder, padding: Spacing.base, gap: Spacing.base,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    cardTitle:  { flex: 1, fontSize: Typography.sm, fontWeight: Typography.semibold, color: c.textPrimary },
    aiIconBox:  {
      width: 22, height: 22, borderRadius: 11, backgroundColor: c.primaryDim,
      alignItems: 'center', justifyContent: 'center',
    },
    aiInsightText: { fontSize: Typography.sm, color: c.textPrimary, lineHeight: 20 },
    aiDisclaimer:  { fontSize: Typography.xs, color: c.textTertiary, fontStyle: 'italic' },

    checkInCard: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
      backgroundColor: c.surface, borderRadius: Radius.lg,
      borderWidth: 1, padding: Spacing.base,
    },
    checkInIconBox:  { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    checkInTitle:    { fontSize: Typography.sm, fontWeight: Typography.bold, color: c.textPrimary },
    checkInSub:      { fontSize: Typography.xs, color: c.textTertiary, marginTop: 2 },
    checkInPill:     { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    checkInPillText: { fontSize: 10, fontWeight: Typography.bold, color: c.textInverse },

    missingCard: {
      backgroundColor: c.warning + '12', borderRadius: Radius.lg,
      borderWidth: 1, borderColor: c.warning + '30', padding: Spacing.base,
    },
    missingTitle: { fontSize: Typography.xs, fontWeight: Typography.bold },
    missingItem:  { fontSize: Typography.xs, color: c.textSecondary, marginTop: 4, lineHeight: 16 },

    premiumCard: {
      backgroundColor: '#F59E0B12', borderRadius: Radius.lg,
      borderWidth: 1, borderColor: '#F59E0B30',
      padding: Spacing.base, flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    },
    premiumTitle: { fontSize: Typography.sm, fontWeight: Typography.bold, color: '#F59E0B' },
    premiumSub:   { fontSize: Typography.xs, color: c.textTertiary, marginTop: 2 },

    disclaimer: {
      fontSize: Typography.xs, color: c.textTertiary,
      textAlign: 'center', lineHeight: 16, fontStyle: 'italic',
      paddingHorizontal: Spacing.base,
    },
    loadingState: {
      alignItems: 'center', gap: Spacing.md, paddingTop: W * 0.3,
    },
    loadingText: { fontSize: Typography.base, color: c.textTertiary },
  });
}

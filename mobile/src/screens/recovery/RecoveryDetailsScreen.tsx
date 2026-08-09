import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, I18nManager } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTranslation } from 'react-i18next';

import { useColors, ColorPalette, Spacing, Typography, Radius, TAB_BAR_PADDING } from '@/theme';
import { HealthStackParamList } from '@/navigation/types';
import { recoveryApi } from '@/api/recovery.api';
import {
  RecoveryComponent, RecoveryLevel, RecoveryRecommendation,
  RecoveryScore, RecommendationType,
} from '@/types';

type Route = RouteProp<HealthStackParamList, 'RecoveryDetails'>;

const W = Dimensions.get('window').width;

// ─── Level config ─────────────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<RecoveryLevel, {
  label: string; color: string; icon: string;
  intensity: string; intensityPct: number; bgHint: string;
}> = {
  READY_FOR_HEAVY_TRAINING: {
    label: 'Ready for Heavy Training', color: '#22C55E', icon: 'lightning-bolt',
    intensity: 'Full Intensity', intensityPct: 100, bgHint: 'Train at 100%. Peak readiness.',
  },
  READY_FOR_NORMAL_TRAINING: {
    label: 'Ready for Normal Training', color: '#4ADE80', icon: 'check-circle',
    intensity: 'Normal Load', intensityPct: 80, bgHint: 'Proceed with your planned session.',
  },
  MODERATE_TRAINING_RECOMMENDED: {
    label: 'Moderate Training Recommended', color: '#F59E0B', icon: 'alert-circle',
    intensity: 'Reduce 15%', intensityPct: 60, bgHint: 'Back off volume slightly. Focus on form.',
  },
  LIGHT_ACTIVITY_RECOMMENDED: {
    label: 'Light Activity Recommended', color: '#F97316', icon: 'walk',
    intensity: 'Light Only', intensityPct: 35, bgHint: 'Walk, yoga, or mobility only today.',
  },
  REST_RECOMMENDED: {
    label: 'Rest Recommended Today', color: '#EF4444', icon: 'sleep',
    intensity: 'Rest Day', intensityPct: 0, bgHint: 'Your body needs recovery, not more stress.',
  },
};

const COMPONENTS = [
  { key: 'sleep'              as const, label: 'Sleep',          icon: 'moon-waning-crescent', weight: 0.35, color: '#8B5CF6' },
  { key: 'trainingLoad'       as const, label: 'Training Load',  icon: 'dumbbell',             weight: 0.25, color: null },
  { key: 'heartRecovery'      as const, label: 'Heart Recovery', icon: 'heart-pulse',          weight: 0.20, color: null },
  { key: 'hydration'          as const, label: 'Hydration',      icon: 'water',                weight: 0.10, color: '#06B6D4' },
  { key: 'subjectiveWellness' as const, label: 'Wellness',       icon: 'emoticon-outline',     weight: 0.10, color: null },
];

const REC_CONFIG: Record<RecommendationType, { icon: string; color: string }> = {
  TRAINING:  { icon: 'dumbbell',             color: '#22C55E' },
  SLEEP:     { icon: 'moon-waning-crescent', color: '#8B5CF6' },
  HYDRATION: { icon: 'water',               color: '#06B6D4' },
  NUTRITION: { icon: 'food-apple',          color: '#F59E0B' },
  GENERAL:   { icon: 'lightbulb-outline',   color: '#3B82F6' },
};

function compColor(score: number, status: string, themeColor: string | null, colors: ColorPalette): string {
  if (status === 'UNKNOWN') return colors.textTertiary;
  if (themeColor) return themeColor;
  if (score >= 70) return '#22C55E';
  if (score >= 55) return '#F59E0B';
  return '#EF4444';
}

// ─── Score Ring (large) ───────────────────────────────────────────────────────

function ScoreRing({ score, color, size = 190 }: { score: number; color: string; size?: number }) {
  const { t } = useTranslation();
  const sw    = 18;
  const r     = (size - sw) / 2;
  const cx    = size / 2;
  const c     = 2 * Math.PI * r;
  const off   = c * (1 - Math.min(score, 100) / 100);
  const id    = 'ringGrad';

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity="1" />
            <Stop offset="100%" stopColor={color + 'BB'} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        {/* Track */}
        <Circle cx={cx} cy={cx} r={r} stroke={color + '1A'} strokeWidth={sw} fill="none" />
        {/* Fill */}
        <Circle
          cx={cx} cy={cx} r={r}
          stroke={`url(#${id})`} strokeWidth={sw} fill="none"
          strokeDasharray={c} strokeDashoffset={off}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cx})`}
        />
      </Svg>
      <View style={{ alignItems: 'center', gap: 2 }}>
        <Text style={{ fontSize: 52, fontWeight: Typography.extrabold, color, lineHeight: 56 }}>{score}</Text>
        <Text style={{ fontSize: Typography.sm, color: color + '80', fontWeight: Typography.medium }}>
          {t('recoveryDetails.outOf')}
        </Text>
      </View>
    </View>
  );
}

// ─── 7-day history bar chart ──────────────────────────────────────────────────

function HistoryChart({ history, todayDate, colors }: {
  history: RecoveryScore[]; todayDate: string; colors: ColorPalette;
}) {
  const { t } = useTranslation();
  const last7 = [...history].slice(0, 7).reverse();
  const days  = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  if (last7.length < 2) return null;

  const avg = Math.round(last7.reduce((s, d) => s + d.recoveryScore, 0) / last7.length);

  return (
    <View style={{ gap: Spacing.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: Typography.xs, fontWeight: Typography.bold, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
          {t('recoveryDetails.trend7Day')}
        </Text>
        <Text style={{ fontSize: Typography.xs, color: colors.textTertiary }}>{t('recoveryDetails.trendAvg', { n: avg })}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 5, height: 56 }}>
        {last7.map((s, i) => {
          const pct    = s.recoveryScore / 100;
          const barH   = Math.max(pct * 46, 4);
          const color  = s.recoveryScore >= 70 ? '#22C55E' : s.recoveryScore >= 55 ? '#F59E0B' : '#EF4444';
          const isToday = s.date === todayDate;
          const dow    = new Date(s.date + 'T12:00:00').getDay();
          return (
            <View key={i} style={{ flex: 1, alignItems: 'center', gap: 3 }}>
              {isToday && (
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color, marginBottom: 1 }} />
              )}
              <View style={{ flex: 1, justifyContent: 'flex-end', width: '100%' }}>
                <View style={{
                  width: '100%', height: barH, borderRadius: 5,
                  backgroundColor: isToday ? color : color + '50',
                  borderWidth: isToday ? 1.5 : 0,
                  borderColor: isToday ? color : 'transparent',
                }} />
              </View>
              <Text style={{ fontSize: 9, color: isToday ? color : colors.textTertiary, fontWeight: isToday ? Typography.bold : 'normal' }}>
                {isToday ? t('recoveryDetails.today') : days[dow]}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Component card ───────────────────────────────────────────────────────────

function ComponentCard({ comp, meta, colors }: {
  comp: RecoveryComponent;
  meta: typeof COMPONENTS[0];
  colors: ColorPalette;
}) {
  const { t } = useTranslation();
  const getCompLabel = (key: string) => ({
    sleep: t('recoveryDetails.compSleep'), trainingLoad: t('recoveryDetails.compTraining'),
    heartRecovery: t('recoveryDetails.compHeart'), hydration: t('recoveryDetails.compHydration'),
    subjectiveWellness: t('recoveryDetails.compWellness'),
  }[key] ?? key);
  const col         = compColor(comp.score, comp.status, meta.color, colors);
  const pct         = Math.min(comp.score, 100);
  const isUnknown   = comp.status === 'UNKNOWN';
  const contribution = parseFloat((comp.score * meta.weight).toFixed(1));

  return (
    <View style={[ccStyles.card, { backgroundColor: colors.surface, borderColor: col + '30' }]}>
      {/* Header */}
      <View style={ccStyles.header}>
        <View style={[ccStyles.iconBox, { backgroundColor: col + '18' }]}>
          <Icon name={meta.icon} size={17} color={col} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[ccStyles.label, { color: colors.textPrimary }]}>{getCompLabel(meta.key)}</Text>
          <Text style={[ccStyles.weight, { color: colors.textTertiary }]}>
            {(meta.weight * 100).toFixed(0)}% {t('recoveryDetails.ofTotal')}
          </Text>
        </View>
        <View style={[ccStyles.scoreBubble, { backgroundColor: col + '18' }]}>
          <Text style={[ccStyles.scoreNum, { color: col }]}>
            {isUnknown ? '—' : comp.score}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={[ccStyles.track, { backgroundColor: colors.surfaceElevated }]}>
        {!isUnknown && (
          <View style={[ccStyles.fill, {
            width: `${pct}%`,
            backgroundColor: col,
          }]} />
        )}
        {isUnknown && (
          <View style={{ flexDirection: 'row', gap: 3, flex: 1, overflow: 'hidden', borderRadius: 4 }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <View key={i} style={{ flex: 1, height: '100%', backgroundColor: colors.textTertiary + '30', borderRadius: 1 }} />
            ))}
          </View>
        )}
      </View>

      {/* Contribution & explanation */}
      <View style={ccStyles.bodyRow}>
        <View style={[ccStyles.contribBadge, { backgroundColor: colors.surfaceElevated }]}>
          <Text style={[ccStyles.contribText, { color: isUnknown ? colors.textTertiary : col }]}>
            {isUnknown ? `— ${t('recoveryDetails.pts')}` : `+${contribution} ${t('recoveryDetails.pts')}`}
          </Text>
          <Text style={[ccStyles.contribSub, { color: colors.textTertiary }]}>{t('recoveryDetails.toTotal')}</Text>
        </View>
        <Text style={[ccStyles.explanation, { color: colors.textSecondary }]}>
          {comp.explanation}
        </Text>
      </View>

      {/* Low confidence warning */}
      {comp.confidence < 0.6 && (
        <View style={[ccStyles.lowConf, { backgroundColor: colors.warning + '12', borderColor: colors.warning + '30' }]}>
          <Icon name="alert-circle-outline" size={12} color={colors.warning} />
          <Text style={[ccStyles.lowConfText, { color: colors.warning }]}>
            {Math.round(comp.confidence * 100)}{t('recoveryDetails.confidenceLimited')}
          </Text>
        </View>
      )}

      {/* Connect health CTA for heart rate */}
      {meta.key === 'heartRecovery' && isUnknown && (
        <View style={[ccStyles.connectCta, { backgroundColor: colors.surfaceElevated, borderColor: colors.surfaceBorder }]}>
          <Icon name="heart-flash" size={14} color="#EF4444" />
          <Text style={[ccStyles.connectText, { color: colors.textSecondary }]}>
            {t('recoveryDetails.connectHealth')}
          </Text>
        </View>
      )}
    </View>
  );
}

const ccStyles = StyleSheet.create({
  card:        { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.base, gap: Spacing.sm },
  header:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  iconBox:     { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  label:       { fontSize: Typography.sm, fontWeight: Typography.semibold },
  weight:      { fontSize: Typography.xs, marginTop: 1 },
  scoreBubble: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  scoreNum:    { fontSize: Typography.xl, fontWeight: Typography.extrabold },
  track:       { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill:        { height: 8, borderRadius: 4 },
  bodyRow:     { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  contribBadge:{ borderRadius: Radius.md, paddingHorizontal: Spacing.sm, paddingVertical: 6, alignItems: 'center', minWidth: 56, flexShrink: 0 },
  contribText: { fontSize: Typography.sm, fontWeight: Typography.extrabold },
  contribSub:  { fontSize: 9 },
  explanation: { flex: 1, fontSize: Typography.sm, lineHeight: 20, paddingTop: 2 },
  lowConf:     { flexDirection: 'row', alignItems: 'center', gap: 5, padding: Spacing.sm, borderRadius: Radius.sm, borderWidth: 1 },
  lowConfText: { fontSize: Typography.xs, fontWeight: Typography.medium, flex: 1 },
  connectCta:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.sm, borderRadius: Radius.sm, borderWidth: 1 },
  connectText: { fontSize: Typography.xs, flex: 1, lineHeight: 16 },
});

// ─── Training zone card ───────────────────────────────────────────────────────

function TrainingZoneCard({ level, score, colors }: {
  level: RecoveryLevel; score: number; colors: ColorPalette;
}) {
  const { t } = useTranslation();
  const cfg = LEVEL_CONFIG[level];

  const getLevelLabel = (key: RecoveryLevel): string => ({
    READY_FOR_HEAVY_TRAINING:      t('recoveryDashboard.levelHeavy'),
    READY_FOR_NORMAL_TRAINING:     t('recoveryDashboard.levelNormal'),
    MODERATE_TRAINING_RECOMMENDED: t('recoveryDashboard.levelModerate'),
    LIGHT_ACTIVITY_RECOMMENDED:    t('recoveryDashboard.levelLight'),
    REST_RECOMMENDED:              t('recoveryDashboard.levelRest'),
  }[key] ?? key);

  const getLevelIntensity = (key: RecoveryLevel): string => ({
    READY_FOR_HEAVY_TRAINING:      t('recoveryDetails.intensityFull'),
    READY_FOR_NORMAL_TRAINING:     t('recoveryDetails.intensityNormal'),
    MODERATE_TRAINING_RECOMMENDED: t('recoveryDetails.intensityReduce'),
    LIGHT_ACTIVITY_RECOMMENDED:    t('recoveryDetails.intensityLight'),
    REST_RECOMMENDED:              t('recoveryDetails.intensityRest'),
  }[key] ?? cfg.intensity);

  const getLevelHint = (key: RecoveryLevel): string => ({
    READY_FOR_HEAVY_TRAINING:      t('recoveryDetails.hintHeavy'),
    READY_FOR_NORMAL_TRAINING:     t('recoveryDetails.hintNormal'),
    MODERATE_TRAINING_RECOMMENDED: t('recoveryDetails.hintModerate'),
    LIGHT_ACTIVITY_RECOMMENDED:    t('recoveryDetails.hintLight'),
    REST_RECOMMENDED:              t('recoveryDetails.hintRest'),
  }[key] ?? cfg.bgHint);

  const ZONES = [
    { label: t('recoveryDetails.zoneRest'),     min: 0,  max: 39,  color: '#EF4444' },
    { label: t('recoveryDetails.zoneLight'),    min: 40, max: 54,  color: '#F97316' },
    { label: t('recoveryDetails.zoneModerate'), min: 55, max: 69,  color: '#F59E0B' },
    { label: t('recoveryDetails.zoneNormal'),   min: 70, max: 84,  color: '#4ADE80' },
    { label: t('recoveryDetails.zoneHeavy'),    min: 85, max: 100, color: '#22C55E' },
  ];

  return (
    <View style={[tzStyles.card, { backgroundColor: colors.surface, borderColor: cfg.color + '35' }]}>
      <View style={tzStyles.header}>
        <View style={[tzStyles.iconBox, { backgroundColor: cfg.color + '18' }]}>
          <Icon name={cfg.icon} size={18} color={cfg.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[tzStyles.title, { color: cfg.color }]}>{t('recoveryDetails.trainingReadiness')}</Text>
          <Text style={[tzStyles.label, { color: colors.textPrimary }]}>{getLevelIntensity(level)}</Text>
        </View>
        <View style={[tzStyles.pctBadge, { backgroundColor: cfg.color + '18' }]}>
          <Text style={[tzStyles.pctNum, { color: cfg.color }]}>{cfg.intensityPct}%</Text>
          <Text style={[tzStyles.pctSub, { color: cfg.color + '80' }]}>{t('recoveryDetails.capacity')}</Text>
        </View>
      </View>

      {/* Zone bar */}
      <View style={{ gap: 5 }}>
        <View style={tzStyles.zoneBar}>
          {ZONES.map((z, i) => {
            const isActive = score >= z.min && score <= z.max;
            return (
              <View key={i} style={[tzStyles.zoneSegment, { backgroundColor: z.color + (isActive ? 'FF' : '30') }]}>
                {isActive && (
                  <View style={tzStyles.zonePointer}>
                    <Icon name="menu-down" size={16} color={z.color} />
                  </View>
                )}
              </View>
            );
          })}
        </View>
        <View style={tzStyles.zoneLabels}>
          {ZONES.map(z => (
            <Text key={z.label} style={[tzStyles.zoneLabel, { color: colors.textTertiary, flex: 1, textAlign: 'center' }]}>
              {z.label}
            </Text>
          ))}
        </View>
      </View>

      <Text style={[tzStyles.hint, { color: colors.textSecondary }]}>{getLevelHint(level)}</Text>
    </View>
  );
}

const tzStyles = StyleSheet.create({
  card:          { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.base, gap: Spacing.md },
  header:        { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  iconBox:       { width: 42, height: 42, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  title:         { fontSize: Typography.xs, fontWeight: Typography.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  label:         { fontSize: Typography.base, fontWeight: Typography.bold, marginTop: 2 },
  pctBadge:      { borderRadius: Radius.md, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center' },
  pctNum:        { fontSize: Typography.xl, fontWeight: Typography.extrabold },
  pctSub:        { fontSize: Typography.xs },
  zoneBar:       { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', gap: 2 },
  zoneSegment:   { flex: 1, borderRadius: 3, alignItems: 'center' },
  zonePointer:   { position: 'absolute', top: -16, alignSelf: 'center' },
  zoneLabels:    { flexDirection: 'row' },
  zoneLabel:     { fontSize: 9 },
  hint:          { fontSize: Typography.sm, lineHeight: 20 },
});

// ─── Recommendation card ──────────────────────────────────────────────────────

function RecommendationCard({ rec, index, colors }: {
  rec: RecoveryRecommendation; index: number; colors: ColorPalette;
}) {
  const cfg = REC_CONFIG[rec.type as RecommendationType] ?? REC_CONFIG.GENERAL;

  return (
    <View style={[recStyles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, borderLeftColor: cfg.color, borderLeftWidth: 3 }]}>
      <View style={recStyles.row}>
        <View style={[recStyles.iconBox, { backgroundColor: cfg.color + '18' }]}>
          <Icon name={cfg.icon} size={16} color={cfg.color} />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[recStyles.title, { color: colors.textPrimary }]}>{rec.title}</Text>
            <View style={[recStyles.priorityBadge, { backgroundColor: colors.surfaceElevated }]}>
              <Text style={[recStyles.priorityText, { color: colors.textTertiary }]}>#{index + 1}</Text>
            </View>
          </View>
          <Text style={[recStyles.desc, { color: colors.textSecondary }]}>{rec.description}</Text>
        </View>
      </View>
    </View>
  );
}

const recStyles = StyleSheet.create({
  card:          { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.base, overflow: 'hidden' },
  row:           { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  iconBox:       { width: 36, height: 36, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:         { fontSize: Typography.sm, fontWeight: Typography.bold, flex: 1 },
  desc:          { fontSize: Typography.xs, lineHeight: 17 },
  priorityBadge: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  priorityText:  { fontSize: 10 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function RecoveryDetailsScreen() {
  const navigation  = useNavigation<any>();
  const route       = useRoute<Route>();
  const insets      = useSafeAreaInsets();
  const colors      = useColors();
  const styles      = useMemo(() => getStyles(colors), [colors]);
  const qc          = useQueryClient();
  const { t } = useTranslation();

  const getLevelLabel = (key: RecoveryLevel): string => ({
    READY_FOR_HEAVY_TRAINING:      t('recoveryDashboard.levelHeavy'),
    READY_FOR_NORMAL_TRAINING:     t('recoveryDashboard.levelNormal'),
    MODERATE_TRAINING_RECOMMENDED: t('recoveryDashboard.levelModerate'),
    LIGHT_ACTIVITY_RECOMMENDED:    t('recoveryDashboard.levelLight'),
    REST_RECOMMENDED:              t('recoveryDashboard.levelRest'),
  }[key] ?? key);

  const { data: score, isLoading } = useQuery<RecoveryScore>({
    queryKey: ['recovery-score', route.params.date],
    queryFn:  () => recoveryApi.getByDate(route.params.date),
  });

  const { data: history = [] } = useQuery<RecoveryScore[]>({
    queryKey: ['recovery-history'],
    queryFn:  () => recoveryApi.getHistory(0, 7),
  });

  const recalcMut = useMutation({
    mutationFn: recoveryApi.recalculate,
    onSuccess: (data) => {
      qc.setQueryData(['recovery-today'], data);
      qc.setQueryData(['recovery-score', route.params.date], data);
    },
  });

  const isToday = route.params.date === new Date().toISOString().split('T')[0];
  const level   = score ? LEVEL_CONFIG[score.recoveryLevel as RecoveryLevel] : null;
  const col     = level?.color ?? colors.primary;

  const formattedDate = (() => {
    if (!score) return route.params.date;
    const d = new Date(score.date + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  })();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* ── Sticky header ───────────────────────────────────────────────────── */}
      <View style={[styles.header, { borderBottomColor: colors.surfaceBorder }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name={I18nManager.isRTL ? "arrow-right" : "arrow-left"} size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('recoveryDetails.title')}</Text>
          <Text style={[styles.headerSub, { color: colors.textTertiary }]}>{formattedDate}</Text>
        </View>
        {isToday && (
          <TouchableOpacity
            style={[styles.recalcBtn, { backgroundColor: colors.primaryDim }]}
            onPress={() => recalcMut.mutate()}
            disabled={recalcMut.isPending}
          >
            <Icon name="refresh" size={14} color={colors.primary} style={recalcMut.isPending ? { opacity: 0.5 } : undefined} />
            <Text style={[styles.recalcText, { color: colors.primary }]}>
              {recalcMut.isPending ? t('recoveryDetails.updating') : t('recoveryDetails.recalculate')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: TAB_BAR_PADDING }]}
        showsVerticalScrollIndicator={false}
      >
        {score ? (
          <>
            {/* ── Hero ring card ──────────────────────────────────────────────── */}
            <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: col + '40' }]}>
              <ScoreRing score={score.recoveryScore} color={col} size={190} />

              {/* Level badge */}
              <View style={[styles.levelBadge, { backgroundColor: col + '18' }]}>
                <Icon name={level!.icon} size={14} color={col} />
                <Text style={[styles.levelText, { color: col }]}>{getLevelLabel(score.recoveryLevel as RecoveryLevel)}</Text>
              </View>

              {/* Confidence row */}
              <View style={styles.confRow}>
                <View style={[styles.confPill, { backgroundColor: colors.surfaceElevated }]}>
                  <Icon name="shield-check-outline" size={11} color={colors.textTertiary} />
                  <Text style={[styles.confText, { color: colors.textTertiary }]}>
                    {Math.round(score.confidence * 100)}{t('recoveryDashboard.confidence')}
                  </Text>
                </View>
                {score.missingData.length > 0 && (
                  <View style={[styles.confPill, { backgroundColor: colors.warning + '15' }]}>
                    <Icon name="alert-circle-outline" size={11} color={colors.warning} />
                    <Text style={[styles.confText, { color: colors.warning }]}>
                      {t('recoveryDetails.missingDataSources', { n: score.missingData.length, s: score.missingData.length > 1 ? 's' : '' })}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* ── 7-day trend ─────────────────────────────────────────────────── */}
            {history.length > 1 && (
              <View style={[styles.card]}>
                <HistoryChart history={history} todayDate={score.date} colors={colors} />
              </View>
            )}

            {/* ── Training zone ────────────────────────────────────────────────── */}
            <TrainingZoneCard level={score.recoveryLevel as RecoveryLevel} score={score.recoveryScore} colors={colors} />

            {/* ── Component breakdown ──────────────────────────────────────────── */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('recoveryDetails.scoreBreakdown')}</Text>
              <Text style={[styles.sectionHint, { color: colors.textTertiary }]}>
                {score.recoveryScore} = {COMPONENTS.map(m => {
                  const c = score.components[m.key];
                  return c.status === 'UNKNOWN' ? '—' : (c.score * m.weight).toFixed(0);
                }).join(' + ')}
              </Text>
            </View>
            {COMPONENTS.map(meta => (
              <ComponentCard
                key={meta.key}
                comp={score.components[meta.key]}
                meta={meta}
                colors={colors}
              />
            ))}

            {/* ── Recommendations ──────────────────────────────────────────────── */}
            {score.recommendations.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: Spacing.xs }]}>
                  {t('recoveryDetails.recommendations')}
                </Text>
                {score.recommendations.map((r: RecoveryRecommendation, i: number) => (
                  <RecommendationCard key={r.id} rec={r} index={i} colors={colors} />
                ))}
              </>
            )}

            {/* ── Missing data ──────────────────────────────────────────────────── */}
            {score.missingData.length > 0 && (
              <View style={[styles.missingCard, { backgroundColor: colors.warning + '0D', borderColor: colors.warning + '30' }]}>
                <View style={styles.missingHeader}>
                  <Icon name="information-outline" size={14} color={colors.warning} />
                  <Text style={[styles.missingTitle, { color: colors.warning }]}>{t('recoveryDetails.improveAccuracy')}</Text>
                </View>
                {score.missingData.map((m: string, i: number) => (
                  <Text key={i} style={[styles.missingItem, { color: colors.textSecondary }]}>· {m}</Text>
                ))}
              </View>
            )}

            {/* ── Disclaimer ───────────────────────────────────────────────────── */}
            <Text style={[styles.disclaimer, { color: colors.textTertiary }]}>{score.disclaimer}</Text>
          </>
        ) : (
          <View style={styles.empty}>
            <Icon name="heart-pulse" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              {isLoading ? t('recoveryDetails.loading') : t('recoveryDetails.noScore')}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function getStyles(c: ColorPalette) {
  return StyleSheet.create({
    root:   { flex: 1, backgroundColor: c.background },
    scroll: { padding: Spacing.base, gap: Spacing.md },

    header: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
      paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
    },
    backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: c.surfaceElevated },
    headerTitle: { fontSize: Typography.lg, fontWeight: Typography.bold },
    headerSub:   { fontSize: Typography.xs, marginTop: 1 },
    recalcBtn:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 6, borderRadius: Radius.full },
    recalcText:  { fontSize: Typography.xs, fontWeight: Typography.semibold },

    heroCard: {
      borderRadius: Radius.xl, borderWidth: 1,
      padding: Spacing.xl, alignItems: 'center', gap: Spacing.md,
    },
    levelBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: Spacing.md, paddingVertical: 7,
      borderRadius: Radius.full,
    },
    levelText: { fontSize: Typography.sm, fontWeight: Typography.bold },
    confRow:   { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', justifyContent: 'center' },
    confPill:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full },
    confText:  { fontSize: Typography.xs },

    card: {
      backgroundColor: c.surface, borderRadius: Radius.lg,
      borderWidth: 1, borderColor: c.surfaceBorder, padding: Spacing.base,
    },

    sectionHeader: { gap: 2 },
    sectionTitle:  { fontSize: Typography.base, fontWeight: Typography.bold },
    sectionHint:   { fontSize: Typography.xs },

    missingCard: { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.base, gap: Spacing.sm },
    missingHeader: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    missingTitle:  { fontSize: Typography.xs, fontWeight: Typography.bold, flex: 1 },
    missingItem:   { fontSize: Typography.xs, lineHeight: 16 },

    disclaimer: {
      fontSize: Typography.xs, textAlign: 'center',
      lineHeight: 16, fontStyle: 'italic', paddingHorizontal: Spacing.base,
    },
    empty:     { paddingTop: W * 0.3, alignItems: 'center', gap: Spacing.md },
    emptyText: { fontSize: Typography.sm },
  });
}

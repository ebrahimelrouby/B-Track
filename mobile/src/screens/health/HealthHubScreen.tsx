import React, { useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTranslation } from 'react-i18next';

import { useColors, ColorPalette, Spacing, Typography, Radius, TAB_BAR_PADDING } from '@/theme';
import { HealthNavigationProp } from '@/navigation/types';
import { recoveryApi } from '@/api/recovery.api';
import { healthApi } from '@/api/health.api';
import { nutritionApi } from '@/api/nutrition.api';
import { userApi } from '@/api/user.api';
import { useAuthStore } from '@/store/auth.store';
import { RecoveryLevel, RecoveryScore, DailySleep, DailySteps, SleepQuality } from '@/types';
import PremiumTag from '@/components/common/PremiumTag';

const W = Dimensions.get('window').width;

// ─── Palettes ─────────────────────────────────────────────────────────────────

const SLEEP_COLOR  = '#8B5CF6';
const STEPS_COLOR  = '#3B82F6';
const WATER_COLOR  = '#06B6D4';

const LEVEL_CONFIG: Record<RecoveryLevel, { label: string; color: string; icon: string }> = {
  READY_FOR_HEAVY_TRAINING:      { label: 'Ready for Heavy Training',      color: '#22C55E', icon: 'lightning-bolt' },
  READY_FOR_NORMAL_TRAINING:     { label: 'Ready for Normal Training',     color: '#4ADE80', icon: 'check-circle' },
  MODERATE_TRAINING_RECOMMENDED: { label: 'Moderate Training Recommended', color: '#F59E0B', icon: 'alert-circle' },
  LIGHT_ACTIVITY_RECOMMENDED:    { label: 'Light Activity Recommended',    color: '#F97316', icon: 'walk' },
  REST_RECOMMENDED:              { label: 'Rest Recommended Today',        color: '#EF4444', icon: 'sleep' },
};

const SLEEP_QUALITY_CONFIG: Record<SleepQuality, { label: string; color: string }> = {
  EXCELLENT: { label: 'Excellent', color: '#22C55E' },
  GOOD:      { label: 'Good',      color: '#4ADE80' },
  FAIR:      { label: 'Fair',      color: '#F59E0B' },
  POOR:      { label: 'Poor',      color: '#EF4444' },
};

// ─── Compact ring ─────────────────────────────────────────────────────────────

function VitalRing({
  value, max, color, size = 72, strokeWidth = 7, children,
}: {
  value: number; max: number; color: string; size?: number;
  strokeWidth?: number; children: React.ReactNode;
}) {
  const r   = (size - strokeWidth) / 2;
  const cx  = size / 2;
  const c   = 2 * Math.PI * r;
  const off = c * (1 - Math.min(value / max, 1));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={cx} cy={cx} r={r} stroke={color + '25'} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={cx} cy={cx} r={r}
          stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={c} strokeDashoffset={off}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cx})`}
        />
      </Svg>
      {children}
    </View>
  );
}

// ─── Vitals strip card ────────────────────────────────────────────────────────

function VitalCard({
  label, icon, color, value, sub, onPress,
  ringValue, ringMax,
  colors,
}: {
  label: string; icon: string; color: string;
  value: string; sub: string;
  onPress: () => void;
  ringValue: number; ringMax: number;
  colors: ColorPalette;
}) {
  return (
    <TouchableOpacity
      style={[vcStyles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <VitalRing value={ringValue} max={ringMax} color={color} size={68} strokeWidth={6}>
        <Icon name={icon} size={22} color={color} />
      </VitalRing>
      <Text style={[vcStyles.value, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[vcStyles.sub, { color: colors.textTertiary }]}>{sub}</Text>
      <Text style={[vcStyles.label, { color: color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const vcStyles = StyleSheet.create({
  card:  {
    flex: 1, borderRadius: Radius.lg, borderWidth: 1,
    padding: Spacing.sm, alignItems: 'center', gap: 4,
  },
  value: { fontSize: Typography.base, fontWeight: Typography.bold, lineHeight: 20 },
  sub:   { fontSize: 9, lineHeight: 12 },
  label: { fontSize: 9, fontWeight: Typography.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
});

// ─── Recovery summary card ────────────────────────────────────────────────────

const COMP_META = [
  { key: 'sleep'              as const, icon: 'moon-waning-crescent', label: 'Sleep',    short: 'SLP' },
  { key: 'trainingLoad'       as const, icon: 'dumbbell',             label: 'Training', short: 'TRN' },
  { key: 'heartRecovery'      as const, icon: 'heart-pulse',          label: 'Heart',    short: 'HRT' },
  { key: 'hydration'          as const, icon: 'water',                label: 'Water',    short: 'H₂O' },
  { key: 'subjectiveWellness' as const, icon: 'emoticon-outline',     label: 'Wellness', short: 'WEL' },
];

function MiniRing({ score, color, size = 64, sw = 6 }: { score: number; color: string; size?: number; sw?: number }) {
  const r   = (size - sw) / 2;
  const cx  = size / 2;
  const c   = 2 * Math.PI * r;
  const off = c * (1 - Math.min(score, 100) / 100);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={cx} cy={cx} r={r} stroke={color + '22'} strokeWidth={sw} fill="none" />
        <Circle cx={cx} cy={cx} r={r} stroke={color} strokeWidth={sw} fill="none"
          strokeDasharray={c} strokeDashoffset={off}
          strokeLinecap="round" transform={`rotate(-90 ${cx} ${cx})`} />
      </Svg>
      <Text style={{ fontSize: 16, fontWeight: Typography.extrabold, color, lineHeight: 18 }}>{score}</Text>
    </View>
  );
}

function RecoveryCard({
  score, history, onPress, colors,
}: { score: RecoveryScore; history: RecoveryScore[]; onPress: () => void; colors: ColorPalette }) {
  const { t } = useTranslation();
  const level = LEVEL_CONFIG[score.recoveryLevel as RecoveryLevel];
  const col   = level?.color ?? colors.primary;

  const getLevelLabel = (key: RecoveryLevel): string => ({
    READY_FOR_HEAVY_TRAINING:      t('recoveryDashboard.levelHeavy'),
    READY_FOR_NORMAL_TRAINING:     t('recoveryDashboard.levelNormal'),
    MODERATE_TRAINING_RECOMMENDED: t('recoveryDashboard.levelModerate'),
    LIGHT_ACTIVITY_RECOMMENDED:    t('recoveryDashboard.levelLight'),
    REST_RECOMMENDED:              t('recoveryDashboard.levelRest'),
  }[key] ?? key);

  // last 7 days for sparkline
  const spark = history.slice(0, 7).reverse();

  return (
    <TouchableOpacity
      style={[rcStyles.card, { backgroundColor: colors.surface, borderColor: col + '40' }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Top row: ring + info + sparkline */}
      <View style={rcStyles.topRow}>
        <MiniRing score={score.recoveryScore} color={col} size={68} sw={7} />

        <View style={{ flex: 1, gap: 3 }}>
          <Text style={[rcStyles.sectionLabel, { color: colors.textTertiary }]}>{t('healthHub.recoveryScore')}</Text>
          <View style={[rcStyles.levelBadge, { backgroundColor: col + '18' }]}>
            <Icon name={level?.icon ?? 'heart-pulse'} size={11} color={col} />
            <Text style={[rcStyles.levelText, { color: col }]} numberOfLines={1}>
              {getLevelLabel(score.recoveryLevel as RecoveryLevel)}
            </Text>
          </View>
          <Text style={[rcStyles.confidence, { color: colors.textTertiary }]}>
            {t('healthHub.confidence', { n: Math.round(score.confidence * 100) })}
          </Text>
        </View>

        {/* 7-day sparkline */}
        {spark.length > 1 && (
          <View style={rcStyles.spark}>
            {spark.map((s, i) => {
              const h   = Math.max((s.recoveryScore / 100) * 32, 3);
              const sc  = s.recoveryScore >= 70 ? '#22C55E' : s.recoveryScore >= 55 ? '#F59E0B' : '#EF4444';
              const isToday = i === spark.length - 1;
              return (
                <View key={i} style={rcStyles.sparkColWrap}>
                  <View style={[rcStyles.sparkBar, { height: h, backgroundColor: isToday ? col : sc + '80' }]} />
                </View>
              );
            })}
          </View>
        )}

        <Icon name="chevron-right" size={16} color={colors.textTertiary} />
      </View>

      {/* Component pills */}
      <View style={rcStyles.pillsRow}>
        {COMP_META.map(m => {
          const comp = score.components[m.key];
          const c2   = comp.status === 'UNKNOWN'
            ? colors.textTertiary
            : comp.score >= 70 ? '#22C55E' : comp.score >= 55 ? '#F59E0B' : '#EF4444';
          return (
            <View key={m.key} style={[rcStyles.pill, { backgroundColor: c2 + '15', borderColor: c2 + '35' }]}>
              <Icon name={m.icon} size={10} color={c2} />
              <Text style={[rcStyles.pillScore, { color: c2 }]}>
                {comp.status === 'UNKNOWN' ? '—' : comp.score}
              </Text>
            </View>
          );
        })}
      </View>
    </TouchableOpacity>
  );
}

const rcStyles = StyleSheet.create({
  card:         { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.base, gap: Spacing.md },
  topRow:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionLabel: { fontSize: Typography.xs },
  levelBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 3, borderRadius: Radius.full },
  levelText:    { fontSize: 11, fontWeight: Typography.bold, flexShrink: 1 },
  confidence:   { fontSize: Typography.xs },
  spark:        { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 36, width: 56 },
  sparkColWrap: { flex: 1, justifyContent: 'flex-end', height: '100%' },
  sparkBar:     { width: '100%', borderRadius: 2 },
  pillsRow:     { flexDirection: 'row', gap: 5 },
  pill:         { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 5, borderRadius: Radius.full, borderWidth: 1 },
  pillScore:    { fontSize: 10, fontWeight: Typography.bold },
});

// ─── Sleep card ───────────────────────────────────────────────────────────────

function SleepCard({
  sleep, onPress, onLog, colors,
}: { sleep: DailySleep; onPress: () => void; onLog: () => void; colors: ColorPalette }) {
  const { t } = useTranslation();
  const hasData  = sleep.totalMinutes > 0;
  const hours    = Math.floor(sleep.totalMinutes / 60);
  const mins     = sleep.totalMinutes % 60;
  const pct      = Math.min(sleep.totalMinutes / sleep.targetMinutes, 1);
  const qCfg     = sleep.quality ? SLEEP_QUALITY_CONFIG[sleep.quality] : null;

  // Bedtime/wake display
  let bedStr = '—', wakeStr = '—';
  if (sleep.logs[0]) {
    const bed  = new Date(sleep.logs[0].bedtime);
    const wake = new Date(sleep.logs[0].wakeTime);
    bedStr  = bed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    wakeStr = wake.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  return (
    <TouchableOpacity
      style={[scStyles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={scStyles.header}>
        <View style={[scStyles.iconBox, { backgroundColor: SLEEP_COLOR + '20' }]}>
          <Icon name="moon-waning-crescent" size={17} color={SLEEP_COLOR} />
        </View>
        <Text style={[scStyles.title, { color: colors.textPrimary }]}>{t('healthHub.sleepLabel')}</Text>
        {qCfg && (
          <View style={[scStyles.qualityBadge, { backgroundColor: qCfg.color + '20' }]}>
            <Text style={[scStyles.qualityText, { color: qCfg.color }]}>{qCfg.label}</Text>
          </View>
        )}
        <View style={{ flex: 1 }} />
        {!hasData && (
          <TouchableOpacity
            style={[scStyles.logBtn, { backgroundColor: SLEEP_COLOR + '20' }]}
            onPress={onLog}
          >
            <Icon name="plus" size={13} color={SLEEP_COLOR} />
            <Text style={[scStyles.logBtnText, { color: SLEEP_COLOR }]}>{t('healthHub.logBtn')}</Text>
          </TouchableOpacity>
        )}
        <Icon name="chevron-right" size={16} color={colors.textTertiary} />
      </View>

      {hasData ? (
        <>
          <View style={scStyles.durationRow}>
            <Text style={[scStyles.durationNum, { color: SLEEP_COLOR }]}>
              {hours}<Text style={scStyles.durationUnit}>h</Text>{' '}
              {mins}<Text style={scStyles.durationUnit}>m</Text>
            </Text>
            <Text style={[scStyles.durationTarget, { color: colors.textTertiary }]}>
              / {Math.floor(sleep.targetMinutes / 60)}{t('healthHub.sleepHourTarget')}
            </Text>
            <View style={{ flex: 1 }} />
            <Text style={[scStyles.timeRange, { color: colors.textSecondary }]}>
              {bedStr} → {wakeStr}
            </Text>
          </View>
          <View style={[scStyles.track, { backgroundColor: colors.surfaceElevated }]}>
            <View style={[scStyles.fill, { width: `${pct * 100}%`, backgroundColor: SLEEP_COLOR }]} />
          </View>
          {/* Sleep phases visual bar */}
          <View style={scStyles.phasesRow}>
            <View style={[scStyles.phase, { flex: 2, backgroundColor: '#4C1D95' + '60' }]} />
            <View style={[scStyles.phase, { flex: 3, backgroundColor: SLEEP_COLOR + '70' }]} />
            <View style={[scStyles.phase, { flex: 2, backgroundColor: '#C4B5FD' + '80' }]} />
            <View style={[scStyles.phase, { flex: 1, backgroundColor: SLEEP_COLOR + '40' }]} />
          </View>
          <View style={scStyles.phaseLabelRow}>
            <Text style={[scStyles.phaseLabel, { color: colors.textTertiary }]}>{t('healthHub.sleepDeep')}</Text>
            <Text style={[scStyles.phaseLabel, { color: colors.textTertiary }]}>{t('healthHub.sleepCore')}</Text>
            <Text style={[scStyles.phaseLabel, { color: colors.textTertiary }]}>{t('healthHub.sleepRem')}</Text>
            <Text style={[scStyles.phaseLabel, { color: colors.textTertiary }]}>{t('healthHub.sleepLight')}</Text>
          </View>
        </>
      ) : (
        <TouchableOpacity
          style={[scStyles.emptyState, { backgroundColor: SLEEP_COLOR + '10', borderColor: SLEEP_COLOR + '30' }]}
          onPress={onLog}
        >
          <Icon name="plus-circle-outline" size={20} color={SLEEP_COLOR} />
          <Text style={[scStyles.emptyText, { color: SLEEP_COLOR }]}>{t('healthHub.sleepCardDesc')}</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const scStyles = StyleSheet.create({
  card:          { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.base, gap: Spacing.sm },
  header:        { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconBox:       { width: 32, height: 32, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  title:         { fontSize: Typography.sm, fontWeight: Typography.semibold },
  qualityBadge:  { paddingHorizontal: 7, paddingVertical: 3, borderRadius: Radius.full },
  qualityText:   { fontSize: 10, fontWeight: Typography.bold },
  logBtn:        { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full },
  logBtnText:    { fontSize: Typography.xs, fontWeight: Typography.semibold },
  durationRow:   { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  durationNum:   { fontSize: 28, fontWeight: Typography.bold, lineHeight: 32 },
  durationUnit:  { fontSize: Typography.sm, fontWeight: Typography.medium },
  durationTarget:{ fontSize: Typography.xs },
  timeRange:     { fontSize: Typography.xs },
  track:         { height: 5, borderRadius: 3, overflow: 'hidden' },
  fill:          { height: 5, borderRadius: 3 },
  phasesRow:     { flexDirection: 'row', gap: 2, height: 12, borderRadius: 6, overflow: 'hidden' },
  phase:         { borderRadius: 3 },
  phaseLabelRow: { flexDirection: 'row', justifyContent: 'space-around' },
  phaseLabel:    { fontSize: 9 },
  emptyState:    { borderWidth: 1, borderStyle: 'dashed', borderRadius: Radius.md, padding: Spacing.base, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  emptyText:     { fontSize: Typography.sm, fontWeight: Typography.medium },
});

// ─── Steps card ───────────────────────────────────────────────────────────────

function StepsCard({
  steps, onPress, colors,
}: { steps: DailySteps; onPress: () => void; colors: ColorPalette }) {
  const { t } = useTranslation();
  const pct    = Math.min(steps.steps / steps.targetSteps, 1);
  const isDone = steps.steps >= steps.targetSteps;
  const color  = isDone ? '#22C55E' : STEPS_COLOR;
  const remaining = Math.max(steps.targetSteps - steps.steps, 0);

  return (
    <TouchableOpacity
      style={[stStyles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={stStyles.header}>
        <View style={[stStyles.iconBox, { backgroundColor: color + '20' }]}>
          <Icon name="walk" size={17} color={color} />
        </View>
        <Text style={[stStyles.title, { color: colors.textPrimary }]}>{t('healthHub.stepsLabel')}</Text>
        {isDone && (
          <View style={[stStyles.goalBadge, { backgroundColor: '#22C55E20' }]}>
            <Icon name="check" size={10} color="#22C55E" />
            <Text style={stStyles.goalText}>{t('healthHub.stepsGoalReached')}</Text>
          </View>
        )}
        <View style={{ flex: 1 }} />
        <Icon name="chevron-right" size={16} color={colors.textTertiary} />
      </View>

      <View style={stStyles.mainRow}>
        <Text style={[stStyles.stepNum, { color: colors.textPrimary }]}>
          {steps.steps.toLocaleString()}
        </Text>
        <Text style={[stStyles.stepOf, { color: colors.textTertiary }]}>
          / {steps.targetSteps.toLocaleString()}
        </Text>
      </View>

      {/* Segmented progress bar */}
      <View style={stStyles.barWrap}>
        {Array.from({ length: 10 }).map((_, i) => {
          const filled = i < Math.floor(pct * 10);
          const partial = !filled && i === Math.floor(pct * 10);
          const partialPct = partial ? (pct * 10 - Math.floor(pct * 10)) * 100 : 0;
          return (
            <View key={i} style={[stStyles.seg, { backgroundColor: colors.surfaceElevated }]}>
              {(filled || partial) && (
                <View style={[stStyles.segFill, {
                  width: filled ? '100%' : `${partialPct}%`,
                  backgroundColor: color,
                }]} />
              )}
            </View>
          );
        })}
      </View>

      <View style={stStyles.statsRow}>
        <View style={stStyles.statItem}>
          <Icon name="map-marker-distance" size={12} color={colors.textTertiary} />
          <Text style={[stStyles.statVal, { color: colors.textSecondary }]}>{steps.distanceKm} km</Text>
        </View>
        <View style={stStyles.statItem}>
          <Icon name="fire" size={12} color={colors.textTertiary} />
          <Text style={[stStyles.statVal, { color: colors.textSecondary }]}>{steps.caloriesBurned} kcal</Text>
        </View>
        <View style={stStyles.statItem}>
          <Icon name="timer-outline" size={12} color={colors.textTertiary} />
          <Text style={[stStyles.statVal, { color: colors.textSecondary }]}>{steps.activeMinutes} min</Text>
        </View>
        {!isDone && (
          <Text style={[stStyles.remaining, { color: colors.textTertiary }]}>
            {remaining.toLocaleString()} to go
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const stStyles = StyleSheet.create({
  card:       { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.base, gap: Spacing.sm },
  header:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconBox:    { width: 32, height: 32, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  title:      { fontSize: Typography.sm, fontWeight: Typography.semibold },
  goalBadge:  { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: Radius.full },
  goalText:   { fontSize: 10, fontWeight: Typography.bold, color: '#22C55E' },
  mainRow:    { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  stepNum:    { fontSize: 32, fontWeight: Typography.bold, lineHeight: 36 },
  stepOf:     { fontSize: Typography.sm },
  barWrap:    { flexDirection: 'row', gap: 3, height: 8 },
  seg:        { flex: 1, borderRadius: 4, overflow: 'hidden' },
  segFill:    { height: '100%', borderRadius: 4 },
  statsRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.base },
  statItem:   { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statVal:    { fontSize: Typography.xs },
  remaining:  { fontSize: Typography.xs, marginLeft: 'auto' },
});

// ─── Hydration quick card ─────────────────────────────────────────────────────

function HydrationCard({
  totalMl, targetMl, onAdd, onPress, isLogging, colors,
}: {
  totalMl: number; targetMl: number;
  onAdd: (ml: number) => void;
  onPress: () => void;
  isLogging: boolean;
  colors: ColorPalette;
}) {
  const { t } = useTranslation();
  const pct    = Math.min(totalMl / targetMl, 1);
  const isDone = totalMl >= targetMl;
  const color  = isDone ? '#22C55E' : WATER_COLOR;
  const PRESETS = [200, 330, 500];
  const totalL = (totalMl / 1000).toFixed(1);
  const targetL = (targetMl / 1000).toFixed(1);

  return (
    <TouchableOpacity
      style={[hcStyles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={hcStyles.header}>
        <View style={[hcStyles.iconBox, { backgroundColor: color + '20' }]}>
          <Icon name="water" size={17} color={color} />
        </View>
        <Text style={[hcStyles.title, { color: colors.textPrimary }]}>{t('healthHub.waterLabel')}</Text>
        {isDone && (
          <View style={[hcStyles.doneBadge, { backgroundColor: '#22C55E20' }]}>
            <Icon name="check" size={10} color="#22C55E" />
            <Text style={hcStyles.doneText}>{t('healthHub.hydrationDone')}</Text>
          </View>
        )}
        <View style={{ flex: 1 }} />
        <Icon name="chevron-right" size={16} color={colors.textTertiary} />
      </View>

      <View style={hcStyles.bodyRow}>
        {/* Wave progress — simple arc visual */}
        <VitalRing value={totalMl} max={targetMl} color={color} size={64} strokeWidth={7}>
          <Text style={[hcStyles.ringText, { color }]}>{Math.round(pct * 100)}%</Text>
        </VitalRing>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={hcStyles.amountRow}>
            <Text style={[hcStyles.amountNum, { color: colors.textPrimary }]}>{totalL}L</Text>
            <Text style={[hcStyles.amountOf, { color: colors.textTertiary }]}>/ {targetL}L</Text>
          </View>
          {/* Quick-add buttons */}
          <View style={hcStyles.presetsRow}>
            {PRESETS.map(ml => (
              <TouchableOpacity
                key={ml}
                style={[hcStyles.preset, { backgroundColor: color + '18', borderColor: color + '40' }]}
                onPress={() => onAdd(ml)}
                disabled={isLogging}
              >
                <Text style={[hcStyles.presetText, { color }]}>+{ml}ml</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const hcStyles = StyleSheet.create({
  card:       { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.base, gap: Spacing.sm },
  header:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconBox:    { width: 32, height: 32, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  title:      { fontSize: Typography.sm, fontWeight: Typography.semibold },
  doneBadge:  { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: Radius.full },
  doneText:   { fontSize: 10, fontWeight: Typography.bold, color: '#22C55E' },
  bodyRow:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.base },
  ringText:   { fontSize: 12, fontWeight: Typography.bold },
  amountRow:  { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  amountNum:  { fontSize: 26, fontWeight: Typography.bold, lineHeight: 30 },
  amountOf:   { fontSize: Typography.sm },
  presetsRow: { flexDirection: 'row', gap: Spacing.xs },
  preset:     { flex: 1, paddingVertical: 5, borderRadius: Radius.full, borderWidth: 1, alignItems: 'center' },
  presetText: { fontSize: 11, fontWeight: Typography.semibold },
});

// ─── Check-in CTA ────────────────────────────────────────────────────────────

function CheckInCTA({
  hasCheckedIn, energyLevel, sorenessLevel, onPress, colors,
}: {
  hasCheckedIn: boolean; energyLevel?: number; sorenessLevel?: number;
  onPress: () => void; colors: ColorPalette;
}) {
  const { t } = useTranslation();
  if (hasCheckedIn) {
    return (
      <TouchableOpacity
        style={[ciStyles.card, { backgroundColor: colors.surface, borderColor: '#22C55E50' }]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={[ciStyles.iconBox, { backgroundColor: '#22C55E20' }]}>
          <Icon name="check-circle" size={22} color="#22C55E" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[ciStyles.title, { color: '#22C55E' }]}>{t('healthHub.checkInComplete')}</Text>
          <Text style={[ciStyles.sub, { color: colors.textTertiary }]}>
            {t('healthHub.checkInStatus', { energy: energyLevel, soreness: sorenessLevel })}
          </Text>
        </View>
        <Icon name="pencil-outline" size={16} color={colors.textTertiary} />
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity
      style={[ciStyles.card, { backgroundColor: colors.surface, borderColor: colors.primary + '50' }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[ciStyles.iconBox, { backgroundColor: colors.primaryDim }]}>
        <Icon name="clipboard-check-outline" size={22} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[ciStyles.title, { color: colors.textPrimary }]}>{t('healthHub.completeCheckIn')}</Text>
        <Text style={[ciStyles.sub, { color: colors.textTertiary }]}>
          {t('healthHub.checkInDesc')}
        </Text>
      </View>
      <View style={[ciStyles.pill, { backgroundColor: colors.primary }]}>
        <Text style={[ciStyles.pillText, { color: colors.textInverse }]}>{t('healthHub.checkInTime')}</Text>
      </View>
    </TouchableOpacity>
  );
}

const ciStyles = StyleSheet.create({
  card:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.base },
  iconBox: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:   { fontSize: Typography.sm, fontWeight: Typography.bold },
  sub:     { fontSize: Typography.xs, marginTop: 2 },
  pill:    { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  pillText:{ fontSize: 10, fontWeight: Typography.bold },
});

// ─── Section header ───────────────────────────────────────────────────────────

function SectionLabel({ label, colors }: { label: string; colors: ColorPalette }) {
  return (
    <Text style={{ fontSize: Typography.xs, fontWeight: Typography.bold, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
      {label}
    </Text>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

function today() { return new Date().toISOString().split('T')[0]; }

export default function HealthHubScreen() {
  const navigation = useNavigation<HealthNavigationProp>();
  const insets  = useSafeAreaInsets();
  const colors  = useColors();
  const styles  = useMemo(() => getStyles(colors), [colors]);
  const { entitlements } = useAuthStore();
  const qc = useQueryClient();
  const { t } = useTranslation();

  const { data: meData } = useQuery({ queryKey: ['me'], queryFn: userApi.getMe });
  const profile = meData?.profile;
  const targetMl    = profile?.targetWaterMl ?? 2500;
  const targetSteps = profile?.targetSteps   ?? 10000;

  const { data: score, isLoading: scoreLoading, refetch: refetchScore } = useQuery<RecoveryScore>({
    queryKey: ['recovery-today'],
    queryFn: recoveryApi.getToday,
  });

  const { data: recoveryHistory = [] } = useQuery<RecoveryScore[]>({
    queryKey: ['recovery-history-hub'],
    queryFn: () => recoveryApi.getHistory(0, 7),
  });

  const { data: checkIn, refetch: refetchCheckIn } = useQuery({
    queryKey: ['recovery-check-in-today'],
    queryFn: recoveryApi.getTodayCheckIn,
  });

  const { data: sleep, refetch: refetchSleep } = useQuery<DailySleep>({
    queryKey: ['sleep-today'],
    queryFn: healthApi.getSleepToday,
  });

  const { data: steps, refetch: refetchSteps } = useQuery<DailySteps>({
    queryKey: ['steps-today'],
    queryFn: healthApi.getStepsToday,
  });

  const { data: waterMl = 0, refetch: refetchWater } = useQuery<number>({
    queryKey: ['water-today'],
    queryFn: () => nutritionApi.getWater(today()),
  });

  const waterMutation = useMutation({
    mutationFn: (ml: number) => nutritionApi.logWater(today(), ml),
    onSuccess: () => {
      qc.setQueryData(['water-today'], (prev: number) => (prev ?? 0) + 0);
      refetchWater();
    },
  });

  const isRefreshing = scoreLoading;

  const refetchAll = useCallback(() => {
    refetchScore();
    refetchCheckIn();
    refetchSleep();
    refetchSteps();
    refetchWater();
  }, [refetchScore, refetchCheckIn, refetchSleep, refetchSteps, refetchWater]);

  useFocusEffect(useCallback(() => { refetchAll(); }, [refetchAll]));

  // ── Derived vitals for the strip ────────────────────────────────────────────
  const sleepHours   = sleep ? (sleep.totalMinutes / 60) : 0;
  const sleepTarget  = sleep ? (sleep.targetMinutes / 60) : 8;
  const stepsCount   = steps?.steps ?? 0;
  const stepsTarget  = steps?.targetSteps ?? targetSteps;
  const recoveryVal  = score?.recoveryScore ?? 0;

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric',
  });

  return (
    <ScrollView
      style={[styles.root, { paddingTop: insets.top }]}
      contentContainerStyle={[styles.scroll, { paddingBottom: TAB_BAR_PADDING }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refetchAll} tintColor={colors.primary} />}
    >
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t('healthHub.title')}</Text>
          <Text style={styles.subtitle}>{dateStr}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' }}>
          <PremiumTag />
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('RecoveryHistory')}>
            <Icon name="history" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('RecoverySettings')}>
            <Icon name="cog-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Today's Vitals Strip ────────────────────────────────────────────── */}
      <SectionLabel label={t('healthHub.todayVitals')} colors={colors} />
      <View style={styles.vitalsRow}>
        <VitalCard
          label={t('healthHub.recoveryLabel')}
          icon="heart-pulse"
          color={score ? (LEVEL_CONFIG[score.recoveryLevel as RecoveryLevel]?.color ?? colors.primary) : colors.primary}
          value={String(recoveryVal)}
          sub="/ 100"
          ringValue={recoveryVal}
          ringMax={100}
          onPress={() => score && navigation.navigate('RecoveryDetails', { date: score.date })}
          colors={colors}
        />
        <VitalCard
          label={t('healthHub.sleepLabel')}
          icon="moon-waning-crescent"
          color={SLEEP_COLOR}
          value={sleep && sleep.totalMinutes > 0 ? `${sleepHours.toFixed(1)}h` : '—'}
          sub={`/ ${sleepTarget}h`}
          ringValue={sleepHours}
          ringMax={sleepTarget}
          onPress={() => navigation.navigate('SleepScreen')}
          colors={colors}
        />
        <VitalCard
          label={t('healthHub.stepsLabel')}
          icon="walk"
          color={stepsCount >= stepsTarget ? '#22C55E' : STEPS_COLOR}
          value={stepsCount > 0 ? stepsCount.toLocaleString() : '—'}
          sub={`/ ${(stepsTarget / 1000).toFixed(0)}k`}
          ringValue={stepsCount}
          ringMax={stepsTarget}
          onPress={() => navigation.navigate('StepsScreen')}
          colors={colors}
        />
        <VitalCard
          label={t('healthHub.waterLabel')}
          icon="water"
          color={waterMl >= targetMl ? '#22C55E' : WATER_COLOR}
          value={waterMl > 0 ? `${(waterMl / 1000).toFixed(1)}L` : '—'}
          sub={`/ ${(targetMl / 1000).toFixed(1)}L`}
          ringValue={waterMl}
          ringMax={targetMl}
          onPress={() => navigation.navigate('HydrationScreen')}
          colors={colors}
        />
      </View>

      {/* ── Recovery ────────────────────────────────────────────────────────── */}
      <SectionLabel label={t('healthHub.recoveryLabel')} colors={colors} />
      {score ? (
        <RecoveryCard
          score={score}
          history={recoveryHistory}
          onPress={() => navigation.navigate('RecoveryDetails', { date: score.date })}
          colors={colors}
        />
      ) : (
        <View style={[styles.card, styles.loadingCard]}>
          <Icon name="heart-pulse" size={32} color={colors.textTertiary} />
          <Text style={[styles.loadingText, { color: colors.textTertiary }]}>{t('healthHub.calculatingRecovery')}</Text>
        </View>
      )}

      {/* ── Check-in ────────────────────────────────────────────────────────── */}
      <CheckInCTA
        hasCheckedIn={!!checkIn}
        energyLevel={checkIn?.energyLevel}
        sorenessLevel={checkIn?.sorenessLevel}
        onPress={() => score && navigation.navigate('RecoveryCheckIn', { date: score.date })}
        colors={colors}
      />

      {/* ── Sleep ───────────────────────────────────────────────────────────── */}
      <SectionLabel label={t('healthHub.sleepLabel')} colors={colors} />
      {sleep && (
        <SleepCard
          sleep={sleep}
          onPress={() => navigation.navigate('SleepScreen')}
          onLog={() => navigation.navigate('SleepScreen')}
          colors={colors}
        />
      )}

      {/* ── Steps ───────────────────────────────────────────────────────────── */}
      <SectionLabel label={t('healthHub.stepsLabel')} colors={colors} />
      {steps && (
        <StepsCard
          steps={steps}
          onPress={() => navigation.navigate('StepsScreen')}
          colors={colors}
        />
      )}

      {/* ── Hydration ───────────────────────────────────────────────────────── */}
      <SectionLabel label={t('healthHub.waterLabel')} colors={colors} />
      <HydrationCard
        totalMl={waterMl}
        targetMl={targetMl}
        onAdd={(ml) => waterMutation.mutate(ml)}
        onPress={() => navigation.navigate('HydrationScreen')}
        isLogging={waterMutation.isPending}
        colors={colors}
      />

      {/* ── AI Insights (Premium) ──────────────────────────────────────────── */}
      {entitlements?.isPremium ? (
        <View style={[styles.card, { borderColor: colors.primary + '30' }]}>
          <View style={styles.aiHeader}>
            <View style={[styles.aiIconBox, { backgroundColor: colors.primaryDim }]}>
              <Icon name="brain" size={14} color={colors.primary} />
            </View>
            <Text style={[styles.aiTitle, { color: colors.primary }]}>{t('healthHub.aiInsight')}</Text>
          </View>
          <Text style={[styles.aiBody, { color: colors.textPrimary }]}>
            Your recovery scores are highest on days with 7.5h+ sleep and 2,000ml+ water. This week's sleep debt may be limiting your training performance.
          </Text>
          <Text style={[styles.aiDisclaimer, { color: colors.textTertiary }]}>
            {t('healthHub.aiInsightNote')}
          </Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.premiumCard} activeOpacity={0.8}>
          <Icon name="crown" size={16} color="#F59E0B" />
          <View style={{ flex: 1 }}>
            <Text style={styles.premiumTitle}>{t('healthHub.unlockAiTitle')}</Text>
            <Text style={[styles.premiumSub, { color: colors.textTertiary }]}>
              {t('healthHub.unlockAiDesc')}
            </Text>
          </View>
          <Icon name="chevron-right" size={16} color="#F59E0B" />
        </TouchableOpacity>
      )}

      {/* ── Disclaimer ─────────────────────────────────────────────────────── */}
      <Text style={[styles.disclaimer, { color: colors.textTertiary }]}>
        Recovery score is an estimate for fitness tracking only and is not medical advice.
      </Text>
    </ScrollView>
  );
}

function getStyles(c: ColorPalette) {
  return StyleSheet.create({
    root:    { flex: 1, backgroundColor: c.background },
    scroll:  { padding: Spacing.base, gap: Spacing.md },
    header:  {
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
    vitalsRow: { flexDirection: 'row', gap: Spacing.sm },
    card: {
      backgroundColor: c.surface, borderRadius: Radius.lg,
      borderWidth: 1, borderColor: c.surfaceBorder, padding: Spacing.base,
    },
    loadingCard:  { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl },
    loadingText:  { fontSize: Typography.sm },
    aiHeader:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    aiIconBox:    { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    aiTitle:      { fontSize: Typography.sm, fontWeight: Typography.semibold },
    aiBody:       { fontSize: Typography.sm, lineHeight: 20 },
    aiDisclaimer: { fontSize: Typography.xs, fontStyle: 'italic' },
    premiumCard:  {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
      backgroundColor: '#F59E0B12', borderRadius: Radius.lg,
      borderWidth: 1, borderColor: '#F59E0B30', padding: Spacing.base,
    },
    premiumTitle: { fontSize: Typography.sm, fontWeight: Typography.bold, color: '#F59E0B' },
    premiumSub:   { fontSize: Typography.xs, marginTop: 2 },
    disclaimer:   {
      fontSize: Typography.xs, textAlign: 'center',
      lineHeight: 16, fontStyle: 'italic', paddingHorizontal: Spacing.base,
    },
  });
}

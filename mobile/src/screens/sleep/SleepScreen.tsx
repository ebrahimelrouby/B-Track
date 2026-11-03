import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, I18nManager } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { HealthNavigationProp } from '@/navigation/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTranslation } from 'react-i18next';

import { useColors, ColorPalette, Spacing, Typography, Radius, TAB_BAR_PADDING } from '@/theme';
import { healthApi } from '@/api/health.api';
import { userApi } from '@/api/user.api';
import { useHealthStore } from '@/store/health.store';
import { healthService } from '@/services/health/healthService';
import { syncRecentHealthData } from '@/services/health/syncRecent';
import { DailySleep, SleepQuality } from '@/types';

const SLEEP_COLOR  = '#8B5CF6';
const SLEEP_OUTER  = '#7C3AED';
const SLEEP_LAVEND = '#C4B5FD';

// ─── Dual Sleep Ring ─────────────────────────────────────────────────────────

function SleepRing({ size, minutes, targetMinutes }: { size: number; minutes: number; targetMinutes: number }) {
  const { t } = useTranslation();
  const sw   = 10;
  const swIn = 6;
  const r    = (size - sw) / 2;
  const rIn  = r - sw / 2 - swIn / 2 - 3;
  const cx   = size / 2;
  const c    = 2 * Math.PI * r;
  const cIn  = 2 * Math.PI * rIn;
  const pct  = Math.min(minutes / targetMinutes, 1);
  const pctIn = Math.min(minutes / 600, 1); // inner: against 10h max
  const off   = c   * (1 - pct);
  const offIn = cIn * (1 - pctIn);
  const hours = Math.floor(minutes / 60);
  const mins  = minutes % 60;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={cx} cy={cx} r={r}   stroke={SLEEP_OUTER + '25'}  strokeWidth={sw}   fill="none" />
        <Circle cx={cx} cy={cx} r={r}   stroke={SLEEP_OUTER}         strokeWidth={sw}   fill="none"
          strokeDasharray={c}   strokeDashoffset={off}
          strokeLinecap="round" transform={`rotate(-90 ${cx} ${cx})`} />
        <Circle cx={cx} cy={cx} r={rIn} stroke={SLEEP_LAVEND + '20'} strokeWidth={swIn} fill="none" />
        <Circle cx={cx} cy={cx} r={rIn} stroke={SLEEP_LAVEND}        strokeWidth={swIn} fill="none"
          strokeDasharray={cIn} strokeDashoffset={offIn}
          strokeLinecap="round" transform={`rotate(-90 ${cx} ${cx})`} />
      </Svg>
      {minutes > 0 ? (
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 30, fontWeight: Typography.extrabold, color: SLEEP_LAVEND, lineHeight: 34 }}>
            {hours}<Text style={{ fontSize: 14 }}>h</Text>{' '}
            {mins}<Text style={{ fontSize: 14 }}>m</Text>
          </Text>
          <Text style={{ fontSize: 10, color: SLEEP_LAVEND + '80', marginTop: 2 }}>
            {t('sleep.goalSuffix', { n: Math.floor(targetMinutes / 60) })}
          </Text>
        </View>
      ) : (
        <Text style={{ fontSize: 28, fontWeight: Typography.extrabold, color: SLEEP_LAVEND + '40' }}>—</Text>
      )}
    </View>
  );
}

// ─── Weekly bar chart ────────────────────────────────────────────────────────

function WeeklyChart({ history, targetMins, colors }: { history: DailySleep[]; targetMins: number; colors: ColorPalette }) {
  const { t } = useTranslation();
  const last7 = [...history].slice(0, 7).reverse();
  const maxMins = 600;
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  return (
    <View style={{ gap: Spacing.sm }}>
      <Text style={{ fontSize: Typography.xs, fontWeight: Typography.bold, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
        {t('sleep.chartTitle')}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
        {last7.map((d, i) => {
          const pct = d.totalMinutes / maxMins;
          const isTarget = d.totalMinutes >= targetMins;
          const color = isTarget ? SLEEP_COLOR : d.totalMinutes >= targetMins * 0.75 ? '#F59E0B' : '#EF4444';
          const barH = Math.max(Math.min(pct, 1) * 80, 4);
          const dow = new Date(d.date + 'T12:00:00').getDay();
          return (
            <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 9, color: colors.textTertiary }}>
                {d.totalMinutes > 0 ? `${(d.totalMinutes/60).toFixed(1)}` : ''}
              </Text>
              {/* Fixed-height zone the bar grows within, so a tall bar can never push the label above it out of place */}
              <View style={{ width: '100%', height: 80, justifyContent: 'flex-end' }}>
                <View style={{ width: '100%', height: barH, backgroundColor: color + '25', borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' }}>
                  <View style={{ width: '100%', height: '100%', backgroundColor: color, borderRadius: 4 }} />
                </View>
              </View>
              <Text style={{ fontSize: 9, color: colors.textTertiary }}>{days[dow]}</Text>
            </View>
          );
        })}
      </View>
      {/* Summary */}
      {last7.length > 0 && (() => {
        const avg = last7.reduce((s, d) => s + d.totalMinutes, 0) / last7.length;
        const avgH = Math.floor(avg / 60);
        const avgM = Math.round(avg % 60);
        return (
          <View style={{ flexDirection: 'row', gap: Spacing.base }}>
            <View style={{ flex: 1, backgroundColor: colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center' }}>
              <Text style={{ fontSize: Typography.base, fontWeight: Typography.bold, color: SLEEP_LAVEND }}>{avgH}h {avgM}m</Text>
              <Text style={{ fontSize: Typography.xs, color: colors.textTertiary }}>{t('sleep.chartAvg')}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center' }}>
              <Text style={{ fontSize: Typography.base, fontWeight: Typography.bold, color: SLEEP_LAVEND }}>
                {last7.filter(d => d.totalMinutes >= targetMins * 0.875).length}/7
              </Text>
              <Text style={{ fontSize: Typography.xs, color: colors.textTertiary }}>{t('sleep.chartNights')}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center' }}>
              <Text style={{ fontSize: Typography.base, fontWeight: Typography.bold, color: SLEEP_LAVEND }}>
                {avg >= targetMins ? '✓' : `${Math.round(targetMins - avg)}m`}
              </Text>
              <Text style={{ fontSize: Typography.xs, color: colors.textTertiary }}>{t('sleep.chartDeficit')}</Text>
            </View>
          </View>
        );
      })()}
    </View>
  );
}

// ─── Quality badge config ─────────────────────────────────────────────────────

const QUALITY_ICONS: Record<SleepQuality, { icon: string; color: string }> = {
  POOR:      { icon: 'emoticon-sad-outline',    color: '#EF4444' },
  FAIR:      { icon: 'emoticon-neutral-outline', color: '#F59E0B' },
  GOOD:      { icon: 'emoticon-happy-outline',   color: '#4ADE80' },
  EXCELLENT: { icon: 'emoticon-excited-outline', color: '#22C55E' },
};

const QUALITY_LABEL_KEYS: Record<SleepQuality, string> = {
  POOR: 'sleep.qualityPoor',
  FAIR: 'sleep.qualityFair',
  GOOD: 'sleep.qualityGood',
  EXCELLENT: 'sleep.qualityExcellent',
};

function qualityLabelKey(q: SleepQuality): string {
  return QUALITY_LABEL_KEYS[q];
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SleepScreen() {
  const navigation = useNavigation<HealthNavigationProp>();
  const insets  = useSafeAreaInsets();
  const colors  = useColors();
  const qc      = useQueryClient();
  const { t } = useTranslation();

  const { stepsAuthorized: authorized, setAuthorized } = useHealthStore();
  const [isConnecting, setIsConnecting] = useState(false);

  const { data: meData } = useQuery({ queryKey: ['me'], queryFn: userApi.getMe });
  const targetMinutes = Math.round((meData?.profile?.targetSleepHours ?? 8) * 60);

  const { data: sleepToday, isLoading, isRefetching, refetch } = useQuery<DailySleep>({
    queryKey: ['sleep-today'],
    queryFn: healthApi.getSleepToday,
  });

  const { data: history = [], refetch: refetchHistory } = useQuery<DailySleep[]>({
    queryKey: ['sleep-history'],
    queryFn: () => healthApi.getSleepHistory(14),
  });

  const refetchAll = () => { refetch(); refetchHistory(); };

  async function handleConnect() {
    setIsConnecting(true);
    try {
      const granted = await healthService.requestAuthorization();
      setAuthorized(granted);
      await syncRecentHealthData();
      qc.invalidateQueries({ queryKey: ['sleep-today'] });
      qc.invalidateQueries({ queryKey: ['sleep-history'] });
    } finally {
      setIsConnecting(false);
    }
  }

  async function handleSyncNow() {
    setIsConnecting(true);
    try {
      await syncRecentHealthData();
      refetchAll();
    } finally {
      setIsConnecting(false);
    }
  }

  const log = sleepToday?.logs[0];
  const hasLog = (sleepToday?.totalMinutes ?? 0) > 0;

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1, paddingTop: insets.top }}
        contentContainerStyle={{ padding: Spacing.base, gap: Spacing.lg, paddingBottom: TAB_BAR_PADDING }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading || isRefetching}
            onRefresh={refetchAll}
            tintColor={SLEEP_COLOR}
          />
        }
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: Spacing.sm }}>
          <TouchableOpacity
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' }}
            onPress={() => navigation.goBack()}
          >
            <Icon name={I18nManager.isRTL ? "arrow-right" : "arrow-left"} size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: Typography.xl, fontWeight: Typography.bold, color: colors.textPrimary }}>{t('sleep.title')}</Text>
            <Text style={{ fontSize: Typography.sm, color: colors.textTertiary, marginTop: 2 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Main card — ring + connect state + tonight's detail, all in one */}
        <View style={{ backgroundColor: colors.surface, borderRadius: Radius.xl, borderWidth: 1, borderColor: colors.surfaceBorder, padding: Spacing.lg, gap: Spacing.lg }}>
          <View style={{ alignItems: 'center', gap: Spacing.lg }}>
            <SleepRing
              size={180}
              minutes={sleepToday?.totalMinutes ?? 0}
              targetMinutes={targetMinutes}
            />
            {(() => {
              const quality = sleepToday?.quality as SleepQuality | null | undefined;
              if (!quality) return null;
              const q = QUALITY_ICONS[quality];
              return (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: q.color + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full }}>
                  <Icon name={q.icon} size={14} color={q.color} />
                  <Text style={{ fontSize: Typography.sm, fontWeight: Typography.semibold, color: q.color }}>
                    {t('sleep.qualitySuffix', { label: t(qualityLabelKey(quality)) })}
                  </Text>
                </View>
              );
            })()}

            {!authorized ? (
              <TouchableOpacity
                style={{ backgroundColor: SLEEP_COLOR, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.full, opacity: isConnecting ? 0.6 : 1 }}
                onPress={handleConnect}
                disabled={isConnecting}
              >
                <Icon name="heart-plus-outline" size={16} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontWeight: Typography.bold, fontSize: Typography.sm }}>
                  {isConnecting ? t('sleep.connecting') : t('sleep.connectHealth')}
                </Text>
              </TouchableOpacity>
            ) : !hasLog ? (
              <View style={{ alignItems: 'center', gap: Spacing.sm }}>
                <Text style={{ fontSize: Typography.sm, color: colors.textTertiary, textAlign: 'center' }}>
                  {t('sleep.noDataSynced')}
                </Text>
                <TouchableOpacity
                  style={{ backgroundColor: SLEEP_COLOR + '20', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, opacity: isConnecting ? 0.6 : 1 }}
                  onPress={handleSyncNow}
                  disabled={isConnecting}
                >
                  <Icon name="sync" size={14} color={SLEEP_COLOR} />
                  <Text style={{ color: SLEEP_COLOR, fontWeight: Typography.semibold, fontSize: Typography.xs }}>
                    {isConnecting ? t('sleep.syncing') : t('sleep.syncNow')}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          {log && (
            <>
              <View style={{ height: 1, backgroundColor: colors.surfaceBorder }} />

              <Text style={{ fontSize: Typography.xs, fontWeight: Typography.bold, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                {t('sleep.tonightDetail')}
              </Text>
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                <View style={{ flex: 1, backgroundColor: colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center', gap: 3 }}>
                  <Icon name="weather-night" size={18} color={SLEEP_COLOR} />
                  <Text style={{ fontSize: Typography.base, fontWeight: Typography.bold, color: colors.textPrimary }}>{formatTime(log.bedtime)}</Text>
                  <Text style={{ fontSize: Typography.xs, color: colors.textTertiary }}>{t('sleep.bedtimeLabel')}</Text>
                </View>
                <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                  <Icon name={I18nManager.isRTL ? 'arrow-left' : 'arrow-right'} size={18} color={colors.textTertiary} />
                </View>
                <View style={{ flex: 1, backgroundColor: colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center', gap: 3 }}>
                  <Icon name="weather-sunny" size={18} color="#F59E0B" />
                  <Text style={{ fontSize: Typography.base, fontWeight: Typography.bold, color: colors.textPrimary }}>{formatTime(log.wakeTime)}</Text>
                  <Text style={{ fontSize: Typography.xs, color: colors.textTertiary }}>{t('sleep.wakeUpLabel')}</Text>
                </View>
              </View>

              {/* Phases visual */}
              <View style={{ gap: 4 }}>
                <Text style={{ fontSize: Typography.xs, color: colors.textTertiary }}>{t('sleep.estimatedPhases')}</Text>
                <View style={{ height: 20, flexDirection: 'row', borderRadius: 10, overflow: 'hidden', gap: 2 }}>
                  <View style={{ flex: 2, backgroundColor: '#4C1D95' }} />
                  <View style={{ flex: 3, backgroundColor: SLEEP_COLOR }} />
                  <View style={{ flex: 2, backgroundColor: SLEEP_LAVEND }} />
                  <View style={{ flex: 1, backgroundColor: SLEEP_COLOR + '60' }} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                  {[{ label: t('sleep.phaseDeep'), color: '#4C1D95' }, { label: t('sleep.phaseCore'), color: SLEEP_COLOR }, { label: t('sleep.phaseRem'), color: SLEEP_LAVEND }, { label: t('sleep.phaseLight'), color: SLEEP_COLOR + '60' }].map(p => (
                    <View key={p.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: p.color }} />
                      <Text style={{ fontSize: 10, color: colors.textTertiary }}>{p.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}
        </View>

        {/* Smart Alarm entry */}
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: colors.surfaceBorder, padding: Spacing.base }}
          onPress={() => navigation.navigate('SmartAlarm')}
        >
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: SLEEP_COLOR + '20', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="alarm" size={18} color={SLEEP_COLOR} />
          </View>
          <Text style={{ flex: 1, fontSize: Typography.base, fontWeight: Typography.semibold, color: colors.textPrimary }}>
            {t('smartAlarm.title')}
          </Text>
          <Icon name={I18nManager.isRTL ? 'chevron-left' : 'chevron-right'} size={20} color={colors.textTertiary} />
        </TouchableOpacity>

        {/* Weekly chart */}
        {history.length > 0 && (
          <View style={{ backgroundColor: colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: colors.surfaceBorder, padding: Spacing.base }}>
            <WeeklyChart history={history} targetMins={targetMinutes} colors={colors} />
          </View>
        )}

        {/* Sleep tips */}
        <View style={{ backgroundColor: SLEEP_COLOR + '10', borderRadius: Radius.lg, borderWidth: 1, borderColor: SLEEP_COLOR + '30', padding: Spacing.base, gap: Spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="lightbulb-outline" size={15} color={SLEEP_COLOR} />
            <Text style={{ fontSize: Typography.xs, fontWeight: Typography.bold, color: SLEEP_COLOR }}>{t('sleep.sleepTips')}</Text>
          </View>
          {[t('sleep.tip1'), t('sleep.tip2'), t('sleep.tip3')].map((tip, i) => (
            <Text key={i} style={{ fontSize: Typography.xs, color: colors.textSecondary, lineHeight: 16 }}>· {tip}</Text>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

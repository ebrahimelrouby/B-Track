import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, I18nManager } from 'react-native';
import { useNavigation } from '@react-navigation/native';
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
import { DailySteps } from '@/types';

const CAL_COLOR  = '#F97316';
const DONE_COLOR = '#22C55E';

// ─── Big calories ring ─────────────────────────────────────────────────────────

function CaloriesRing({ calories, target, size = 200 }: { calories: number; target: number; size?: number }) {
  const { t } = useTranslation();
  const sw  = 16;
  const r   = (size - sw) / 2;
  const cx  = size / 2;
  const c   = 2 * Math.PI * r;
  const pct = Math.min(calories / target, 1);
  const off = c * (1 - pct);
  const isDone = calories >= target;
  const color = isDone ? DONE_COLOR : CAL_COLOR;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={cx} cy={cx} r={r} stroke={color + '20'} strokeWidth={sw} fill="none" />
        <Circle
          cx={cx} cy={cx} r={r}
          stroke={color} strokeWidth={sw} fill="none"
          strokeDasharray={c} strokeDashoffset={off}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cx})`}
        />
      </Svg>
      <View style={{ alignItems: 'center', gap: 2 }}>
        {isDone && <Icon name="check-circle" size={20} color={color} />}
        <Text style={{ fontSize: 42, fontWeight: Typography.extrabold, color, lineHeight: 46 }}>
          {calories.toLocaleString()}
        </Text>
        <Text style={{ fontSize: Typography.sm, color: color + '80' }}>
          {t('calories.ringSuffix', { n: target.toLocaleString() })}
        </Text>
        <Text style={{ fontSize: Typography.xs, color: '#FFFFFF40', marginTop: 2 }}>
          {Math.round(pct * 100)}{t('calories.ringPct')}
        </Text>
      </View>
    </View>
  );
}

// ─── Weekly bar chart ─────────────────────────────────────────────────────────

function WeeklyCaloriesChart({ history, target, colors }: { history: DailySteps[]; target: number; colors: ColorPalette }) {
  const { t } = useTranslation();
  const last7  = [...history].slice(0, 7).reverse();
  const maxVal = Math.max(...last7.map(d => d.caloriesBurned), target);
  const days   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const totalCal = last7.reduce((s, d) => s + d.caloriesBurned, 0);
  const avgCal   = Math.round(totalCal / Math.max(last7.length, 1));
  const goalDays = last7.filter(d => d.caloriesBurned >= target).length;

  return (
    <View style={{ gap: Spacing.md }}>
      <Text style={{ fontSize: Typography.xs, fontWeight: Typography.bold, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
        {t('calories.chartTitle')}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
        {last7.map((d, i) => {
          const pct   = maxVal > 0 ? d.caloriesBurned / maxVal : 0;
          const isDone = d.caloriesBurned >= target;
          const color = isDone ? DONE_COLOR : d.caloriesBurned >= target * 0.7 ? CAL_COLOR : '#94A3B8';
          const barH  = Math.max(pct * 80, 4);
          const dow   = new Date(d.date + 'T12:00:00').getDay();
          return (
            <View key={i} style={{ flex: 1, alignItems: 'center', gap: 3 }}>
              <Text style={{ fontSize: 9, color: colors.textTertiary }}>
                {d.caloriesBurned > 0 ? Math.round(d.caloriesBurned) : ''}
              </Text>
              <View style={{ width: '100%', height: 80, justifyContent: 'flex-end' }}>
                <View style={{ width: '100%', height: barH, backgroundColor: color + '25', borderRadius: 5, overflow: 'hidden' }}>
                  <View style={{ width: '100%', height: '100%', backgroundColor: color, borderRadius: 5 }} />
                </View>
              </View>
              <Text style={{ fontSize: 9, color: isDone ? color : colors.textTertiary }}>{days[dow]}</Text>
            </View>
          );
        })}
      </View>
      {/* Summary stats */}
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        <View style={{ flex: 1, backgroundColor: colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center' }}>
          <Text style={{ fontSize: Typography.base, fontWeight: Typography.bold, color: CAL_COLOR }}>
            {avgCal.toLocaleString()}
          </Text>
          <Text style={{ fontSize: Typography.xs, color: colors.textTertiary }}>{t('calories.chartAvg')}</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center' }}>
          <Text style={{ fontSize: Typography.base, fontWeight: Typography.bold, color: DONE_COLOR }}>
            {goalDays}/7
          </Text>
          <Text style={{ fontSize: Typography.xs, color: colors.textTertiary }}>{t('calories.chartGoalDays')}</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center' }}>
          <Text style={{ fontSize: Typography.base, fontWeight: Typography.bold, color: CAL_COLOR }}>
            {totalCal.toLocaleString()}
          </Text>
          <Text style={{ fontSize: Typography.xs, color: colors.textTertiary }}>{t('calories.chartTotal')}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CaloriesScreen() {
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();
  const colors     = useColors();
  const qc         = useQueryClient();
  const { t } = useTranslation();
  const { data: meData } = useQuery({ queryKey: ['me'], queryFn: userApi.getMe });
  const targetCalories = meData?.profile?.targetActiveCalories ?? 500;

  const { stepsAuthorized: authorized, setAuthorized } = useHealthStore();
  const [isConnecting, setIsConnecting] = useState(false);

  const { data: stepsToday, isLoading, isRefetching, refetch } = useQuery<DailySteps>({
    queryKey: ['steps-today'],
    queryFn: healthApi.getStepsToday,
  });

  const { data: history = [], refetch: refetchHistory } = useQuery<DailySteps[]>({
    queryKey: ['steps-history'],
    queryFn: () => healthApi.getStepsHistory(14),
  });

  const refetchAll = () => { refetch(); refetchHistory(); };

  async function handleConnect() {
    setIsConnecting(true);
    try {
      const granted = await healthService.requestAuthorization();
      setAuthorized(granted);
      await syncRecentHealthData();
      qc.invalidateQueries({ queryKey: ['steps-today'] });
      qc.invalidateQueries({ queryKey: ['steps-history'] });
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

  const calories = stepsToday?.caloriesBurned ?? 0;
  const isDone   = calories >= targetCalories;
  const color    = isDone ? DONE_COLOR : CAL_COLOR;

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
            tintColor={CAL_COLOR}
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
            <Text style={{ fontSize: Typography.xl, fontWeight: Typography.bold, color: colors.textPrimary }}>{t('calories.title')}</Text>
            <Text style={{ fontSize: Typography.sm, color: colors.textTertiary, marginTop: 2 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Main card — ring + connect state + today's detail, all in one */}
        <View style={{ backgroundColor: colors.surface, borderRadius: Radius.xl, borderWidth: 1, borderColor: colors.surfaceBorder, padding: Spacing.lg, gap: Spacing.lg }}>
          <View style={{ alignItems: 'center', gap: Spacing.lg }}>
            <CaloriesRing calories={calories} target={targetCalories} size={200} />

            {!authorized ? (
              <TouchableOpacity
                style={{ backgroundColor: CAL_COLOR, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.full, opacity: isConnecting ? 0.6 : 1 }}
                onPress={handleConnect}
                disabled={isConnecting}
              >
                <Icon name="heart-plus-outline" size={16} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontWeight: Typography.bold, fontSize: Typography.sm }}>
                  {isConnecting ? t('calories.connecting') : t('calories.connectHealth')}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={{ backgroundColor: color + '20', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.full, opacity: isConnecting ? 0.6 : 1 }}
                onPress={handleSyncNow}
                disabled={isConnecting}
              >
                <Icon name="sync" size={14} color={color} />
                <Text style={{ color, fontWeight: Typography.semibold, fontSize: Typography.sm }}>
                  {isConnecting ? t('calories.syncing') : t('calories.syncNow')}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {stepsToday && (
            <>
              <View style={{ height: 1, backgroundColor: colors.surfaceBorder }} />
              <Text style={{ fontSize: Typography.xs, fontWeight: Typography.bold, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                {t('calories.todayDetail')}
              </Text>
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                {[
                  { icon: 'shoe-print', label: t('calories.statSteps'), value: stepsToday.steps.toLocaleString(), color: '#3B82F6' },
                  { icon: 'map-marker-distance', label: t('calories.statDistance'), value: `${stepsToday.distanceKm} km`, color: '#3B82F6' },
                  { icon: 'timer-outline', label: t('calories.statActive'), value: `${stepsToday.activeMinutes} min`, color: '#22C55E' },
                ].map(stat => (
                  <View key={stat.label} style={{ flex: 1, backgroundColor: colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: stat.color + '20', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name={stat.icon} size={16} color={stat.color} />
                    </View>
                    <Text style={{ fontSize: Typography.sm, fontWeight: Typography.bold, color: colors.textPrimary }}>{stat.value}</Text>
                    <Text style={{ fontSize: Typography.xs, color: colors.textTertiary }}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

        {/* Weekly chart */}
        {history.length > 0 && (
          <View style={{ backgroundColor: colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: colors.surfaceBorder, padding: Spacing.base }}>
            <WeeklyCaloriesChart history={history} target={targetCalories} colors={colors} />
          </View>
        )}

        {/* Tips */}
        <View style={{ backgroundColor: CAL_COLOR + '10', borderRadius: Radius.lg, borderWidth: 1, borderColor: CAL_COLOR + '30', padding: Spacing.base, gap: Spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="lightbulb-outline" size={15} color={CAL_COLOR} />
            <Text style={{ fontSize: Typography.xs, fontWeight: Typography.bold, color: CAL_COLOR }}>{t('calories.tips')}</Text>
          </View>
          {[t('calories.tip1'), t('calories.tip2'), t('calories.tip3')].map((tip, i) => (
            <Text key={i} style={{ fontSize: Typography.xs, color: colors.textSecondary, lineHeight: 16 }}>· {tip}</Text>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

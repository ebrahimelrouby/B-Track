import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Modal, TextInput, RefreshControl, I18nManager } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTranslation } from 'react-i18next';

import { useColors, ColorPalette, Spacing, Typography, Radius, TAB_BAR_PADDING } from '@/theme';
import { healthApi } from '@/api/health.api';
import { userApi } from '@/api/user.api';
import { DailySteps } from '@/types';

function today() { return new Date().toISOString().split('T')[0]; }

const STEPS_COLOR = '#3B82F6';
const DONE_COLOR  = '#22C55E';

// ─── Big steps ring ───────────────────────────────────────────────────────────

function StepsRing({ steps, target, size = 200 }: { steps: number; target: number; size?: number }) {
  const { t } = useTranslation();
  const sw  = 16;
  const r   = (size - sw) / 2;
  const cx  = size / 2;
  const c   = 2 * Math.PI * r;
  const pct = Math.min(steps / target, 1);
  const off = c * (1 - pct);
  const isDone = steps >= target;
  const color = isDone ? DONE_COLOR : STEPS_COLOR;

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
          {steps.toLocaleString()}
        </Text>
        <Text style={{ fontSize: Typography.sm, color: color + '80' }}>
          {t('steps.ringStepsSuffix', { n: target.toLocaleString() })}
        </Text>
        <Text style={{ fontSize: Typography.xs, color: '#FFFFFF40', marginTop: 2 }}>
          {Math.round(pct * 100)}{t('steps.ringGoalPct')}
        </Text>
      </View>
    </View>
  );
}

// ─── Weekly bar chart ─────────────────────────────────────────────────────────

function WeeklyStepsChart({ history, target, colors }: { history: DailySteps[]; target: number; colors: ColorPalette }) {
  const { t } = useTranslation();
  const last7  = [...history].slice(0, 7).reverse();
  const maxVal = Math.max(...last7.map(d => d.steps), target);
  const days   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const totalSteps = last7.reduce((s, d) => s + d.steps, 0);
  const avgSteps   = Math.round(totalSteps / Math.max(last7.length, 1));
  const goalDays   = last7.filter(d => d.steps >= target).length;

  return (
    <View style={{ gap: Spacing.md }}>
      <Text style={{ fontSize: Typography.xs, fontWeight: Typography.bold, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
        {t('steps.chartTitle')}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 100 }}>
        {last7.map((d, i) => {
          const pct   = d.steps / maxVal;
          const barH  = Math.max(pct * 88, 4);
          const isDone = d.steps >= target;
          const color = isDone ? DONE_COLOR : d.steps >= target * 0.7 ? STEPS_COLOR : '#94A3B8';
          const dow   = new Date(d.date + 'T12:00:00').getDay();
          return (
            <View key={i} style={{ flex: 1, alignItems: 'center', gap: 3 }}>
              <Text style={{ fontSize: 9, color: colors.textTertiary }}>
                {d.steps >= 1000 ? `${(d.steps / 1000).toFixed(1)}k` : d.steps}
              </Text>
              <View style={{ flex: 1, justifyContent: 'flex-end', width: '100%' }}>
                <View style={{ width: '100%', height: barH, backgroundColor: color + '25', borderRadius: 5, overflow: 'hidden' }}>
                  <View style={{ flex: 1, backgroundColor: color, borderRadius: 5 }} />
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
          <Text style={{ fontSize: Typography.base, fontWeight: Typography.bold, color: STEPS_COLOR }}>
            {avgSteps.toLocaleString()}
          </Text>
          <Text style={{ fontSize: Typography.xs, color: colors.textTertiary }}>{t('steps.chartAvg')}</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center' }}>
          <Text style={{ fontSize: Typography.base, fontWeight: Typography.bold, color: DONE_COLOR }}>
            {goalDays}/7
          </Text>
          <Text style={{ fontSize: Typography.xs, color: colors.textTertiary }}>{t('steps.chartGoalDays')}</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center' }}>
          <Text style={{ fontSize: Typography.base, fontWeight: Typography.bold, color: STEPS_COLOR }}>
            {(totalSteps * 0.00075).toFixed(1)} km
          </Text>
          <Text style={{ fontSize: Typography.xs, color: colors.textTertiary }}>{t('steps.chartDist')}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Log Steps Modal ──────────────────────────────────────────────────────────

function LogStepsModal({
  visible, onClose, onSubmit, isLoading, currentSteps, colors,
}: {
  visible: boolean; onClose: () => void;
  onSubmit: (steps: number) => void;
  isLoading: boolean;
  currentSteps: number;
  colors: ColorPalette;
}) {
  const { t } = useTranslation();
  const [value, setValue] = useState(currentSteps > 0 ? String(currentSteps) : '');

  const QUICK_VALUES = [2000, 4000, 6000, 8000, 10000, 12000, 15000];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.background, padding: Spacing.lg, gap: Spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: Typography.lg, fontWeight: Typography.bold, color: colors.textPrimary }}>
            {t('steps.modalTitle')}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Big input */}
        <View style={{ backgroundColor: colors.surface, borderRadius: Radius.xl, borderWidth: 1, borderColor: STEPS_COLOR + '40', padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm }}>
          <Icon name="walk" size={28} color={STEPS_COLOR} />
          <TextInput
            style={{ fontSize: 48, fontWeight: Typography.extrabold, color: STEPS_COLOR, textAlign: 'center', minWidth: 120 }}
            value={value}
            onChangeText={setValue}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={STEPS_COLOR + '40'}
            autoFocus
          />
          <Text style={{ fontSize: Typography.sm, color: colors.textTertiary }}>{t('steps.modalStepsLabel')}</Text>
        </View>

        {/* Quick-select chips */}
        <View style={{ gap: Spacing.xs }}>
          <Text style={{ fontSize: Typography.xs, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.6 }}>{t('steps.quickSelect')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs }}>
            {QUICK_VALUES.map(v => (
              <TouchableOpacity
                key={v}
                style={{
                  paddingHorizontal: Spacing.sm, paddingVertical: 6, borderRadius: Radius.full,
                  backgroundColor: Number(value) === v ? STEPS_COLOR + '25' : colors.surfaceElevated,
                  borderWidth: 1,
                  borderColor: Number(value) === v ? STEPS_COLOR : colors.surfaceBorder,
                }}
                onPress={() => setValue(String(v))}
              >
                <Text style={{ fontSize: Typography.xs, fontWeight: Typography.semibold, color: Number(value) === v ? STEPS_COLOR : colors.textSecondary }}>
                  {v >= 1000 ? `${v / 1000}k` : v}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={{ backgroundColor: STEPS_COLOR, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: Spacing.base, borderRadius: Radius.lg, opacity: isLoading ? 0.6 : 1 }}
          onPress={() => onSubmit(parseInt(value, 10) || 0)}
          disabled={isLoading || !value}
        >
          <Icon name="check" size={18} color="#FFFFFF" />
          <Text style={{ color: '#FFFFFF', fontWeight: Typography.bold, fontSize: Typography.base }}>
            {isLoading ? t('steps.savingBtn') : t('steps.saveBtn')}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function StepsScreen() {
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();
  const colors     = useColors();
  const qc         = useQueryClient();
  const { t } = useTranslation();
  const { data: meData } = useQuery({ queryKey: ['me'], queryFn: userApi.getMe });
  const targetSteps = meData?.profile?.targetSteps ?? 10000;

  const [modalVisible, setModalVisible] = useState(false);

  const { data: stepsToday, isLoading, isRefetching, refetch } = useQuery<DailySteps>({
    queryKey: ['steps-today'],
    queryFn: healthApi.getStepsToday,
  });

  const { data: history = [], refetch: refetchHistory } = useQuery<DailySteps[]>({
    queryKey: ['steps-history'],
    queryFn: () => healthApi.getStepsHistory(14),
  });

  const logMutation = useMutation({
    mutationFn: (steps: number) => healthApi.logSteps({ date: today(), steps }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['steps-today'] });
      qc.invalidateQueries({ queryKey: ['steps-history'] });
      setModalVisible(false);
    },
  });

  const steps   = stepsToday?.steps ?? 0;
  const isDone  = steps >= targetSteps;
  const color   = isDone ? DONE_COLOR : STEPS_COLOR;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1, paddingTop: insets.top }}
        contentContainerStyle={{ padding: Spacing.base, gap: Spacing.lg, paddingBottom: TAB_BAR_PADDING }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading || isRefetching}
            onRefresh={() => { refetch(); refetchHistory(); }}
            tintColor={STEPS_COLOR}
          />
        }
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingTop: Spacing.sm }}>
          <View>
            <Text style={{ fontSize: Typography.xl, fontWeight: Typography.bold, color: colors.textPrimary }}>{t('steps.title')}</Text>
            <Text style={{ fontSize: Typography.sm, color: colors.textTertiary, marginTop: 2 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </Text>
          </View>
          <TouchableOpacity
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' }}
            onPress={() => navigation.goBack()}
          >
            <Icon name={I18nManager.isRTL ? "arrow-right" : "arrow-left"} size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Main ring card */}
        <View style={{ backgroundColor: colors.surface, borderRadius: Radius.xl, borderWidth: 1, borderColor: colors.surfaceBorder, padding: Spacing.xl, alignItems: 'center', gap: Spacing.lg }}>
          <StepsRing steps={steps} target={targetSteps} size={200} />
          <TouchableOpacity
            style={{ backgroundColor: color + '20', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.full }}
            onPress={() => setModalVisible(true)}
          >
            <Icon name={steps > 0 ? 'pencil' : 'plus'} size={14} color={color} />
            <Text style={{ color, fontWeight: Typography.semibold, fontSize: Typography.sm }}>
              {steps > 0 ? t('steps.updateSteps') : t('steps.logSteps')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        {stepsToday && (
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            {[
              { icon: 'map-marker-distance', label: t('steps.statDistance'), value: `${stepsToday.distanceKm} km`, color },
              { icon: 'fire', label: t('steps.statCalories'), value: `${stepsToday.caloriesBurned} kcal`, color: '#F97316' },
              { icon: 'timer-outline', label: t('steps.statActive'), value: `${stepsToday.activeMinutes} min`, color: '#22C55E' },
            ].map(stat => (
              <View key={stat.label} style={{ flex: 1, backgroundColor: colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: colors.surfaceBorder, padding: Spacing.sm, alignItems: 'center', gap: 4 }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: stat.color + '20', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={stat.icon} size={16} color={stat.color} />
                </View>
                <Text style={{ fontSize: Typography.sm, fontWeight: Typography.bold, color: colors.textPrimary }}>{stat.value}</Text>
                <Text style={{ fontSize: Typography.xs, color: colors.textTertiary }}>{stat.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Segmented progress bar */}
        <View style={{ backgroundColor: colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: colors.surfaceBorder, padding: Spacing.base, gap: Spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: Typography.xs, fontWeight: Typography.bold, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.6 }}>
              {t('steps.progressToGoal')}
            </Text>
            <Text style={{ fontSize: Typography.xs, color: color }}>
              {Math.round(Math.min(steps / targetSteps, 1) * 100)}%
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 3, height: 12 }}>
            {Array.from({ length: 20 }).map((_, i) => {
              const pct   = steps / targetSteps;
              const filled = i < Math.floor(pct * 20);
              const partial = !filled && i === Math.floor(pct * 20);
              const pp = partial ? (pct * 20 - Math.floor(pct * 20)) * 100 : 0;
              return (
                <View key={i} style={{ flex: 1, borderRadius: 3, backgroundColor: colors.surfaceElevated, overflow: 'hidden' }}>
                  {(filled || partial) && (
                    <View style={{ width: filled ? '100%' : `${pp}%`, height: '100%', backgroundColor: color, borderRadius: 3 }} />
                  )}
                </View>
              );
            })}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: Typography.xs, color: colors.textTertiary }}>0</Text>
            <Text style={{ fontSize: Typography.xs, color: colors.textTertiary }}>
              {(targetSteps / 2).toLocaleString()}
            </Text>
            <Text style={{ fontSize: Typography.xs, color: colors.textTertiary }}>
              {targetSteps.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Weekly chart */}
        {history.length > 0 && (
          <View style={{ backgroundColor: colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: colors.surfaceBorder, padding: Spacing.base }}>
            <WeeklyStepsChart history={history} target={targetSteps} colors={colors} />
          </View>
        )}

        {/* Tips */}
        <View style={{ backgroundColor: STEPS_COLOR + '10', borderRadius: Radius.lg, borderWidth: 1, borderColor: STEPS_COLOR + '30', padding: Spacing.base, gap: Spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="lightbulb-outline" size={15} color={STEPS_COLOR} />
            <Text style={{ fontSize: Typography.xs, fontWeight: Typography.bold, color: STEPS_COLOR }}>{t('steps.activityTips')}</Text>
          </View>
          {[t('steps.tip1'), t('steps.tip2'), t('steps.tip3')].map((tip, i) => (
            <Text key={i} style={{ fontSize: Typography.xs, color: colors.textSecondary, lineHeight: 16 }}>· {tip}</Text>
          ))}
        </View>
      </ScrollView>

      <LogStepsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={(s) => logMutation.mutate(s)}
        isLoading={logMutation.isPending}
        currentSteps={steps}
        colors={colors}
      />
    </View>
  );
}

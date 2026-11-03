import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  RefreshControl, I18nManager, Switch, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTranslation } from 'react-i18next';

import { useColors, ColorPalette, Spacing, Typography, Radius, TAB_BAR_PADDING } from '@/theme';
import { nutritionApi } from '@/api/nutrition.api';
import { userApi } from '@/api/user.api';
import { useAuthStore } from '@/store/auth.store';
import {
  loadWaterReminderSettings, enableWaterReminder, disableWaterReminder,
  requestWaterReminderPermission,
} from '@/services/waterReminder';

const WATER_COLOR  = '#06B6D4';
const WATER_FULL   = '#22C55E';

function today() { return new Date().toISOString().split('T')[0]; }

// ─── Big water ring ───────────────────────────────────────────────────────────

function WaterRing({ ml, targetMl, size = 200 }: { ml: number; targetMl: number; size?: number }) {
  const { t } = useTranslation();
  const sw   = 16;
  const r    = (size - sw) / 2;
  const cx   = size / 2;
  const c    = 2 * Math.PI * r;
  const pct  = Math.min(ml / targetMl, 1);
  const off  = c * (1 - pct);
  const isDone = ml >= targetMl;
  const color  = isDone ? WATER_FULL : WATER_COLOR;
  const totalL = (ml / 1000).toFixed(2);
  const targetL = (targetMl / 1000).toFixed(1);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={cx} cy={cx} r={r} stroke={color + '22'} strokeWidth={sw} fill="none" />
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
        <Text style={{ fontSize: 38, fontWeight: Typography.extrabold, color, lineHeight: 42 }}>
          {totalL}<Text style={{ fontSize: 18 }}>L</Text>
        </Text>
        <Text style={{ fontSize: Typography.sm, color: color + '80' }}>
          {t('hydration.ringGoalSuffix', { n: targetL })}
        </Text>
        <Text style={{ fontSize: Typography.xs, color: '#FFFFFF40', marginTop: 2 }}>
          {Math.round(pct * 100)}{t('hydration.ringPct')}
        </Text>
      </View>
    </View>
  );
}

// ─── Quick-add presets ────────────────────────────────────────────────────────

const PRESETS_BASE = [
  { ml: 150,  icon: 'cup',           key: 'presetShot',   emoji: '☕' },
  { ml: 200,  icon: 'cup-outline',   key: 'presetCup',    emoji: '🥤' },
  { ml: 330,  icon: 'bottle-soda',   key: 'presetCan',    emoji: '🥫' },
  { ml: 500,  icon: 'bottle-water',  key: 'presetBottle', emoji: '💧' },
  { ml: 750,  icon: 'bottle-water',  key: 'presetLarge',  emoji: '🧴' },
  { ml: 1000, icon: 'water-outline', key: 'preset1L',     emoji: '🫙' },
];

// ─── Main Screen ──────────────────────────────────────────────────────────────

const REMINDER_INTERVALS = [1, 2, 3, 4];

export default function HydrationScreen() {
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();
  const colors     = useColors();
  const qc         = useQueryClient();
  const { user }   = useAuthStore();
  const uid        = user?.userId ?? 'guest';
  const { data: meData } = useQuery({ queryKey: ['me'], queryFn: userApi.getMe });
  const targetMl = meData?.profile?.targetWaterMl ?? 2500;

  const { t } = useTranslation();
  const PRESETS = PRESETS_BASE.map(p => ({ ...p, label: t(`hydration.${p.key}` as any) }));
  const [customMl, setCustomMl] = useState('');

  const [reminder, setReminder] = useState(() => loadWaterReminderSettings(uid));
  const [reminderBusy, setReminderBusy] = useState(false);

  const toggleReminder = async (value: boolean) => {
    setReminderBusy(true);
    try {
      if (value) {
        const granted = await requestWaterReminderPermission();
        if (!granted) {
          Alert.alert(t('hydration.reminderPermissionTitle'), t('hydration.reminderPermissionMsg'));
          return;
        }
        setReminder(await enableWaterReminder(uid, reminder.intervalHours));
      } else {
        await disableWaterReminder(uid);
        setReminder({ ...reminder, enabled: false, notificationId: undefined });
      }
    } finally {
      setReminderBusy(false);
    }
  };

  const changeReminderInterval = async (hours: number) => {
    if (hours === reminder.intervalHours) return;
    if (!reminder.enabled) {
      setReminder({ ...reminder, intervalHours: hours });
      return;
    }
    setReminderBusy(true);
    try {
      setReminder(await enableWaterReminder(uid, hours));
    } finally {
      setReminderBusy(false);
    }
  };

  const { data: waterMl = 0, isLoading, isRefetching, refetch } = useQuery<number>({
    queryKey: ['water-today'],
    queryFn: () => nutritionApi.getWater(today()),
  });

  const logMutation = useMutation({
    mutationFn: (ml: number) => nutritionApi.logWater(today(), ml),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['water-today'] });
      setCustomMl('');
    },
  });

  const isDone   = waterMl >= targetMl;
  const color    = isDone ? WATER_FULL : WATER_COLOR;
  const remaining = Math.max(targetMl - waterMl, 0);

  // Progress segments (each 250ml)
  const segments = Math.floor(targetMl / 250);
  const filledSegs = Math.floor(waterMl / 250);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}
      contentContainerStyle={{ padding: Spacing.base, gap: Spacing.lg, paddingBottom: TAB_BAR_PADDING }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isLoading || isRefetching} onRefresh={refetch} tintColor={WATER_COLOR} />}
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
          <Text style={{ fontSize: Typography.xl, fontWeight: Typography.bold, color: colors.textPrimary }}>{t('hydration.title')}</Text>
          <Text style={{ fontSize: Typography.sm, color: colors.textTertiary, marginTop: 2 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Main card — ring + status + today's detail, all in one */}
      <View style={{ backgroundColor: colors.surface, borderRadius: Radius.xl, borderWidth: 1, borderColor: colors.surfaceBorder, padding: Spacing.lg, gap: Spacing.lg }}>
        <View style={{ alignItems: 'center', gap: Spacing.lg }}>
          <WaterRing ml={waterMl} targetMl={targetMl} size={200} />

          {isDone ? (
            <View style={{ backgroundColor: WATER_FULL + '15', borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="check-circle" size={14} color={WATER_FULL} />
              <Text style={{ color: WATER_FULL, fontWeight: Typography.semibold, fontSize: Typography.sm }}>{t('hydration.goalReached')}</Text>
            </View>
          ) : (
            <Text style={{ fontSize: Typography.sm, color: colors.textSecondary }}>
              {t('hydration.moreToGoal', { n: (remaining / 1000).toFixed(2) })}
            </Text>
          )}

          {/* Segments strip */}
          <View style={{ flexDirection: 'row', gap: 3, width: '100%' }}>
            {Array.from({ length: segments }).map((_, i) => (
              <View
                key={i}
                style={{
                  flex: 1, height: 8, borderRadius: 4,
                  backgroundColor: i < filledSegs ? color : colors.surfaceElevated,
                }}
              />
            ))}
          </View>
          <Text style={{ fontSize: Typography.xs, color: colors.textTertiary, marginTop: -Spacing.sm }}>
            {t('hydration.segmentLabel')}
          </Text>
        </View>

        <View style={{ height: 1, backgroundColor: colors.surfaceBorder }} />
        <Text style={{ fontSize: Typography.xs, fontWeight: Typography.bold, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
          {t('hydration.todayDetail')}
        </Text>
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          {[
            { label: t('hydration.loggedToday'), value: `${(waterMl / 1000).toFixed(2)}L`,       icon: 'water',         color },
            { label: t('hydration.remaining'),   value: remaining > 0 ? `${(remaining/1000).toFixed(2)}L` : t('hydration.doneBadge'), icon: 'flag-checkered', color: isDone ? WATER_FULL : '#F59E0B' },
            { label: t('hydration.dailyTarget'), value: `${(targetMl / 1000).toFixed(1)}L`,       icon: 'bullseye-arrow', color: colors.textTertiary },
          ].map(s => (
            <View key={s.label} style={{ flex: 1, backgroundColor: colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center', gap: 4 }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: s.color + '20', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={s.icon} size={15} color={s.color} />
              </View>
              <Text style={{ fontSize: Typography.sm, fontWeight: Typography.bold, color: colors.textPrimary }}>{s.value}</Text>
              <Text style={{ fontSize: 10, color: colors.textTertiary, textAlign: 'center' }}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Reminders */}
      <View style={{ backgroundColor: colors.surface, borderRadius: Radius.xl, borderWidth: 1, borderColor: colors.surfaceBorder, padding: Spacing.base, gap: Spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: WATER_COLOR + '20', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="bell-ring-outline" size={15} color={WATER_COLOR} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: Typography.sm, fontWeight: Typography.bold, color: colors.textPrimary }}>
              {t('hydration.remindersTitle')}
            </Text>
            <Text style={{ fontSize: Typography.xs, color: colors.textTertiary, marginTop: 1 }}>
              {reminder.enabled
                ? t('hydration.remindersOnSub', { n: reminder.intervalHours })
                : t('hydration.remindersOffSub')}
            </Text>
          </View>
          <Switch
            value={reminder.enabled}
            onValueChange={toggleReminder}
            disabled={reminderBusy}
            trackColor={{ false: colors.surfaceBorder, true: WATER_COLOR + '80' }}
            thumbColor={reminder.enabled ? WATER_COLOR : colors.textTertiary}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: Spacing.sm, opacity: reminder.enabled ? 1 : 0.4 }}>
          {REMINDER_INTERVALS.map((h) => {
            const selected = h === reminder.intervalHours;
            return (
              <TouchableOpacity
                key={h}
                style={{
                  flex: 1, alignItems: 'center', paddingVertical: Spacing.sm, borderRadius: Radius.md,
                  borderWidth: 1,
                  backgroundColor: selected ? WATER_COLOR + '18' : colors.surfaceElevated,
                  borderColor: selected ? WATER_COLOR + '60' : colors.surfaceBorder,
                }}
                onPress={() => changeReminderInterval(h)}
                disabled={!reminder.enabled || reminderBusy}
              >
                <Text style={{ fontSize: Typography.sm, fontWeight: Typography.bold, color: selected ? WATER_COLOR : colors.textSecondary }}>
                  {t('hydration.reminderEvery', { n: h })}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Quick-add presets */}
      <View style={{ gap: Spacing.sm }}>
        <Text style={{ fontSize: Typography.xs, fontWeight: Typography.bold, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
          {t('hydration.quickAdd')}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
          {PRESETS.map(p => (
            <TouchableOpacity
              key={p.ml}
              style={{
                width: '30%', backgroundColor: colors.surface, borderRadius: Radius.lg,
                borderWidth: 1, borderColor: colors.surfaceBorder,
                padding: Spacing.sm, alignItems: 'center', gap: 4,
                opacity: logMutation.isPending ? 0.6 : 1,
              }}
              onPress={() => logMutation.mutate(p.ml)}
              disabled={logMutation.isPending}
            >
              <Text style={{ fontSize: 24 }}>{p.emoji}</Text>
              <Text style={{ fontSize: Typography.sm, fontWeight: Typography.bold, color: color }}>
                +{p.ml}ml
              </Text>
              <Text style={{ fontSize: Typography.xs, color: colors.textTertiary }}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Custom amount */}
      <View style={{ gap: Spacing.sm }}>
        <Text style={{ fontSize: Typography.xs, fontWeight: Typography.bold, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
          {t('hydration.customAmount')}
        </Text>
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <TextInput
            style={{
              flex: 1, backgroundColor: colors.surface, borderRadius: Radius.lg,
              borderWidth: 1, borderColor: colors.surfaceBorder,
              padding: Spacing.sm, fontSize: Typography.base,
              color: colors.textPrimary,
            }}
            value={customMl}
            onChangeText={setCustomMl}
            placeholder={t('hydration.customPlaceholder')}
            placeholderTextColor={colors.textTertiary}
            keyboardType="number-pad"
          />
          <TouchableOpacity
            style={{
              backgroundColor: color, borderRadius: Radius.lg,
              paddingHorizontal: Spacing.base, justifyContent: 'center', alignItems: 'center',
              opacity: (!customMl || logMutation.isPending) ? 0.4 : 1,
            }}
            onPress={() => {
              const ml = parseInt(customMl, 10);
              if (ml > 0) logMutation.mutate(ml);
            }}
            disabled={!customMl || logMutation.isPending}
          >
            <Icon name="plus" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Hydration tips */}
      <View style={{ backgroundColor: WATER_COLOR + '10', borderRadius: Radius.lg, borderWidth: 1, borderColor: WATER_COLOR + '30', padding: Spacing.base, gap: Spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="lightbulb-outline" size={15} color={WATER_COLOR} />
          <Text style={{ fontSize: Typography.xs, fontWeight: Typography.bold, color: WATER_COLOR }}>{t('hydration.hydrationTips')}</Text>
        </View>
        {[t('hydration.tip1'), t('hydration.tip2'), t('hydration.tip3')].map((tip, i) => (
          <Text key={i} style={{ fontSize: Typography.xs, color: colors.textSecondary, lineHeight: 16 }}>· {tip}</Text>
        ))}
      </View>
    </ScrollView>
  );
}

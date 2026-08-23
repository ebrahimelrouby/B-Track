import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, RefreshControl, Alert, I18nManager } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Rect } from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTranslation } from 'react-i18next';

import { useColors, ColorPalette, Spacing, Typography, Radius, TAB_BAR_PADDING } from '@/theme';
import { healthApi } from '@/api/health.api';
import { DailySleep, SleepLog, SleepLogRequest, SleepQuality } from '@/types';

const SLEEP_COLOR  = '#8B5CF6';
const SLEEP_OUTER  = '#7C3AED';
const SLEEP_LAVEND = '#C4B5FD';

function today() { return new Date().toISOString().split('T')[0]; }

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

function WeeklyChart({ history, colors }: { history: DailySleep[]; colors: ColorPalette }) {
  const { t } = useTranslation();
  const last7 = [...history].slice(0, 7).reverse();
  const maxMins = 600;
  const targetMins = 480;
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  return (
    <View style={{ gap: Spacing.sm }}>
      <Text style={{ fontSize: Typography.xs, fontWeight: Typography.bold, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
        {t('sleep.chartTitle')}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 90 }}>
        {last7.map((d, i) => {
          const pct = d.totalMinutes / maxMins;
          const isTarget = d.totalMinutes >= targetMins;
          const color = isTarget ? SLEEP_COLOR : d.totalMinutes >= 360 ? '#F59E0B' : '#EF4444';
          const barH = Math.max(pct * 80, 4);
          const dow = new Date(d.date + 'T12:00:00').getDay();
          return (
            <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 9, color: colors.textTertiary, marginBottom: 2 }}>
                {d.totalMinutes > 0 ? `${(d.totalMinutes/60).toFixed(1)}` : ''}
              </Text>
              <View style={{ width: '100%', height: barH, backgroundColor: color + '25', borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' }}>
                <View style={{ width: '100%', height: '100%', backgroundColor: color, borderRadius: 4 }} />
              </View>
              <Text style={{ fontSize: 9, color: colors.textTertiary }}>{days[dow]}</Text>
            </View>
          );
        })}
        {/* Target line — drawn as a label only since we can't do absolute positioning easily */}
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
                {last7.filter(d => d.totalMinutes >= 420).length}/7
              </Text>
              <Text style={{ fontSize: Typography.xs, color: colors.textTertiary }}>{t('sleep.chartNights')}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center' }}>
              <Text style={{ fontSize: Typography.base, fontWeight: Typography.bold, color: SLEEP_LAVEND }}>
                {avg >= 480 ? '✓' : `${Math.round(480 - avg)}m`}
              </Text>
              <Text style={{ fontSize: Typography.xs, color: colors.textTertiary }}>{t('sleep.chartDeficit')}</Text>
            </View>
          </View>
        );
      })()}
    </View>
  );
}

// ─── Quality selector ─────────────────────────────────────────────────────────

const QUALITY_OPTIONS_BASE: { value: SleepQuality; icon: string; color: string }[] = [
  { value: 'POOR',      icon: 'emoticon-sad-outline',    color: '#EF4444' },
  { value: 'FAIR',      icon: 'emoticon-neutral-outline', color: '#F59E0B' },
  { value: 'GOOD',      icon: 'emoticon-happy-outline',   color: '#4ADE80' },
  { value: 'EXCELLENT', icon: 'emoticon-excited-outline', color: '#22C55E' },
];

// ─── Log Sleep Modal ─────────────────────────────────────────────────────────

function LogSleepModal({
  visible, onClose, onSubmit, isLoading, colors,
}: {
  visible: boolean; onClose: () => void;
  onSubmit: (req: SleepLogRequest) => void;
  isLoading: boolean; colors: ColorPalette;
}) {
  const { t } = useTranslation();
  const QUALITY_OPTIONS = QUALITY_OPTIONS_BASE.map(q => ({
    ...q,
    label: q.value === 'POOR' ? t('sleep.qualityPoor') : q.value === 'FAIR' ? t('sleep.qualityFair') : q.value === 'GOOD' ? t('sleep.qualityGood') : t('sleep.qualityExcellent'),
  }));
  const [bedHour, setBedHour]   = useState('22');
  const [bedMin, setBedMin]     = useState('30');
  const [wakeHour, setWakeHour] = useState('06');
  const [wakeMin, setWakeMin]   = useState('30');
  const [quality, setQuality]   = useState<SleepQuality>('GOOD');
  const [notes, setNotes]       = useState('');

  function buildISO(hour: string, minute: string, isWake: boolean): string {
    const d = new Date();
    const h = parseInt(hour, 10) || 0;
    const m = parseInt(minute, 10) || 0;
    // if wake hour < bed hour, wake is next day
    if (isWake && h < (parseInt(bedHour, 10) || 0)) {
      d.setDate(d.getDate()); // today
    } else if (!isWake) {
      d.setDate(d.getDate() - 1); // bedtime is yesterday
    }
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  }

  function handleSubmit() {
    const bedtime  = buildISO(bedHour, bedMin, false);
    const wakeTime = buildISO(wakeHour, wakeMin, true);
    const bed  = new Date(bedtime);
    const wake = new Date(wakeTime);
    if (wake <= bed) {
      Alert.alert(t('sleep.invalidTimeTitle'), t('sleep.invalidTimeMsg'));
      return;
    }
    onSubmit({
      date: today(),
      bedtime,
      wakeTime,
      quality,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.lg }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: Typography.lg, fontWeight: Typography.bold, color: colors.textPrimary }}>
            {t('sleep.modalTitle')}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Bedtime */}
        <View style={{ gap: Spacing.sm }}>
          <Text style={{ fontSize: Typography.sm, fontWeight: Typography.semibold, color: colors.textSecondary }}>
            {t('sleep.bedtime')}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <View style={[mStyles.timeBox, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <Icon name="weather-night" size={16} color={SLEEP_COLOR} style={{ marginBottom: 4 }} />
              <TextInput
                style={[mStyles.timeInput, { color: colors.textPrimary }]}
                value={bedHour}
                onChangeText={setBedHour}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="22"
                placeholderTextColor={colors.textTertiary}
              />
              <Text style={{ color: colors.textTertiary, fontSize: Typography.xs }}>{t('sleep.hour')}</Text>
            </View>
            <Text style={{ fontSize: 24, color: colors.textTertiary, fontWeight: Typography.bold }}>:</Text>
            <View style={[mStyles.timeBox, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <Icon name="weather-night" size={16} color={SLEEP_COLOR} style={{ marginBottom: 4, opacity: 0 }} />
              <TextInput
                style={[mStyles.timeInput, { color: colors.textPrimary }]}
                value={bedMin}
                onChangeText={setBedMin}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="30"
                placeholderTextColor={colors.textTertiary}
              />
              <Text style={{ color: colors.textTertiary, fontSize: Typography.xs }}>{t('sleep.min')}</Text>
            </View>
          </View>
        </View>

        {/* Wake time */}
        <View style={{ gap: Spacing.sm }}>
          <Text style={{ fontSize: Typography.sm, fontWeight: Typography.semibold, color: colors.textSecondary }}>
            {t('sleep.wakeTime')}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <View style={[mStyles.timeBox, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <Icon name="weather-sunny" size={16} color="#F59E0B" style={{ marginBottom: 4 }} />
              <TextInput
                style={[mStyles.timeInput, { color: colors.textPrimary }]}
                value={wakeHour}
                onChangeText={setWakeHour}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="06"
                placeholderTextColor={colors.textTertiary}
              />
              <Text style={{ color: colors.textTertiary, fontSize: Typography.xs }}>{t('sleep.hour')}</Text>
            </View>
            <Text style={{ fontSize: 24, color: colors.textTertiary, fontWeight: Typography.bold }}>:</Text>
            <View style={[mStyles.timeBox, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <Icon name="weather-sunny" size={16} color="#F59E0B" style={{ marginBottom: 4, opacity: 0 }} />
              <TextInput
                style={[mStyles.timeInput, { color: colors.textPrimary }]}
                value={wakeMin}
                onChangeText={setWakeMin}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="30"
                placeholderTextColor={colors.textTertiary}
              />
              <Text style={{ color: colors.textTertiary, fontSize: Typography.xs }}>{t('sleep.min')}</Text>
            </View>
          </View>
        </View>

        {/* Quality */}
        <View style={{ gap: Spacing.sm }}>
          <Text style={{ fontSize: Typography.sm, fontWeight: Typography.semibold, color: colors.textSecondary }}>
            {t('sleep.qualityLabel')}
          </Text>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            {QUALITY_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  mStyles.qualBtn,
                  { borderColor: quality === opt.value ? opt.color : colors.surfaceBorder },
                  quality === opt.value && { backgroundColor: opt.color + '15' },
                ]}
                onPress={() => setQuality(opt.value)}
              >
                <Icon name={opt.icon} size={22} color={opt.color} />
                <Text style={{ fontSize: 10, color: quality === opt.value ? opt.color : colors.textTertiary, fontWeight: Typography.medium }}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes */}
        <View style={{ gap: Spacing.sm }}>
          <Text style={{ fontSize: Typography.sm, fontWeight: Typography.semibold, color: colors.textSecondary }}>
            {t('sleep.notes')}
          </Text>
          <TextInput
            style={[mStyles.notesInput, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, color: colors.textPrimary }]}
            value={notes}
            onChangeText={setNotes}
            placeholder={t('sleep.notesPlaceholder')}
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[mStyles.submitBtn, { backgroundColor: SLEEP_COLOR, opacity: isLoading ? 0.6 : 1 }]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Icon name="check" size={18} color="#FFFFFF" />
          <Text style={mStyles.submitText}>{isLoading ? t('sleep.savingBtn') : t('sleep.saveBtn')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </Modal>
  );
}

const mStyles = StyleSheet.create({
  timeBox:    { flex: 1, borderRadius: Radius.md, borderWidth: 1, padding: Spacing.sm, alignItems: 'center', gap: 2 },
  timeInput:  { fontSize: 28, fontWeight: Typography.extrabold, textAlign: 'center', width: '100%' },
  qualBtn:    { flex: 1, borderWidth: 1.5, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center', gap: 4 },
  notesInput: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.sm, fontSize: Typography.sm, minHeight: 80, textAlignVertical: 'top' },
  submitBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.base, borderRadius: Radius.lg },
  submitText: { fontSize: Typography.base, fontWeight: Typography.bold, color: '#FFFFFF' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SleepScreen() {
  const navigation = useNavigation();
  const insets  = useSafeAreaInsets();
  const colors  = useColors();
  const qc      = useQueryClient();
  const { t } = useTranslation();
  const QUALITY_OPTIONS = QUALITY_OPTIONS_BASE.map(q => ({
    ...q,
    label: q.value === 'POOR' ? t('sleep.qualityPoor') : q.value === 'FAIR' ? t('sleep.qualityFair') : q.value === 'GOOD' ? t('sleep.qualityGood') : t('sleep.qualityExcellent'),
  }));
  const [modalVisible, setModalVisible] = useState(false);

  const { data: sleepToday, isLoading, isRefetching, refetch } = useQuery<DailySleep>({
    queryKey: ['sleep-today'],
    queryFn: healthApi.getSleepToday,
  });

  const { data: history = [], refetch: refetchHistory } = useQuery<DailySleep[]>({
    queryKey: ['sleep-history'],
    queryFn: () => healthApi.getSleepHistory(14),
  });

  const logMutation = useMutation({
    mutationFn: healthApi.logSleep,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sleep-today'] });
      qc.invalidateQueries({ queryKey: ['sleep-history'] });
      setModalVisible(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => healthApi.deleteSleepLog(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sleep-today'] });
      qc.invalidateQueries({ queryKey: ['sleep-history'] });
    },
  });

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
            onRefresh={() => { refetch(); refetchHistory(); }}
            tintColor={SLEEP_COLOR}
          />
        }
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingTop: Spacing.sm }}>
          <View>
            <Text style={{ fontSize: Typography.xl, fontWeight: Typography.bold, color: colors.textPrimary }}>{t('sleep.title')}</Text>
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

        {/* Main ring */}
        <View style={{ backgroundColor: colors.surface, borderRadius: Radius.xl, borderWidth: 1, borderColor: colors.surfaceBorder, padding: Spacing.xl, alignItems: 'center', gap: Spacing.lg }}>
          <SleepRing
            size={180}
            minutes={sleepToday?.totalMinutes ?? 0}
            targetMinutes={sleepToday?.targetMinutes ?? 480}
          />
          {sleepToday?.quality && (() => {
            const q = QUALITY_OPTIONS.find(o => o.value === sleepToday.quality);
            return q ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: q.color + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full }}>
                <Icon name={q.icon} size={14} color={q.color} />
                <Text style={{ fontSize: Typography.sm, fontWeight: Typography.semibold, color: q.color }}>
                  {t('sleep.qualitySuffix', { label: q.label })}
                </Text>
              </View>
            ) : null;
          })()}

          {/* Log / edit buttons */}
          {!hasLog ? (
            <TouchableOpacity
              style={{ backgroundColor: SLEEP_COLOR, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.full }}
              onPress={() => setModalVisible(true)}
            >
              <Icon name="plus" size={16} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontWeight: Typography.bold, fontSize: Typography.sm }}>{t('sleep.logSleepBtn')}</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <TouchableOpacity
                style={{ backgroundColor: SLEEP_COLOR + '20', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full }}
                onPress={() => setModalVisible(true)}
              >
                <Icon name="pencil" size={13} color={SLEEP_COLOR} />
                <Text style={{ color: SLEEP_COLOR, fontWeight: Typography.semibold, fontSize: Typography.xs }}>{t('sleep.editBtn')}</Text>
              </TouchableOpacity>
              {log && (
                <TouchableOpacity
                  style={{ backgroundColor: '#EF444420', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full }}
                  onPress={() => {
                    Alert.alert(t('sleep.deleteLogTitle'), t('sleep.deleteLogMsg'), [
                      { text: t('common.cancel'), style: 'cancel' },
                      { text: t('sleep.deleteBtn'), style: 'destructive', onPress: () => deleteMutation.mutate(log.id) },
                    ]);
                  }}
                >
                  <Icon name="trash-can-outline" size={13} color="#EF4444" />
                  <Text style={{ color: '#EF4444', fontWeight: Typography.semibold, fontSize: Typography.xs }}>{t('sleep.deleteBtn')}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Today detail card */}
        {log && (
          <View style={{ backgroundColor: colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: colors.surfaceBorder, padding: Spacing.base, gap: Spacing.base }}>
            <Text style={{ fontSize: Typography.sm, fontWeight: Typography.semibold, color: colors.textPrimary }}>{t('sleep.tonightDetail')}</Text>
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <View style={{ flex: 1, backgroundColor: colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center', gap: 3 }}>
                <Icon name="weather-night" size={18} color={SLEEP_COLOR} />
                <Text style={{ fontSize: Typography.base, fontWeight: Typography.bold, color: colors.textPrimary }}>{formatTime(log.bedtime)}</Text>
                <Text style={{ fontSize: Typography.xs, color: colors.textTertiary }}>{t('sleep.bedtimeLabel')}</Text>
              </View>
              <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                <Icon name="arrow-right" size={18} color={colors.textTertiary} />
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
            {log.notes && (
              <View style={{ backgroundColor: colors.surfaceElevated, borderRadius: Radius.sm, padding: Spacing.sm }}>
                <Text style={{ fontSize: Typography.xs, color: colors.textSecondary, lineHeight: 16 }}>{log.notes}</Text>
              </View>
            )}
          </View>
        )}

        {/* Weekly chart */}
        {history.length > 0 && (
          <View style={{ backgroundColor: colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: colors.surfaceBorder, padding: Spacing.base }}>
            <WeeklyChart history={history} colors={colors} />
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

      <LogSleepModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={(req) => logMutation.mutate(req)}
        isLoading={logMutation.isPending}
        colors={colors}
      />
    </View>
  );
}

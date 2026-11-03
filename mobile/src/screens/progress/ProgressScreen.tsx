import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, TextInput,
  KeyboardAvoidingView, Platform, Share,
  I18nManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { MMKV } from 'react-native-mmkv';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import { useColors, ColorPalette, Spacing, Typography, Radius } from '@/theme';
import PremiumTag from '@/components/common/PremiumTag';
import { WorkoutSession } from '@/types';
import { workoutApi } from '@/api/workout.api';
import { useAuthStore } from '@/store/auth.store';

const storage = new MMKV({ id: 'progress-storage' });
const W = Dimensions.get('window').width;
const CHART_W = W - Spacing.base * 4;
const CHART_H = 120;

interface WeightEntry { date: string; kg: number }

function loadWeightLog(userId: string): WeightEntry[] {
  try { return JSON.parse(storage.getString(`weight:${userId}`) ?? '[]'); } catch { return []; }
}
function saveWeightLog(userId: string, log: WeightEntry[]) {
  storage.set(`weight:${userId}`, JSON.stringify(log.slice(-90)));
}

function MiniChart({ data, colors }: { data: WeightEntry[]; colors: ColorPalette }) {
  const { t } = useTranslation();
  if (data.length < 2) {
    return (
      <View style={[chartStyles.empty, { height: CHART_H }]}>
        <Icon name="chart-line-variant" size={32} color={colors.textTertiary} />
        <Text style={[chartStyles.emptyText, { color: colors.textTertiary }]}>
          {t('progress.chartEmpty')}
        </Text>
      </View>
    );
  }
  const values = data.map(d => d.kg);
  const min = Math.min(...values) - 1;
  const max = Math.max(...values) + 1;
  const range = max - min || 1;
  const pts = data.map((d, i) => ({
    x: (i / (data.length - 1)) * CHART_W,
    y: CHART_H - ((d.kg - min) / range) * CHART_H,
  }));
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const fillPath = `${path} L${pts[pts.length - 1].x},${CHART_H} L0,${CHART_H} Z`;
  const latest = values[values.length - 1];
  const diff   = latest - values[0];
  const isDown = diff <= 0;

  return (
    <View style={chartStyles.wrap}>
      <View style={chartStyles.header}>
        <View>
          <Text style={[chartStyles.label, { color: colors.textPrimary }]}>{t('progress.bodyWeight')}</Text>
          <Text style={[chartStyles.sublabel, { color: colors.textTertiary }]}>{t('progress.entries', { n: data.length })}</Text>
        </View>
        <View style={{ alignItems: I18nManager.isRTL ? 'flex-start' : 'flex-end', gap: 4 }}>
          <Text style={[chartStyles.current, { color: colors.primary }]}>{latest} kg</Text>
          <View style={[chartStyles.badge, {
            backgroundColor: (isDown ? colors.success : colors.warning) + '18',
            borderColor: (isDown ? colors.success : colors.warning) + '40',
          }]}>
            <Icon name={isDown ? 'trending-down' : 'trending-up'} size={12}
              color={isDown ? colors.success : colors.warning} />
            <Text style={[chartStyles.badgeText, { color: isDown ? colors.success : colors.warning }]}>
              {diff > 0 ? '+' : ''}{diff.toFixed(1)} kg
            </Text>
          </View>
        </View>
      </View>
      <View style={{ height: CHART_H + 8 }}>
        <Svg width={CHART_W} height={CHART_H + 8} viewBox={`0 0 ${CHART_W} ${CHART_H + 8}`}>
          <Defs>
            <LinearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.primary} stopOpacity="0.3" />
              <Stop offset="1" stopColor={colors.primary} stopOpacity="0.02" />
            </LinearGradient>
          </Defs>
          <Path d={fillPath} fill="url(#wg)" />
          <Path d={path} stroke={colors.primary} strokeWidth="2.5" fill="none"
            strokeLinecap="round" strokeLinejoin="round" />
          {pts.map((p, i) => i === pts.length - 1 ? (
            <Circle key={i} cx={p.x} cy={p.y} r="5" fill={colors.primary} />
          ) : (
            <Circle key={i} cx={p.x} cy={p.y} r="2.5"
              fill="none" stroke={colors.primary} strokeWidth="1.5" opacity="0.5" />
          ))}
        </Svg>
      </View>
      <View style={chartStyles.footer}>
        <Text style={[chartStyles.footerText, { color: colors.textTertiary }]}>{data[0].date}</Text>
        <Text style={[chartStyles.footerText, { color: colors.textTertiary }]}>{data[data.length - 1].date}</Text>
      </View>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  wrap:       { padding: Spacing.base },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
  label:      { fontSize: Typography.sm, fontWeight: Typography.semibold as any },
  sublabel:   { fontSize: 10, marginTop: 2 },
  badge:      { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  badgeText:  { fontSize: Typography.xs, fontWeight: Typography.semibold as any },
  current:    { fontSize: Typography.lg, fontWeight: Typography.bold as any },
  footer:     { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  footerText: { fontSize: Typography.xs },
  empty:      { alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.sm },
  emptyText:  { fontSize: Typography.sm, textAlign: 'center', lineHeight: 18 },
});

export default function ProgressScreen() {
  const insets     = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user }   = useAuthStore();
  const colors     = useColors();
  const styles     = React.useMemo(() => getStyles(colors), [colors]);
  const { t }      = useTranslation();
  const uid        = user?.userId ?? 'guest';

  const [weightLog, setWeightLog] = useState<WeightEntry[]>(() => loadWeightLog(uid));
  const [inputKg, setInputKg]     = useState('');

  const { data: history } = useQuery({
    queryKey: ['workout-history-progress'],
    queryFn:  () => workoutApi.getHistory(0, 100),
  });

  const sessions: WorkoutSession[] = history?.content ?? [];
  const totalSessions   = sessions.length;
  const totalVolumeKg   = sessions.reduce((s, sess) => s + (sess.totalVolumeKg ?? 0), 0);
  const avgDuration     = sessions.length > 0
    ? Math.round(sessions.reduce((s, sess) => s + (sess.durationSeconds ?? 0), 0) / sessions.length / 60)
    : 0;
  const thisWeekCount   = sessions.filter(s => {
    const d = new Date(s.startedAt);
    return new Date().getTime() - d.getTime() < 7 * 86400000;
  }).length;

  const logWeight = () => {
    const kg = parseFloat(inputKg);
    if (!inputKg || isNaN(kg) || kg < 20 || kg > 300) return;
    const today   = new Date().toISOString().split('T')[0];
    const updated = [...weightLog.filter(e => e.date !== today), { date: today, kg }]
      .sort((a, b) => a.date.localeCompare(b.date));
    setWeightLog(updated);
    saveWeightLog(uid, updated);
    setInputKg('');
  };

  const handleShare = async () => {
    const weightChange = weightLog.length >= 2
      ? weightLog[weightLog.length - 1].kg - weightLog[0].kg
      : null;

    const lines = [
      t('progress.shareTitle'),
      t('progress.shareSessions', { n: totalSessions }),
      totalVolumeKg > 0 ? t('progress.shareVolume', { t: (totalVolumeKg / 1000).toFixed(1) }) : null,
      avgDuration > 0 ? t('progress.shareAvgDuration', { n: avgDuration }) : null,
      weightChange !== null
        ? t('progress.shareWeightChange', {
            n: Math.abs(weightChange).toFixed(1),
            dir: weightChange <= 0 ? t('progress.shareWeightDown') : t('progress.shareWeightUp'),
          })
        : null,
    ].filter(Boolean).join('\n');

    try {
      await Share.share({ message: lines });
    } catch {
      // user cancelled or share sheet failed to open — nothing to recover
    }
  };

  const STAT_CARDS = [
    { icon: 'dumbbell',      label: t('progress.statTotalSessions'), value: String(totalSessions),       color: colors.primary  },
    { icon: 'weight',        label: t('progress.statTotalVolume'),   value: totalVolumeKg > 0 ? `${(totalVolumeKg / 1000).toFixed(1)}t` : '—', color: colors.warning },
    { icon: 'clock-outline', label: t('progress.statAvgDuration'),   value: avgDuration > 0 ? `${avgDuration}m` : '—',               color: colors.info    },
    { icon: 'calendar-week', label: t('progress.statThisWeek'),      value: String(thisWeekCount),        color: '#A78BFA'       },
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, paddingTop: insets.top, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={styles.screenHeader}>
        {/* Row 1: title + icon */}
        <View style={styles.headerTitleRow}>
          <View>
            <Text style={styles.screenTitle}>{t('progress.title')}</Text>
            <Text style={styles.screenSubtitle}>{t('progress.subtitle')}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <PremiumTag />
            <TouchableOpacity
              style={[styles.headerIconBtn, { backgroundColor: colors.surfaceElevated }]}
              onPress={handleShare}
              activeOpacity={0.75}
            >
              <Icon name="share-variant-outline" size={19} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Row 2: Full-width AI body fat banner */}
        <TouchableOpacity
          style={[styles.aiBanner, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('AiStack', { screen: 'AiBodyFatConsent' })}
          activeOpacity={0.85}
        >
          <View style={styles.aiBannerIconBox}>
            <Icon name="brain" size={22} color="#000" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.aiBannerTitle}>{t('progress.aiBannerTitle')}</Text>
            <Text style={styles.aiBannerSub}>{t('progress.aiBannerSub')}</Text>
          </View>
          <View style={styles.aiBannerArrow}>
            <Icon name={I18nManager.isRTL ? 'arrow-left' : 'arrow-right'} size={16} color="#000" />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.root}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing['2xl'] }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Stat grid ───────────────────────────────────────────────── */}
        <View style={styles.grid}>
          {STAT_CARDS.map(s => (
            <View key={s.label} style={[styles.statCard, { borderColor: s.color + '30' }]}>
              <View style={[styles.statIconBox, { backgroundColor: s.color + '18' }]}>
                <Icon name={s.icon} size={20} color={s.color} />
              </View>
              <Text style={[styles.statVal, { color: s.value === '—' ? colors.textTertiary : s.color }]}>
                {s.value}
              </Text>
              <Text style={styles.statLbl}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Weight tracker ──────────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Icon name="scale-bathroom" size={16} color={colors.primary} />
          <Text style={styles.sectionTitle}>{t('progress.weightTracker')}</Text>
        </View>
        <View style={styles.card}>
          <MiniChart data={weightLog} colors={colors} />
          <View style={[styles.logRow, { borderTopColor: colors.surfaceBorder }]}>
            <TextInput
              style={[styles.weightInput, { borderColor: colors.surfaceBorder, color: colors.textPrimary, backgroundColor: colors.surfaceElevated }]}
              value={inputKg}
              onChangeText={setInputKg}
              placeholder={t('progress.weightPlaceholder')}
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
              returnKeyType="done"
              onSubmitEditing={logWeight}
            />
            <TouchableOpacity style={[styles.logBtn, { backgroundColor: colors.primary }]} onPress={logWeight}>
              <Icon name="plus" size={18} color={colors.textInverse} />
              <Text style={styles.logBtnText}>{t('progress.logBtn')}</Text>
            </TouchableOpacity>
          </View>
          {weightLog.length > 0 && (
            <View style={[styles.lastEntry, { borderTopColor: colors.surfaceBorder }]}>
              <View style={[styles.lastEntryDot, { backgroundColor: colors.primary }]} />
              <Text style={styles.lastEntryText}>
                {t('progress.lastLogged', { kg: weightLog[weightLog.length - 1].kg, date: weightLog[weightLog.length - 1].date })}
              </Text>
            </View>
          )}
        </View>

        {/* ── Recent sessions ─────────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Icon name="history" size={16} color={colors.primary} />
          <Text style={styles.sectionTitle}>{t('progress.recentSessions')}</Text>
        </View>
        {sessions.length === 0 ? (
          <View style={[styles.emptyCard, { borderColor: colors.surfaceBorder }]}>
            <View style={[styles.emptyIconBox, { backgroundColor: colors.primaryDim }]}>
              <Icon name="dumbbell" size={28} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>{t('progress.noSessionsTitle')}</Text>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              {t('progress.noSessionsDesc')}
            </Text>
          </View>
        ) : (
          <View style={[styles.card, { overflow: 'hidden' }]}>
            {sessions.slice(0, 5).map((s, i) => (
              <View key={s.id} style={[styles.sessionRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.surfaceBorder }]}>
                <View style={[styles.sessionIconBox, { backgroundColor: colors.primaryDim }]}>
                  <Icon name="dumbbell" size={14} color={colors.primary} />
                </View>
                <View style={styles.sessionLeft}>
                  <Text style={styles.sessionName} numberOfLines={1}>{s.name}</Text>
                  <Text style={styles.sessionDate}>
                    {new Date(s.startedAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </Text>
                </View>
                <View style={styles.sessionRight}>
                  {s.totalVolumeKg ? (
                    <View style={[styles.sessionChip, { backgroundColor: colors.primaryDim }]}>
                      <Text style={[styles.sessionChipText, { color: colors.primary }]}>{s.totalVolumeKg}kg</Text>
                    </View>
                  ) : null}
                  {s.durationSeconds ? (
                    <View style={[styles.sessionChip, { backgroundColor: colors.surfaceElevated }]}>
                      <Text style={[styles.sessionChipText, { color: colors.textSecondary }]}>
                        {Math.round(s.durationSeconds / 60)}m
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── Weight history ──────────────────────────────────────────── */}
        {weightLog.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Icon name="format-list-bulleted" size={16} color={colors.primary} />
              <Text style={styles.sectionTitle}>{t('progress.weightHistory')}</Text>
            </View>
            <View style={[styles.card, { overflow: 'hidden' }]}>
              {[...weightLog].reverse().slice(0, 10).map((e, i) => {
                const prev = [...weightLog].reverse()[i + 1];
                const diff = prev ? e.kg - prev.kg : 0;
                return (
                  <View key={e.date} style={[styles.sessionRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.surfaceBorder }]}>
                    <Text style={styles.sessionDate}>{e.date}</Text>
                    <Text style={styles.sessionName}>{e.kg} kg</Text>
                    {prev && (
                      <View style={[styles.sessionChip, {
                        backgroundColor: diff <= 0 ? colors.success + '18' : colors.warning + '18',
                      }]}>
                        <Text style={[styles.sessionChipText, {
                          color: diff <= 0 ? colors.success : colors.warning,
                        }]}>
                          {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function getStyles(c: ColorPalette) {
  return StyleSheet.create({
    root:   { flex: 1, backgroundColor: c.background },
    scroll: { padding: Spacing.base, gap: Spacing.md },

    // ── Header ──────────────────────────────────────────────────────────
    screenHeader: {
      paddingHorizontal: Spacing.base, paddingTop: Spacing.sm, paddingBottom: Spacing.base,
      borderBottomWidth: 1, borderBottomColor: c.surfaceBorder,
      gap: Spacing.md,
    },
    headerTitleRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    screenTitle:    { fontSize: Typography.xl, fontWeight: Typography.bold, color: c.textPrimary },
    screenSubtitle: { fontSize: Typography.sm, color: c.textTertiary, marginTop: 2 },
    headerIconBtn: {
      width: 38, height: 38, borderRadius: 19,
      alignItems: 'center', justifyContent: 'center',
    },

    // AI banner
    aiBanner: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
      borderRadius: Radius.lg, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
      shadowColor: c.primary, shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4, shadowRadius: 14, elevation: 8,
    },
    aiBannerIconBox: {
      width: 44, height: 44, borderRadius: 13,
      backgroundColor: '#00000018', alignItems: 'center', justifyContent: 'center',
    },
    aiBannerTitle: { fontSize: Typography.base, fontWeight: Typography.bold, color: '#000' },
    aiBannerSub:   { fontSize: 11, color: '#00000099', marginTop: 2 },
    aiBannerArrow: {
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: '#FFFFFF22', alignItems: 'center', justifyContent: 'center',
    },

    // ── Stat grid ───────────────────────────────────────────────────────
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    statCard: {
      flex: 1, minWidth: '45%',
      backgroundColor: c.surface, borderRadius: Radius.lg,
      borderWidth: 1, padding: Spacing.base,
      alignItems: 'center', gap: 5,
    },
    statIconBox: {
      width: 44, height: 44, borderRadius: 13,
      alignItems: 'center', justifyContent: 'center',
    },
    statVal: { fontSize: Typography.xl, fontWeight: Typography.bold, marginTop: 2 },
    statLbl: { fontSize: Typography.xs, color: c.textTertiary, textAlign: 'center' },

    // ── Section headers ─────────────────────────────────────────────────
    sectionHeader: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      marginTop: Spacing.xs,
    },
    sectionTitle: {
      fontSize: Typography.sm, fontWeight: Typography.bold, color: c.textPrimary,
    },

    // ── Cards ───────────────────────────────────────────────────────────
    card: {
      backgroundColor: c.surface, borderRadius: Radius.lg,
      borderWidth: 1, borderColor: c.surfaceBorder,
    },

    // Weight log row
    logRow: {
      flexDirection: 'row', gap: Spacing.sm,
      paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
      borderTopWidth: 1,
    },
    weightInput: {
      flex: 1, borderRadius: Radius.md, borderWidth: 1,
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
      fontSize: Typography.base,
    },
    logBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      borderRadius: Radius.md, paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
    },
    logBtnText: { fontSize: Typography.sm, fontWeight: Typography.bold, color: c.textInverse },
    lastEntry: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
      borderTopWidth: 1,
    },
    lastEntryDot:  { width: 6, height: 6, borderRadius: 3 },
    lastEntryText: { fontSize: Typography.xs, color: c.textTertiary },

    // Sessions
    sessionRow: {
      flexDirection: 'row', alignItems: 'center',
      padding: Spacing.base, gap: Spacing.sm,
    },
    sessionIconBox: {
      width: 32, height: 32, borderRadius: 9,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    sessionLeft:  { flex: 1 },
    sessionRight: { flexDirection: 'row', gap: 5, flexShrink: 0 },
    sessionName:  { fontSize: Typography.sm, fontWeight: Typography.medium, color: c.textPrimary },
    sessionDate:  { fontSize: Typography.xs, color: c.textTertiary, marginTop: 2 },
    sessionChip: {
      paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8,
    },
    sessionChipText: { fontSize: Typography.xs, fontWeight: Typography.semibold },

    // Empty state
    emptyCard: {
      backgroundColor: c.surface, borderRadius: Radius.lg, borderWidth: 1,
      alignItems: 'center', padding: Spacing['2xl'], gap: Spacing.md,
    },
    emptyIconBox: {
      width: 60, height: 60, borderRadius: 18,
      alignItems: 'center', justifyContent: 'center',
    },
    emptyTitle: { fontSize: Typography.base, fontWeight: Typography.bold },
    emptyText:  { fontSize: Typography.sm, textAlign: 'center', lineHeight: 20 },
  });
}

import React from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Line, Rect, Text as SvgText } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { useColors, ColorPalette, Spacing, Typography, Radius, TAB_BAR_PADDING } from '@/theme';
import { workoutApi } from '@/api/workout.api';
import { WorkoutSession, PagedResponse } from '@/types';
import { hrZone } from '@/utils/heartRateZone';

const HR_COLOR  = '#EF4444';
const CAL_COLOR = '#F97316';

// ─── Heart rate trend — smooth line + gradient-fill area, since a line reads
// as a trend across workouts much better than discrete bars do. ───────────────

function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function HeartRateLineChart({ sessions, color, colors }: {
  sessions: WorkoutSession[];
  color: string;
  colors: ColorPalette;
}) {
  const values = sessions.map((s) => s.avgHeartRate!);
  const W = 320, H = 150, padX = 14, padY = 18;
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;
  const avgV = values.reduce((a, b) => a + b, 0) / values.length;

  const n = values.length;
  const x = (i: number) => n > 1 ? padX + (i * (W - padX * 2)) / (n - 1) : W / 2;
  const y = (v: number) => H - padY - ((v - minV) / range) * (H - padY * 2);
  const points = values.map((v, i) => ({ x: x(i), y: y(v), v, session: sessions[i] }));
  const peakIdx = values.indexOf(maxV);
  const avgY = y(avgV);

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
  const areaPath = n > 1
    ? `${linePath} L ${points[n - 1].x},${H - padY} L ${points[0].x},${H - padY} Z`
    : '';

  return (
    <View>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="hrFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={0.35} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        {/* Baseline */}
        <Line x1={padX} y1={H - padY} x2={W - padX} y2={H - padY} stroke={colors.surfaceBorder} strokeWidth={1} />
        {/* Average reference line */}
        <Line x1={padX} y1={avgY} x2={W - padX} y2={avgY} stroke={colors.textTertiary} strokeWidth={1} strokeDasharray="4,4" />
        {n > 1 && <Path d={areaPath} fill="url(#hrFill)" />}
        {n > 1 && <Path d={linePath} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
        {points.map((p, i) => (
          <Circle
            key={i}
            cx={p.x} cy={p.y}
            r={i === peakIdx ? 5 : 3}
            fill={i === peakIdx ? color : colors.background}
            stroke={color}
            strokeWidth={i === peakIdx ? 0 : 2}
          />
        ))}
      </Svg>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2, marginTop: 2 }}>
        <Text style={{ fontSize: 9, color: colors.textTertiary }}>{Math.round(minV)} bpm</Text>
        <Text style={{ fontSize: 9, color: colors.textTertiary }}>avg {Math.round(avgV)} bpm</Text>
        <Text style={{ fontSize: 9, color, fontWeight: Typography.bold }}>{Math.round(maxV)} bpm peak</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2, marginTop: 6 }}>
        {sessions.map((s, i) => (
          <Text
            key={s.id}
            style={{
              fontSize: 9, color: i === peakIdx ? color : colors.textTertiary,
              fontWeight: i === peakIdx ? Typography.bold : Typography.regular,
              flex: 1, textAlign: i === 0 ? 'left' : i === sessions.length - 1 ? 'right' : 'center',
            }}
          >
            {shortDate(s.startedAt)}
          </Text>
        ))}
      </View>
    </View>
  );
}

// ─── Calories burned — gradient bar chart ─────────────────────────────────────

function CaloriesBarChart({ sessions, color, colors }: {
  sessions: WorkoutSession[];
  color: string;
  colors: ColorPalette;
}) {
  const values  = sessions.map((s) => s.activeCalories ?? 0);
  const maxVal  = Math.max(...values, 1);
  const avgVal  = values.reduce((a, b) => a + b, 0) / values.length;
  const bestIdx = values.indexOf(maxVal);

  const W = 320, H = 120, padX = 10, padTop = 22, padBottom = 2;
  const usableH = H - padTop - padBottom;
  const n = sessions.length;
  const gap = 6;
  const barW = Math.max((W - padX * 2 - gap * (n - 1)) / n, 4);
  const avgY = H - padBottom - (maxVal > 0 ? (avgVal / maxVal) * usableH : 0);

  const bars = sessions.map((s, i) => {
    const v    = values[i];
    const pct  = maxVal > 0 ? v / maxVal : 0;
    const barH = Math.max(pct * usableH, 4);
    const x    = padX + i * (barW + gap);
    const yTop = H - padBottom - barH;
    const cx   = x + barW / 2;
    return { id: s.id, x, yTop, barH, cx, isBest: i === bestIdx, value: v };
  });

  return (
    <View>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="calFillPeak" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={0.65} />
            <Stop offset="1" stopColor={color} stopOpacity={1} />
          </LinearGradient>
          <LinearGradient id="calFillMuted" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={0.18} />
            <Stop offset="1" stopColor={color} stopOpacity={0.4} />
          </LinearGradient>
        </Defs>

        {/* Average reference line — SVG dashed line, since Fabric doesn't
            support dashed/dotted View border styles. */}
        <Line x1={padX} y1={avgY} x2={W - padX} y2={avgY} stroke={colors.textTertiary} strokeWidth={1} strokeDasharray="4,2" />
        <SvgText x={padX} y={avgY - 4} fontSize={8} fill={colors.textTertiary}>avg</SvgText>

        {bars.map((b) => (
          <Rect
            key={b.id}
            x={b.x} y={b.yTop} width={barW} height={b.barH} rx={6}
            fill={b.isBest ? 'url(#calFillPeak)' : 'url(#calFillMuted)'}
            stroke={b.isBest ? color : 'none'}
            strokeWidth={b.isBest ? 1.5 : 0}
          />
        ))}

        {bars.map((b) => (
          <SvgText
            key={b.id}
            x={b.cx} y={b.yTop - 7}
            fontSize={10} fontWeight={b.isBest ? 'bold' : '500'}
            fill={b.isBest ? color : colors.textTertiary}
            textAnchor="middle"
          >
            {Math.round(b.value)}
          </SvgText>
        ))}
      </Svg>

      <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
        {sessions.map((s) => (
          <Text key={s.id} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: colors.textTertiary }}>
            {shortDate(s.startedAt)}
          </Text>
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <Icon name="fire" size={10} color={color} />
          <Text style={{ fontSize: 9, color, fontWeight: Typography.bold }}>{Math.round(maxVal)} kcal best</Text>
        </View>
      </View>
    </View>
  );
}

function SummaryStat({ icon, title, meta, count, value, unit, color, colors, delta, zoneBpm }: {
  icon: string; title: string; meta?: string; count?: string;
  value: string; unit: string; color: string; colors: ColorPalette; delta?: number; zoneBpm?: number;
}) {
  const zone = zoneBpm != null ? hrZone(zoneBpm) : undefined;
  return (
    <View style={{
      flex: 1, backgroundColor: color + '14', borderRadius: Radius.xl,
      borderWidth: 1, borderColor: color + '35', paddingVertical: Spacing.md, paddingHorizontal: Spacing.xs,
      alignItems: 'center', gap: 5,
    }}>
      <View style={{
        width: 30, height: 30, borderRadius: 15, backgroundColor: color + '22',
        borderWidth: 1, borderColor: color + '40', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={icon} size={15} color={color} />
      </View>

      <Text style={{
        fontSize: 10, fontWeight: Typography.semibold, color: color + 'DD', textAlign: 'center',
        textTransform: 'uppercase', letterSpacing: 0.4,
      }} numberOfLines={1}>
        {title}
      </Text>

      <Text style={{ fontSize: Typography.xl, fontWeight: Typography.extrabold, color, lineHeight: Typography.xl + 2 }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
        {value}<Text style={{ fontSize: Typography.xs, fontWeight: Typography.medium, color: colors.textTertiary }}> {unit}</Text>
      </Text>

      {zone != null && (
        <View style={{
          minWidth: 58, alignItems: 'center', backgroundColor: zone.color + '1E',
          borderWidth: 1, borderColor: zone.color + '50',
          borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2,
        }}>
          <Text style={{ fontSize: 10, fontWeight: Typography.bold, color: zone.color }}>{zone.label}</Text>
        </View>
      )}

      {delta != null && delta !== 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <Icon name={delta > 0 ? 'arrow-up-bold' : 'arrow-down-bold'} size={10} color={colors.textTertiary} />
          <Text style={{ fontSize: 9, color: colors.textTertiary }}>{Math.abs(delta)} vs last</Text>
        </View>
      )}

      <View style={{ alignItems: 'center', gap: 1, marginTop: 1 }}>
        {meta != null && (
          <Text style={{ fontSize: 10, fontWeight: Typography.semibold, color, textAlign: 'center' }} numberOfLines={2}>
            {meta}
          </Text>
        )}
        {count != null && (
          <Text style={{ fontSize: 9, color: colors.textTertiary, textAlign: 'center' }} numberOfLines={1}>{count}</Text>
        )}
      </View>
    </View>
  );
}

// ─── Per-session detail row ────────────────────────────────────────────────────

function SessionRow({ session, colors }: { session: WorkoutSession; colors: ColorPalette }) {
  const date = new Date(session.startedAt);
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder,
    }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: Typography.sm, fontWeight: Typography.semibold, color: colors.textPrimary }} numberOfLines={1}>
          {session.name}
        </Text>
        <Text style={{ fontSize: Typography.xs, color: colors.textTertiary, marginTop: 1 }}>{dateStr}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
        <Icon name="heart-pulse" size={12} color={HR_COLOR} />
        <Text style={{ fontSize: Typography.xs, fontWeight: Typography.semibold, color: HR_COLOR }}>
          {session.avgHeartRate}{session.maxHeartRate ? ` / ${session.maxHeartRate}` : ''}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, minWidth: 54, justifyContent: 'flex-end' }}>
        <Icon name="fire" size={12} color={CAL_COLOR} />
        <Text style={{ fontSize: Typography.xs, fontWeight: Typography.semibold, color: CAL_COLOR }}>
          {session.activeCalories != null ? Math.round(session.activeCalories) : '—'}
        </Text>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function WorkoutVitalsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const { t } = useTranslation();

  const { data, isLoading } = useQuery<PagedResponse<WorkoutSession>>({
    queryKey: ['workout-history-vitals'],
    queryFn: () => workoutApi.getHistory(0, 50),
  });

  // Only sessions finished from the Watch carry HR data — see
  // WorkoutVitalsScreen's empty-state copy for why others are excluded.
  const content: WorkoutSession[] = data?.content ?? [];
  const sessions = content
    .filter((s) => s.avgHeartRate != null)
    .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime())
    .slice(-12);

  if (isLoading) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (sessions.length === 0) {
    return (
      <View style={[styles.root, styles.emptyRoot]}>
        <View style={styles.emptyIconWrap}>
          <Icon name="heart-pulse" size={40} color={HR_COLOR} />
        </View>
        <Text style={styles.emptyTitle}>{t('workoutVitals.emptyTitle')}</Text>
        <Text style={styles.emptyBody}>{t('workoutVitals.emptyBody')}</Text>
      </View>
    );
  }

  const avgHRs      = sessions.map((s) => s.avgHeartRate!);
  const maxHRs      = sessions.map((s) => s.maxHeartRate ?? s.avgHeartRate!);
  const avgOfAvg    = Math.round(avgHRs.reduce((a, b) => a + b, 0) / avgHRs.length);
  const peakHR      = Math.max(...maxHRs);
  const peakSession = sessions[maxHRs.indexOf(peakHR)];
  const totalCals   = sessions.reduce((sum, s) => sum + (s.activeCalories ?? 0), 0);
  const avgCalsPerWorkout = Math.round(totalCals / sessions.length);
  const hrDelta     = avgHRs.length > 1 ? avgHRs[avgHRs.length - 1] - avgHRs[avgHRs.length - 2] : undefined;
  const pctOfPeak   = Math.round((avgOfAvg / peakHR) * 100);
  const recent      = [...sessions].reverse(); // newest first for the list

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + TAB_BAR_PADDING }]}
    >
      <View>
        <Text style={styles.sectionTitle}>{t('workoutVitals.overviewTitle')}</Text>
        <Text style={styles.chartSubtitle}>{t('workoutVitals.chartSubtitle', { n: sessions.length })}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        <SummaryStat
          icon="heart-pulse" color={HR_COLOR} colors={colors}
          title={t('workoutVitals.avgHrTitle')}
          meta={t('workoutVitals.avgHrMeta', { pct: pctOfPeak })}
          value={`${avgOfAvg}`} unit="bpm" delta={hrDelta} zoneBpm={avgOfAvg}
        />
        <SummaryStat
          icon="heart-flash" color={HR_COLOR} colors={colors}
          title={t('workoutVitals.peakHrTitle')}
          meta={`${peakSession.name} · ${shortDate(peakSession.startedAt)}`}
          value={`${peakHR}`} unit="bpm" zoneBpm={peakHR}
        />
        <SummaryStat
          icon="fire" color={CAL_COLOR} colors={colors}
          title={t('workoutVitals.totalCaloriesTitle')}
          meta={t('workoutVitals.totalCaloriesMeta', { n: avgCalsPerWorkout })}
          count={t('workoutVitals.totalCaloriesCount', { n: sessions.length })}
          value={`${Math.round(totalCals)}`} unit="kcal"
        />
      </View>

      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View style={[styles.chartIconWrap, { backgroundColor: HR_COLOR + '22' }]}>
            <Icon name="heart-pulse" size={13} color={HR_COLOR} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.chartTitle}>{t('workoutVitals.hrChartTitle')}</Text>
            <Text style={styles.chartSubtitle}>{t('workoutVitals.hrChartSubtitle')}</Text>
          </View>
        </View>
        <HeartRateLineChart sessions={sessions} color={HR_COLOR} colors={colors} />
      </View>

      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View style={[styles.chartIconWrap, { backgroundColor: CAL_COLOR + '22' }]}>
            <Icon name="fire" size={13} color={CAL_COLOR} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.chartTitle}>{t('workoutVitals.calChartTitle')}</Text>
            <Text style={styles.chartSubtitle}>{t('workoutVitals.calChartSubtitle')}</Text>
          </View>
        </View>
        <CaloriesBarChart sessions={sessions} color={CAL_COLOR} colors={colors} />
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>{t('workoutVitals.recentSessions')}</Text>
        <Text style={styles.chartSubtitle}>{t('workoutVitals.recentSessionsSubtitle')}</Text>
        <View style={{ marginTop: Spacing.xs }}>
          {recent.map((s) => <SessionRow key={s.id} session={s} colors={colors} />)}
        </View>
      </View>
    </ScrollView>
  );
}

function getStyles(c: ColorPalette) {
  return {
    root: { flex: 1, backgroundColor: c.background },
    scroll: { padding: Spacing.base, gap: Spacing.lg },
    emptyRoot: { alignItems: 'center' as const, justifyContent: 'center' as const, padding: Spacing['2xl'], gap: Spacing.base },
    emptyIconWrap: {
      width: 76, height: 76, borderRadius: 38,
      backgroundColor: HR_COLOR + '15', alignItems: 'center' as const, justifyContent: 'center' as const,
    },
    emptyTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: c.textPrimary, textAlign: 'center' as const },
    emptyBody: { fontSize: Typography.sm, color: c.textTertiary, textAlign: 'center' as const, lineHeight: 20 },
    chartCard: {
      backgroundColor: c.surface, borderRadius: Radius.lg,
      borderWidth: 1, borderColor: c.surfaceBorder,
      padding: Spacing.base, gap: Spacing.md,
    },
    chartHeader: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 },
    chartIconWrap: {
      width: 22, height: 22, borderRadius: 11,
      alignItems: 'center' as const, justifyContent: 'center' as const,
    },
    chartTitle: {
      fontSize: Typography.xs, fontWeight: Typography.bold, color: c.textTertiary,
      textTransform: 'uppercase' as const, letterSpacing: 0.8,
    },
    chartSubtitle: { fontSize: 10, color: c.textTertiary, marginTop: 1 },
    sectionTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: c.textPrimary },
  };
}

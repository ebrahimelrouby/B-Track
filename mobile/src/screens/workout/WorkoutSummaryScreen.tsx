import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

import { useColors, ColorPalette, Spacing, Typography, Radius, TAB_BAR_PADDING } from '@/theme';
import Button from '@/components/common/Button';
import ExerciseBreakdown from '@/components/workout/ExerciseBreakdown';
import { hrZone } from '@/utils/heartRateZone';
import { WorkoutStackParamList } from '@/navigation/types';
import { workoutApi } from '@/api/workout.api';
import { WorkoutSession } from '@/types';

type RouteProps = RouteProp<WorkoutStackParamList, 'WorkoutSummary'>;

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function WorkoutSummaryScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { params } = useRoute<RouteProps>();
  const colors = useColors();
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const { t } = useTranslation();

  // Full per-exercise/set breakdown isn't in the navigation params (only
  // aggregate totals are), so fetch the synced session once we have an id —
  // gives this screen the exact same "whole session" detail as History.
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(!!params.sessionId);

  useEffect(() => {
    if (!params.sessionId) { setLoadingSession(false); return; }
    let cancelled = false;
    workoutApi.getHistory(0, 50).then((res) => {
      if (cancelled) return;
      setSession(res.content.find((s) => s.id === params.sessionId) ?? null);
    }).finally(() => { if (!cancelled) setLoadingSession(false); });
    return () => { cancelled = true; };
  }, [params.sessionId]);

  const zone = params.avgHeartRate != null ? hrZone(params.avgHeartRate) : undefined;

  const stats = [
    { icon: 'clock-outline',    label: t('workoutSummary.duration'),  value: formatDuration(params.durationSeconds) },
    { icon: 'weight-lifter',    label: t('workoutSummary.volume'),    value: `${params.totalVolumeKg}kg` },
    { icon: 'dumbbell',         label: t('workoutSummary.sets'),      value: String(params.totalSets) },
    { icon: 'arm-flex-outline', label: t('workoutSummary.exercises'), value: String(params.exerciseCount) },
    // Only present when the workout was finished from the Apple Watch
    ...(params.avgHeartRate != null
      ? [{ icon: 'heart-pulse', label: t('workoutSummary.avgHeartRate'), value: `${params.avgHeartRate} bpm`, badge: zone }]
      : []),
    ...(params.maxHeartRate != null
      ? [{ icon: 'heart-flash', label: t('workoutSummary.peakHeartRate'), value: `${params.maxHeartRate} bpm` }]
      : []),
    ...(params.activeCalories != null
      ? [{ icon: 'fire', label: t('workoutSummary.activeCalories'), value: `${Math.round(params.activeCalories)} kcal` }]
      : []),
  ];

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing['2xl'] }]}
    >
      <View style={styles.hero}>
        <View style={styles.trophyCircle}>
          <Icon name="trophy" size={52} color={colors.primary} />
        </View>
        <Text style={styles.title}>{t('workoutSummary.title')}</Text>
        <Text style={styles.workoutName}>{params.name}</Text>
        <Text style={styles.subtitle}>{t('workoutSummary.subtitle')}</Text>
      </View>

      <View style={styles.grid}>
        {stats.map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Icon name={s.icon} size={22} color={colors.primary} />
            <Text style={styles.statValue}>{s.value}</Text>
            {s.badge != null && (
              <View style={{ backgroundColor: s.badge.color + '22', borderRadius: Radius.full, paddingHorizontal: 7, paddingVertical: 1 }}>
                <Text style={{ fontSize: 10, fontWeight: Typography.bold, color: s.badge.color }}>{s.badge.label}</Text>
              </View>
            )}
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <Button
        title={t('workoutSummary.backToHome')}
        onPress={() => {
          // Reset Workout stack to root so re-visiting the tab shows WorkoutPlans
          navigation.dispatch(CommonActions.reset({
            index: 0,
            routes: [{ name: 'WorkoutPlans' }],
          }));
          // Switch to Dashboard tab
          navigation.getParent()?.navigate('Dashboard');
        }}
        fullWidth
        style={styles.primaryBtn}
      />
      {params.sessionId ? (
        <Button
          title={t('workoutSummary.viewSession')}
          variant="secondary"
          onPress={() => navigation.navigate('WorkoutHistory')}
          fullWidth
          style={styles.secondaryBtn}
        />
      ) : null}

      {loadingSession ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: Spacing.xl }} />
      ) : session ? (
        <>
          <Text style={styles.sectionTitle}>{t('workoutSummary.exerciseBreakdown')}</Text>
          <ExerciseBreakdown exercises={session.exercises} />
        </>
      ) : null}
    </ScrollView>
  );
}

function getStyles(c: ColorPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    scroll: { padding: Spacing['2xl'] },

    hero: { alignItems: 'center', marginBottom: Spacing['3xl'] },
    trophyCircle: {
      width: 100, height: 100, borderRadius: 50,
      backgroundColor: c.primaryDim, borderWidth: 2, borderColor: c.primary,
      alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl,
    },
    title: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: c.textPrimary },
    workoutName: { fontSize: Typography.lg, fontWeight: Typography.semibold, color: c.primary, marginTop: 4 },
    subtitle: { fontSize: Typography.base, color: c.textSecondary, marginTop: Spacing.sm },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing['2xl'] },
    statCard: {
      flex: 1, minWidth: '45%', backgroundColor: c.surface,
      borderRadius: Radius.lg, borderWidth: 1, borderColor: c.surfaceBorder,
      padding: Spacing.base, alignItems: 'center', gap: 4,
    },
    statValue: { fontSize: Typography.xl, fontWeight: Typography.bold, color: c.textPrimary, marginTop: Spacing.xs },
    statLabel: { fontSize: Typography.sm, color: c.textTertiary },
    primaryBtn: { marginBottom: Spacing.sm },
    secondaryBtn: { marginBottom: Spacing.sm },
    sectionTitle: {
      fontSize: Typography.lg, fontWeight: Typography.bold, color: c.textPrimary,
      marginTop: Spacing.xl, marginBottom: Spacing.base,
    },
  });
}

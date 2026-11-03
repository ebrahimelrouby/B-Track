import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

import { useColors, ColorPalette, Spacing, Typography, Radius } from '@/theme';
import { WorkoutSession } from '@/types';
import { WorkoutStackParamList } from '@/navigation/types';
import { workoutApi } from '@/api/workout.api';
import ExerciseBreakdown from '@/components/workout/ExerciseBreakdown';

type RouteProps = RouteProp<WorkoutStackParamList, 'SessionDetail'>;

function formatDuration(s?: number) {
  if (!s) return '—';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

export default function SessionDetailScreen() {
  const { params } = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const { t } = useTranslation();

  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    workoutApi.getHistory(0, 200).then(res => {
      setSession(res.content.find(s => s.id === params.sessionId) ?? null);
    }).finally(() => setLoading(false));
  }, [params.sessionId]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }

  if (!session) {
    return (
      <View style={styles.center}>
        <Icon name="alert-circle-outline" size={48} color={colors.textTertiary} />
        <Text style={styles.notFound}>{t('sessionDetail.notFound')}</Text>
      </View>
    );
  }

  const date = new Date(session.startedAt);
  const dateStr = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const totalSets = session.exercises?.reduce((s, ex) => s + (ex.sets?.length ?? 0), 0) ?? 0;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]}
    >
      <Text style={styles.name}>{session.name}</Text>
      <Text style={styles.date}>{dateStr} · {timeStr}</Text>

      <View style={styles.statsRow}>
        {[
          { icon: 'clock-outline', label: t('sessionDetail.statDuration'), value: formatDuration(session.durationSeconds) },
          { icon: 'weight', label: t('sessionDetail.statVolume'), value: session.totalVolumeKg ? `${session.totalVolumeKg}kg` : '—' },
          { icon: 'dumbbell', label: t('sessionDetail.statSets'), value: String(totalSets) },
          // Only present when the workout was finished from the Apple Watch
          ...(session.avgHeartRate != null
            ? [{ icon: 'heart-pulse', label: t('sessionDetail.statAvgHeartRate'), value: `${session.avgHeartRate} bpm` }]
            : []),
          ...(session.activeCalories != null
            ? [{ icon: 'fire', label: t('sessionDetail.statActiveCalories'), value: `${Math.round(session.activeCalories)} kcal` }]
            : []),
        ].map(s => (
          <View key={s.label} style={styles.statChip}>
            <Icon name={s.icon} size={16} color={colors.primary} />
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <ExerciseBreakdown exercises={session.exercises} />
    </ScrollView>
  );
}

function getStyles(c: ColorPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    content: { padding: Spacing.base },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background },
    notFound: { color: c.textSecondary, fontSize: Typography.base, marginTop: Spacing.md },

    name: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: c.textPrimary, marginBottom: 4 },
    date: { fontSize: Typography.sm, color: c.textTertiary, marginBottom: Spacing.xl },

    statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl },
    statChip: {
      flexBasis: '30%', flexGrow: 1, alignItems: 'center', gap: 4,
      backgroundColor: c.surface, borderRadius: Radius.lg,
      borderWidth: 1, borderColor: c.surfaceBorder, padding: Spacing.md,
    },
    statValue: { fontSize: Typography.md, fontWeight: Typography.bold, color: c.textPrimary },
    statLabel: { fontSize: Typography.xs, color: c.textTertiary },
  });
}

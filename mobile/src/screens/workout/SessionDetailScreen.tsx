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
import Card from '@/components/common/Card';

type RouteProps = RouteProp<WorkoutStackParamList, 'SessionDetail'>;

function formatDuration(s?: number) {
  if (!s) return '—';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

function fmt(n?: number) { return n != null ? String(n) : '—'; }

const MUSCLE_COLORS: Record<string, string> = {
  CHEST: '#EF4444', BACK: '#3B82F6', SHOULDERS: '#8B5CF6',
  BICEPS: '#06B6D4', TRICEPS: '#F59E0B', CORE: '#EC4899',
  QUADRICEPS: '#22C55E', HAMSTRINGS: '#22C55E', CALVES: '#22C55E',
  CARDIO: '#F97316', FULL_BODY: '#AAFF00',
};

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
        ].map(s => (
          <View key={s.label} style={styles.statChip}>
            <Icon name={s.icon} size={16} color={colors.primary} />
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {session.exercises?.map((ex, ei) => {
        const muscleColor = MUSCLE_COLORS[ex.exercise?.muscleGroup] ?? colors.textTertiary;
        return (
          <Card key={ei} style={styles.exCard}>
            <View style={styles.exHeader}>
              <View style={[styles.muscleChip, { backgroundColor: muscleColor + '22' }]}>
                <Text style={[styles.muscleChipText, { color: muscleColor }]}>
                  {ex.exercise?.muscleGroup?.replace(/_/g, ' ')}
                </Text>
              </View>
            </View>
            <Text style={styles.exName}>{ex.exercise?.name ?? 'Exercise'}</Text>
            <View style={styles.setTable}>
              <View style={styles.setRow}>
                {[t('sessionDetail.colSet'), t('sessionDetail.colWeight'), t('sessionDetail.colReps'), ''].map(h => (
                  <Text key={h} style={[styles.setCell, styles.setHeader]}>{h}</Text>
                ))}
              </View>
              {ex.sets?.map((set, si) => (
                <View key={si} style={[styles.setRow, si % 2 === 0 && styles.setRowAlt]}>
                  <Text style={styles.setCell}>{set.setNumber ?? si + 1}</Text>
                  <Text style={styles.setCell}>{set.weightKg ? `${set.weightKg}kg` : '—'}</Text>
                  <Text style={styles.setCell}>{fmt(set.reps)}</Text>
                  <View style={styles.setCell}>
                    <Icon
                      name={set.isCompleted ? 'check-circle' : 'circle-outline'}
                      size={16}
                      color={set.isCompleted ? colors.success : colors.textTertiary}
                    />
                  </View>
                </View>
              ))}
            </View>
          </Card>
        );
      })}
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

    statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
    statChip: {
      flex: 1, alignItems: 'center', gap: 4,
      backgroundColor: c.surface, borderRadius: Radius.lg,
      borderWidth: 1, borderColor: c.surfaceBorder, padding: Spacing.md,
    },
    statValue: { fontSize: Typography.md, fontWeight: Typography.bold, color: c.textPrimary },
    statLabel: { fontSize: Typography.xs, color: c.textTertiary },

    exCard: { marginBottom: Spacing.md, padding: 0, overflow: 'hidden' },
    exHeader: { paddingHorizontal: Spacing.base, paddingTop: Spacing.base },
    muscleChip: { alignSelf: 'flex-start', paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full, marginBottom: 6 },
    muscleChipText: { fontSize: Typography.xs, fontWeight: Typography.semibold },
    exName: { fontSize: Typography.base, fontWeight: Typography.semibold, color: c.textPrimary, paddingHorizontal: Spacing.base, paddingBottom: Spacing.md },

    setTable: { borderTopWidth: 1, borderTopColor: c.surfaceBorder },
    setRow: { flexDirection: 'row', paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, alignItems: 'center' },
    setRowAlt: { backgroundColor: c.surfaceElevated },
    setCell: { flex: 1, fontSize: Typography.sm, color: c.textSecondary, alignItems: 'center' },
    setHeader: { color: c.textTertiary, fontSize: Typography.xs, fontWeight: Typography.semibold },
  });
}

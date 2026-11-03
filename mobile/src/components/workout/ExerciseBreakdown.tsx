import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

import { useColors, ColorPalette, Spacing, Typography, Radius } from '@/theme';
import { SessionExercise } from '@/types';
import Card from '@/components/common/Card';

const MUSCLE_COLORS: Record<string, string> = {
  CHEST: '#EF4444', BACK: '#3B82F6', SHOULDERS: '#8B5CF6',
  BICEPS: '#06B6D4', TRICEPS: '#F59E0B', CORE: '#EC4899',
  QUADRICEPS: '#22C55E', HAMSTRINGS: '#22C55E', CALVES: '#22C55E',
  CARDIO: '#F97316', FULL_BODY: '#AAFF00',
};

function fmt(n?: number) { return n != null ? String(n) : '—'; }

// Per-exercise, per-set breakdown — shared between SessionDetailScreen
// (viewing history) and WorkoutSummaryScreen (right after finishing), so
// both show the exact same "full session info" rather than two renderers
// that can drift apart.
export default function ExerciseBreakdown({ exercises }: { exercises?: SessionExercise[] }) {
  const colors = useColors();
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const { t } = useTranslation();

  return (
    <>
      {exercises?.map((ex, ei) => {
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
    </>
  );
}

function getStyles(c: ColorPalette) {
  return StyleSheet.create({
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

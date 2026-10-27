import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors, ColorPalette, Spacing, Typography, Radius } from '@/theme';
import { MuscleGroup, ExerciseDifficulty } from '@/types';
import { WorkoutStackParamList } from '@/navigation/types';
import Card from '@/components/common/Card';
import ExerciseMediaView from '@/media/ExerciseMediaView';
import { useTranslation } from 'react-i18next';

type RouteProps = RouteProp<WorkoutStackParamList, 'ExerciseDetail'>;

const MUSCLE_COLORS: Record<MuscleGroup, string> = {
  CHEST: '#EF4444', BACK: '#3B82F6', SHOULDERS: '#8B5CF6',
  BICEPS: '#06B6D4', TRICEPS: '#F59E0B', FOREARMS: '#F97316',
  CORE: '#EC4899', GLUTES: '#22C55E', QUADRICEPS: '#22C55E',
  HAMSTRINGS: '#22C55E', CALVES: '#22C55E', FULL_BODY: '#AAFF00',
  CARDIO: '#F97316', OTHER: '#6B6B6B',
};

const MUSCLE_ICONS: Record<MuscleGroup, string> = {
  CHEST: 'weight-lifter', BACK: 'human-handsup', SHOULDERS: 'arm-flex',
  BICEPS: 'arm-flex', TRICEPS: 'arm-flex', FOREARMS: 'arm-flex',
  CORE: 'yoga', GLUTES: 'run', QUADRICEPS: 'run',
  HAMSTRINGS: 'run', CALVES: 'run-fast', FULL_BODY: 'human',
  CARDIO: 'heart-pulse', OTHER: 'dumbbell',
};

const DIFFICULTY_COLORS: Record<ExerciseDifficulty, string> = {
  BEGINNER: '#22C55E', INTERMEDIATE: '#F59E0B', ADVANCED: '#EF4444',
};

const MUSCLE_TIPS: Partial<Record<MuscleGroup, string[]>> = {
  CHEST: ['Keep your back flat on the bench', 'Control the descent', 'Breathe out on the push'],
  BACK: ['Drive elbows back, not out', 'Squeeze shoulder blades at peak contraction', 'Keep your chest up throughout the movement'],
  SHOULDERS: ['Avoid shrugging your traps during the lift', 'Control the eccentric phase carefully', 'Keep your core braced to protect your spine'],
  QUADRICEPS: ['Keep your knees tracking over your toes', 'Drive through your heels on the way up', 'Maintain an upright torso for quad activation'],
  HAMSTRINGS: ['Feel the full stretch at the bottom of the range', 'Avoid rounding your lower back', 'Keep your hips level throughout'],
  BICEPS: ['Keep your elbows pinned to your sides', 'Supinate at the top for peak contraction', 'Avoid swinging to generate momentum'],
  TRICEPS: ['Lock out fully at the top of every rep', 'Keep elbows stable and avoid flaring', 'Control the eccentric for maximum tension'],
  CORE: ['Brace your abs as if taking a punch', 'Do not hold your breath — breathe consistently', 'Maintain a neutral spine throughout'],
  CALVES: ['Use full range of motion for each rep', 'Pause at the bottom to feel the stretch', 'Slow tempo improves isolation significantly'],
  CARDIO: ['Stay within your target heart rate zone', 'Breathe rhythmically to sustain effort', 'Keep your shoulders relaxed and posture tall'],
};

const DEFAULT_TIPS = [
  'Focus on the mind-muscle connection',
  'Prioritize form over weight',
  'Maintain consistent breathing throughout',
];

const DEMO_H = 240;

export default function ExerciseDetailScreen() {
  const { params } = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const { t } = useTranslation();
  const [infoExpanded, setInfoExpanded] = useState(true);

  const { exercise } = params;

  const muscleColor = exercise.iconColor ?? MUSCLE_COLORS[exercise.muscleGroup];
  const difficultyColor = DIFFICULTY_COLORS[exercise.difficulty];
  const muscleIcon = exercise.iconName ?? MUSCLE_ICONS[exercise.muscleGroup];
  const tips = MUSCLE_TIPS[exercise.muscleGroup] ?? DEFAULT_TIPS;

  const steps = exercise.instructions
    ? exercise.instructions.split('. ').map(s => s.trim().replace(/\.$/, '')).filter(s => s.length > 0)
    : [];

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <View style={styles.badgeRow}>
          <View style={[styles.chip, { backgroundColor: muscleColor + '22' }]}>
            <Text style={[styles.chipText, { color: muscleColor }]}>
              {exercise.muscleGroup.replace(/_/g, ' ')}
            </Text>
          </View>
          <View style={styles.badge}>
            <Icon name="dumbbell" size={12} color={colors.textSecondary} />
            <Text style={styles.badgeText}>{exercise.equipment.replace(/_/g, ' ')}</Text>
          </View>
          <View style={[styles.badge, { borderColor: difficultyColor + '55' }]}>
            <View style={[styles.difficultyDot, { backgroundColor: difficultyColor }]} />
            <Text style={[styles.badgeText, { color: difficultyColor }]}>{exercise.difficulty}</Text>
          </View>
        </View>
      </View>

      {/* Exercise Media */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('exerciseDetail.demoTitle')}</Text>
          <View style={styles.gifBadge}>
            <Icon name="motion-play-outline" size={12} color={colors.primary} />
            <Text style={styles.gifBadgeText}>{t('exerciseDetail.demoLabel')}</Text>
          </View>
        </View>
        <View style={[styles.demoWrap, { backgroundColor: colors.surfaceElevated, borderColor: colors.surfaceBorder }]}>
          <ExerciseMediaView
            exerciseId={exercise.id}
            exerciseName={exercise.name}
            muscleGroup={exercise.muscleGroup}
            accentColor={muscleColor}
          />
        </View>
      </View>

      {/* How to Perform */}
      {steps.length > 0 && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setInfoExpanded(v => !v)}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeaderLeft}>
              <Icon name="information-outline" size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>{t('exerciseDetail.howToPerform')}</Text>
            </View>
            <Icon name={infoExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textTertiary} />
          </TouchableOpacity>
          {infoExpanded && (
            <Card style={styles.stepsCard}>
              {steps.map((step, index) => (
                <View key={index} style={[styles.stepRow, index < steps.length - 1 && styles.stepRowBorder]}>
                  <View style={[styles.stepNumber, { backgroundColor: muscleColor + '22' }]}>
                    <Text style={[styles.stepNumberText, { color: muscleColor }]}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </Card>
          )}
        </View>
      )}

      {/* Muscle info */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>{t('exerciseDetail.muscleGroup')}</Text>
        <Card style={styles.muscleCard}>
          <View style={styles.muscleRow}>
            <View style={[styles.muscleIconWrap, { backgroundColor: muscleColor + '22' }]}>
              <Icon name={muscleIcon} size={28} color={muscleColor} />
            </View>
            <View style={styles.muscleInfo}>
              <Text style={styles.muscleName}>{exercise.muscleGroup.replace(/_/g, ' ')}</Text>
              <Text style={styles.muscleSubtitle}>{t('exerciseDetail.primaryMuscle')}</Text>
            </View>
          </View>
          <View style={styles.muscleMetaRow}>
            <View style={styles.muscleMeta}>
              <Icon name="weight" size={14} color={colors.textTertiary} />
              <Text style={styles.muscleMetaText}>{exercise.equipment.replace(/_/g, ' ')}</Text>
            </View>
            <View style={styles.muscleMeta}>
              <Icon name="signal" size={14} color={difficultyColor} />
              <Text style={[styles.muscleMetaText, { color: difficultyColor }]}>{exercise.difficulty}</Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Tips */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderLeft}>
          <Icon name="lightbulb-on-outline" size={18} color={colors.primary} />
          <Text style={styles.sectionTitle}>{t('exerciseDetail.proTips')}</Text>
        </View>
        <View style={styles.tipsContainer}>
          {tips.map((tip, index) => (
            <View key={index} style={styles.tipRow}>
              <View style={styles.tipBullet}>
                <Icon name="lightbulb-on" size={14} color={colors.primary} />
              </View>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* PRs */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderLeft}>
          <Icon name="trophy-outline" size={18} color={colors.primary} />
          <Text style={styles.sectionTitle}>{t('exerciseDetail.personalRecords')}</Text>
        </View>
        <Card style={styles.prEmpty}>
          <Icon name="trophy-outline" size={36} color={colors.textTertiary} />
          <Text style={styles.prEmptyTitle}>{t('exerciseDetail.noRecords')}</Text>
          <Text style={styles.prEmptySubtitle}>{t('exerciseDetail.noRecordsDesc')}</Text>
        </Card>
      </View>
    </ScrollView>
  );
}

function getStyles(c: ColorPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    center: { justifyContent: 'center', alignItems: 'center' },
    content: { padding: Spacing.base },
    errorText: { color: c.textSecondary, fontSize: Typography.base, marginTop: Spacing.md },

    header: { marginBottom: Spacing.xl },
    exerciseName: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: c.textPrimary, marginBottom: Spacing.md, lineHeight: 34 },
    badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    chip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full },
    chipText: { fontSize: Typography.sm, fontWeight: Typography.semibold },
    badge: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
      borderRadius: Radius.sm, backgroundColor: c.surfaceElevated,
      borderWidth: 1, borderColor: c.surfaceBorder,
    },
    badgeText: { fontSize: Typography.xs, color: c.textSecondary, fontWeight: Typography.medium, textTransform: 'capitalize' },
    difficultyDot: { width: 6, height: 6, borderRadius: 3 },

    section: { marginBottom: Spacing.xl },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
    sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
    sectionTitle: { fontSize: Typography.md, fontWeight: Typography.semibold, color: c.textPrimary },
    sectionTitleSpaced: { marginBottom: Spacing.md },
    gifBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: Spacing.sm, paddingVertical: 3,
      borderRadius: Radius.sm, backgroundColor: c.primaryDim,
      borderWidth: 1, borderColor: c.primary + '44',
    },
    gifBadgeText: { fontSize: Typography.xs, fontWeight: Typography.bold, color: c.primary },
    demoWrap: {
      height: DEMO_H, borderRadius: Radius.xl, overflow: 'hidden',
      borderWidth: 1,
    },

    stepsCard: { padding: 0, overflow: 'hidden' },
    stepRow: { flexDirection: 'row', alignItems: 'flex-start', padding: Spacing.base, gap: Spacing.md },
    stepRowBorder: { borderBottomWidth: 1, borderBottomColor: c.surfaceBorder },
    stepNumber: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    stepNumberText: { fontSize: Typography.sm, fontWeight: Typography.bold },
    stepText: { flex: 1, fontSize: Typography.base, color: c.textSecondary, lineHeight: 22 },

    muscleCard: { gap: Spacing.md },
    muscleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    muscleIconWrap: { width: 52, height: 52, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
    muscleInfo: { flex: 1 },
    muscleName: { fontSize: Typography.base, fontWeight: Typography.semibold, color: c.textPrimary, textTransform: 'capitalize' },
    muscleSubtitle: { fontSize: Typography.sm, color: c.textTertiary, marginTop: 2 },
    muscleMetaRow: { flexDirection: 'row', gap: Spacing.xl, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: c.surfaceBorder },
    muscleMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    muscleMetaText: { fontSize: Typography.sm, color: c.textTertiary, textTransform: 'capitalize' },

    tipsContainer: { gap: Spacing.sm },
    tipRow: {
      flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
      backgroundColor: c.surface, borderRadius: Radius.md, padding: Spacing.md,
      borderWidth: 1, borderColor: c.surfaceBorder,
    },
    tipBullet: {
      width: 26, height: 26, borderRadius: Radius.sm,
      backgroundColor: c.primaryDim, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    tipText: { flex: 1, fontSize: Typography.base, color: c.textSecondary, lineHeight: 22 },

    prEmpty: { alignItems: 'center', paddingVertical: Spacing['2xl'], gap: Spacing.sm },
    prEmptyTitle: { fontSize: Typography.base, fontWeight: Typography.semibold, color: c.textSecondary, marginTop: Spacing.sm },
    prEmptySubtitle: { fontSize: Typography.sm, color: c.textTertiary, textAlign: 'center', lineHeight: 20, paddingHorizontal: Spacing.base },
  });
}
